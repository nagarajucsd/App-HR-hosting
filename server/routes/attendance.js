import express from 'express';
import Attendance from '../models/Attendance.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/attendance
// @desc    Get all attendance records (with optional filters)
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { employeeId, startDate, endDate } = req.query;
    
    let query = {};
    
    if (employeeId) {
      query.employeeId = employeeId;
    }
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const attendance = await Attendance.find(query)
      .populate('employeeId')
      .sort({ date: -1 });
    
    res.json(attendance);
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({ message: 'Server error fetching attendance' });
  }
});

// @route   GET /api/attendance/:id
// @desc    Get attendance record by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id).populate('employeeId');
    
    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    res.json(attendance);
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({ message: 'Server error fetching attendance' });
  }
});

// @route   POST /api/attendance
// @desc    Create attendance record (clock in)
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { employeeId, date, status, clockIn } = req.body;

    // Check if attendance already exists for this employee and date
    const existingAttendance = await Attendance.findOne({
      employeeId,
      date: new Date(date)
    });

    if (existingAttendance) {
      return res.status(400).json({ message: 'Attendance already exists for this date' });
    }

    const attendance = await Attendance.create({
      employeeId,
      date: new Date(date),
      status: status || 'Present',
      clockIn: clockIn || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
    });

    const populatedAttendance = await Attendance.findById(attendance._id).populate('employeeId');

    res.status(201).json(populatedAttendance);
  } catch (error) {
    console.error('Create attendance error:', error);
    res.status(500).json({ message: 'Server error creating attendance' });
  }
});

// @route   PUT /api/attendance/:id
// @desc    Update attendance record (clock out, update status)
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id);

    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    const { status, clockIn, clockOut, workHours } = req.body;

    if (status) attendance.status = status;
    if (clockIn) attendance.clockIn = clockIn;
    if (clockOut) attendance.clockOut = clockOut;
    if (workHours) attendance.workHours = workHours;

    const updatedAttendance = await attendance.save();
    const populatedAttendance = await Attendance.findById(updatedAttendance._id).populate('employeeId');

    res.json(populatedAttendance);
  } catch (error) {
    console.error('Update attendance error:', error);
    res.status(500).json({ message: 'Server error updating attendance' });
  }
});

// @route   POST /api/attendance/clock-out
// @desc    Clock out for today
// @access  Private
router.post('/clock-out', protect, async (req, res) => {
  try {
    const { employeeId, clockOut, workHours } = req.body;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      employeeId,
      date: today
    });

    if (!attendance) {
      return res.status(404).json({ message: 'No attendance record found for today' });
    }

    if (attendance.clockOut) {
      return res.status(400).json({ message: 'Already clocked out' });
    }

    attendance.clockOut = clockOut;
    attendance.workHours = workHours;

    const updatedAttendance = await attendance.save();
    const populatedAttendance = await Attendance.findById(updatedAttendance._id).populate('employeeId');

    res.json(populatedAttendance);
  } catch (error) {
    console.error('Clock out error:', error);
    res.status(500).json({ message: 'Server error clocking out' });
  }
});

// @route   DELETE /api/attendance/:id
// @desc    Delete attendance record
// @access  Private (Admin, HR)
router.delete('/:id', protect, authorize('Admin', 'HR'), async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id);

    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    await attendance.deleteOne();

    res.json({ message: 'Attendance record removed' });
  } catch (error) {
    console.error('Delete attendance error:', error);
    res.status(500).json({ message: 'Server error deleting attendance' });
  }
});

export default router;
