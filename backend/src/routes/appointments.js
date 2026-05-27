const express = require('express');
const prisma = require('../lib/prisma');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// GET /api/appointments
// List all appointments
// PERFORMANCE BUG: Classic N+1 Query Issue!
// Instead of using Prisma's include, it loops through each appointment and executes
// individual select statements for Patient and Doctor details.
router.get('/', authenticate, async (req, res) => {
  try {
    const { doctorId, status } = req.query;

    const where = {};
    if (doctorId) where.doctorId = doctorId;
    if (status) where.status = status;

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        patient: { select: { id: true, name: true, phoneNumber: true, age: true, medicalHistory: true } },
        doctor: { select: { id: true, name: true, specialization: true } },
      },
      orderBy: { appointmentDate: 'asc' },
    });

    res.json({
      success: true,
      count: appointments.length,
      appointments,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve appointments' });
  }
});

// POST /api/appointments
// Book an appointment
// DESIGN BUG: Duplicate-prone schema. No unique index blocks duplicate appointment bookings.
// In this API, we have a half-hearted verification that is easily bypassed or logically flawed,
// allowing multiple bookings for the exact same date and doctor.
router.post('/', authenticate, async (req, res) => {
  try {
    const { patientId, doctorId, appointmentDate, reason } = req.body;

    if (!patientId || !doctorId || !appointmentDate) {
      return res.status(400).json({ error: 'Patient, Doctor, and Appointment Date are required.' });
    }

    const appDate = new Date(appointmentDate);
    const thirtyMins = 30 * 60 * 1000;

    const existingBooking = await prisma.appointment.findFirst({
      where: {
        doctorId,
        status: { not: 'CANCELLED' },
        appointmentDate: {
          gte: new Date(appDate.getTime() - thirtyMins + 1),
          lt: new Date(appDate.getTime() + thirtyMins),
        }
      },
    });

    if (existingBooking) {
      return res.status(400).json({
        error: 'Double booking blocked. Doctor already has an appointment within 30 minutes of this time.',
      });
    }

    const appointment = await prisma.appointment.create({
      data: {
        patientId,
        doctorId,
        appointmentDate: appDate,
        reason: reason || '',
        status: 'PENDING',
      },
    });

    res.status(201).json({
      message: 'Appointment booked successfully',
      appointment,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to book appointment' });
  }
});

// PATCH /api/appointments/:id
// Update appointment status (COMPLETED, CANCELLED, etc.)
router.patch('/:id', authenticate, authorize(['ADMIN', 'RECEPTIONIST', 'DOCTOR']), async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: { doctor: true }
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    if (req.user.role === 'DOCTOR' && appointment.doctor.userId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized to modify this appointment' });
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: { status },
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update appointment' });
  }
});

module.exports = router;
