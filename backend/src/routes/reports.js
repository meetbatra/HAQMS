const express = require('express');
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/reports/doctor-stats
// Aggregate reporting for admin/receptionists dashboard
router.get('/doctor-stats', authenticate, async (req, res) => {
  try {
    const start = Date.now();

    const doctors = await prisma.doctor.findMany();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [appStats, queueStats] = await Promise.all([
      prisma.appointment.groupBy({
        by: ['doctorId', 'status'],
        _count: { id: true },
      }),
      prisma.queueToken.groupBy({
        by: ['doctorId'],
        where: { createdAt: { gte: today } },
        _count: { id: true },
      }),
    ]);

    const reportData = doctors.map(doc => {
      const docAppStats = appStats.filter(s => s.doctorId === doc.id);
      const totalAppointments = docAppStats.reduce((sum, s) => sum + s._count.id, 0);
      const completedAppointments = docAppStats.find(s => s.status === 'COMPLETED')?._count.id || 0;
      const cancelledAppointments = docAppStats.find(s => s.status === 'CANCELLED')?._count.id || 0;
      const todayQueueSize = queueStats.find(q => q.doctorId === doc.id)?._count.id || 0;
      
      const revenue = completedAppointments * doc.consultationFee;

      return {
        id: doc.id,
        name: doc.name,
        specialization: doc.specialization,
        department: doc.department,
        totalAppointments,
        completedAppointments,
        cancelledAppointments,
        todayQueueSize,
        revenue,
      };
    });

    const durationMs = Date.now() - start;

    res.json({
      success: true,
      timeTakenMs: durationMs,
      data: reportData,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

module.exports = router;
