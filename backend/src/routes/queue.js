const express = require('express');
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/queue
// List all active queue tokens
router.get('/', async (req, res) => {
  try {
    const { doctorId, status } = req.query;

    const where = {};
    if (doctorId) where.doctorId = doctorId;
    if (status) where.status = status;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    where.createdAt = { gte: today };

    const tokens = await prisma.queueToken.findMany({
      where,
      include: {
        patient: true,
        doctor: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    res.json(tokens);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve queue' });
  }
});

// POST /api/queue/checkin
// Generate a new queue token for a patient
router.post('/checkin', authenticate, async (req, res) => {
  try {
    const { patientId, doctorId, appointmentId } = req.body;

    if (!patientId || !doctorId) {
      return res.status(400).json({ error: 'Patient and Doctor ID are required for check-in.' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingToken = await prisma.queueToken.findFirst({
      where: {
        patientId,
        doctorId,
        appointmentId: appointmentId || undefined,
        createdAt: { gte: today },
        status: { in: ['WAITING', 'CALLING'] }
      },
      include: {
        patient: true,
        doctor: true,
      }
    });

    if (existingToken) {
      return res.status(200).json({
        message: 'Patient is already in the queue.',
        token: existingToken,
      });
    }

    const newToken = await prisma.$transaction(async (tx) => {
      const maxTokenResult = await tx.queueToken.aggregate({
        where: {
          doctorId,
          createdAt: { gte: today },
        },
        _max: {
          tokenNumber: true,
        },
      });

      const nextTokenNumber = (maxTokenResult._max.tokenNumber || 0) + 1;

      return await tx.queueToken.create({
        data: {
          tokenNumber: nextTokenNumber,
          patientId,
          doctorId,
          appointmentId: appointmentId || null,
          status: 'WAITING',
        },
        include: {
          patient: true,
          doctor: true,
        },
      });
    }, {
      isolationLevel: 'Serializable'
    });

    res.status(201).json({
      message: 'Checked in successfully. Token generated.',
      token: newToken,
    });
  } catch (error) {
    console.error('Queue check-in error:', error);
    res.status(500).json({ error: 'Check-in failed' });
  }
});

// PATCH /api/queue/:id
// Update token status (WAITING -> CALLING -> COMPLETED / SKIPPED)
router.patch('/:id', authenticate, async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const updatedToken = await prisma.queueToken.update({
      where: { id: req.params.id },
      data: { status },
      include: {
        patient: true,
        doctor: true,
      },
    });

    if (updatedToken.appointmentId && (status === 'COMPLETED' || status === 'SKIPPED')) {
      const appStatus = status === 'COMPLETED' ? 'COMPLETED' : 'CANCELLED';
      await prisma.appointment.updateMany({
        where: { id: updatedToken.appointmentId },
        data: { status: appStatus },
      });
    }

    res.json(updatedToken);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update queue token' });
  }
});

module.exports = router;
