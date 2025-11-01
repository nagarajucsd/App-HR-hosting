import express from 'express';
import ExitInterview from '../models/ExitInterview.js';
import Employee from '../models/Employee.js';
import Notification from '../models/Notification.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/exit-interviews
// @desc    Get all exit interviews
// @access  Private (Admin, HR)
router.get('/', protect, authorize('Admin', 'HR'), async (req, res) => {
  try {
    const { status } = req.query;
    
    let query = {};
    if (status) {
      query.status = status;
    }

    const exitInterviews = await ExitInterview.find(query)
      .populate('employeeId')
      .populate('userId', 'name email')
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 });
    
    res.json(exitInterviews);
  } catch (error) {
    console.error('Get exit interviews error:', error);
    res.status(500).json({ message: 'Server error fetching exit interviews' });
  }
});

// @route   GET /api/exit-interviews/my
// @desc    Get exit interview for logged-in employee
// @access  Private
router.get('/my', protect, async (req, res) => {
  try {
    const exitInterview = await ExitInterview.findOne({ userId: req.user._id })
      .populate('employeeId')
      .populate('reviewedBy', 'name email');
    
    res.json(exitInterview);
  } catch (error) {
    console.error('Get my exit interview error:', error);
    res.status(500).json({ message: 'Server error fetching exit interview' });
  }
});

// @route   GET /api/exit-interviews/:id
// @desc    Get single exit interview
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const exitInterview = await ExitInterview.findById(req.params.id)
      .populate('employeeId')
      .populate('userId', 'name email')
      .populate('reviewedBy', 'name email');
    
    if (!exitInterview) {
      return res.status(404).json({ message: 'Exit interview not found' });
    }

    res.json(exitInterview);
  } catch (error) {
    console.error('Get exit interview error:', error);
    res.status(500).json({ message: 'Server error fetching exit interview' });
  }
});

// @route   POST /api/exit-interviews
// @desc    Submit exit interview
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const employee = await Employee.findOne({ userId: req.user._id });

    if (!employee) {
      return res.status(404).json({ message: 'Employee profile not found' });
    }

    // Check if exit interview already exists
    const existingInterview = await ExitInterview.findOne({ userId: req.user._id });
    if (existingInterview) {
      return res.status(400).json({ message: 'Exit interview already submitted' });
    }

    const exitInterview = await ExitInterview.create({
      ...req.body,
      employeeId: employee._id,
      userId: req.user._id,
      status: 'Pending'
    });

    // Create notification for HR
    await Notification.create({
      userId: null, // Will be sent to all HR/Admin users
      title: 'New Exit Interview Submitted',
      message: `${employee.name} has submitted an exit interview for review`,
      type: 'exit_interview',
      relatedId: exitInterview._id
    });

    const populatedInterview = await ExitInterview.findById(exitInterview._id)
      .populate('employeeId')
      .populate('userId', 'name email');

    res.status(201).json(populatedInterview);
  } catch (error) {
    console.error('Create exit interview error:', error);
    res.status(500).json({ message: 'Server error creating exit interview' });
  }
});

// @route   PUT /api/exit-interviews/:id/approve
// @desc    Approve exit interview
// @access  Private (Admin, HR)
router.put('/:id/approve', protect, authorize('Admin', 'HR'), async (req, res) => {
  try {
    const exitInterview = await ExitInterview.findById(req.params.id);

    if (!exitInterview) {
      return res.status(404).json({ message: 'Exit interview not found' });
    }

    exitInterview.status = 'Approved';
    exitInterview.reviewedBy = req.user._id;
    exitInterview.reviewedAt = new Date();

    await exitInterview.save();

    // Create notification for employee
    await Notification.create({
      userId: exitInterview.userId,
      title: 'Exit Interview Approved',
      message: 'Your exit interview has been approved by HR',
      type: 'exit_interview',
      relatedId: exitInterview._id
    });

    const populatedInterview = await ExitInterview.findById(exitInterview._id)
      .populate('employeeId')
      .populate('userId', 'name email')
      .populate('reviewedBy', 'name email');

    res.json(populatedInterview);
  } catch (error) {
    console.error('Approve exit interview error:', error);
    res.status(500).json({ message: 'Server error approving exit interview' });
  }
});

// @route   PUT /api/exit-interviews/:id/reject
// @desc    Reject exit interview
// @access  Private (Admin, HR)
router.put('/:id/reject', protect, authorize('Admin', 'HR'), async (req, res) => {
  try {
    const { rejectionReason } = req.body;

    const exitInterview = await ExitInterview.findById(req.params.id);

    if (!exitInterview) {
      return res.status(404).json({ message: 'Exit interview not found' });
    }

    exitInterview.status = 'Rejected';
    exitInterview.rejectionReason = rejectionReason || '';
    exitInterview.reviewedBy = req.user._id;
    exitInterview.reviewedAt = new Date();

    await exitInterview.save();

    // Create notification for employee
    await Notification.create({
      userId: exitInterview.userId,
      title: 'Exit Interview Rejected',
      message: `Your exit interview has been rejected. Reason: ${rejectionReason}`,
      type: 'exit_interview',
      relatedId: exitInterview._id
    });

    const populatedInterview = await ExitInterview.findById(exitInterview._id)
      .populate('employeeId')
      .populate('userId', 'name email')
      .populate('reviewedBy', 'name email');

    res.json(populatedInterview);
  } catch (error) {
    console.error('Reject exit interview error:', error);
    res.status(500).json({ message: 'Server error rejecting exit interview' });
  }
});

// @route   DELETE /api/exit-interviews/:id
// @desc    Delete exit interview (before approval)
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const exitInterview = await ExitInterview.findById(req.params.id);

    if (!exitInterview) {
      return res.status(404).json({ message: 'Exit interview not found' });
    }

    // Only allow deletion if pending
    if (exitInterview.status !== 'Pending') {
      return res.status(400).json({ message: 'Cannot delete reviewed exit interview' });
    }

    await exitInterview.deleteOne();

    res.json({ message: 'Exit interview removed' });
  } catch (error) {
    console.error('Delete exit interview error:', error);
    res.status(500).json({ message: 'Server error deleting exit interview' });
  }
});

export default router;
