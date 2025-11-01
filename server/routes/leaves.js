import express from 'express';
import LeaveRequest from '../models/LeaveRequest.js';
import LeaveBalance from '../models/LeaveBalance.js';
import Notification from '../models/Notification.js';
import Employee from '../models/Employee.js';
import { protect, authorize } from '../middleware/auth.js';
import { sendLeaveApprovalEmail } from '../utils/emailService.js';

const router = express.Router();

// @route   GET /api/leaves
// @desc    Get all leave requests (with optional filters)
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { employeeId, status } = req.query;
    
    let query = {};
    
    if (employeeId) {
      query.employeeId = employeeId;
    }
    
    if (status) {
      query.status = status;
    }

    const leaves = await LeaveRequest.find(query)
      .populate('employeeId')
      .sort({ createdAt: -1 });
    
    res.json(leaves);
  } catch (error) {
    console.error('Get leaves error:', error);
    res.status(500).json({ message: 'Server error fetching leave requests' });
  }
});

// @route   GET /api/leaves/balance/:employeeId
// @desc    Get leave balance for an employee
// @access  Private
router.get('/balance/:employeeId', protect, async (req, res) => {
  try {
    const leaveBalance = await LeaveBalance.findOne({ 
      employeeId: req.params.employeeId 
    }).populate('employeeId');
    
    if (!leaveBalance) {
      return res.status(404).json({ message: 'Leave balance not found' });
    }

    res.json(leaveBalance);
  } catch (error) {
    console.error('Get leave balance error:', error);
    res.status(500).json({ message: 'Server error fetching leave balance' });
  }
});

// @route   POST /api/leaves
// @desc    Create leave request
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { employeeId, employeeName, leaveType, startDate, endDate, reason } = req.body;

    // Calculate days
    const start = new Date(startDate);
    const end = new Date(endDate);
    const timeDiff = end.getTime() - start.getTime();
    const days = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;

    const leaveRequest = await LeaveRequest.create({
      employeeId,
      employeeName,
      leaveType,
      startDate: start,
      endDate: end,
      reason,
      status: 'Pending',
      days
    });

    // Update leave balance - add to pending
    const leaveBalance = await LeaveBalance.findOne({ employeeId });
    if (leaveBalance) {
      const balanceItem = leaveBalance.balances.find(b => b.type === leaveType);
      if (balanceItem) {
        balanceItem.pending += days;
        await leaveBalance.save();
      }
    }

    // Create notification for HR/Admin
    // This is a simplified version - in production, you'd notify specific users
    
    const populatedLeave = await LeaveRequest.findById(leaveRequest._id).populate('employeeId');

    res.status(201).json(populatedLeave);
  } catch (error) {
    console.error('Create leave error:', error);
    res.status(500).json({ message: 'Server error creating leave request' });
  }
});

// @route   PUT /api/leaves/:id
// @desc    Update leave request (approve/reject)
// @access  Private (Admin, HR, Manager)
router.put('/:id', protect, authorize('Admin', 'HR', 'Manager'), async (req, res) => {
  try {
    const leaveRequest = await LeaveRequest.findById(req.params.id);

    if (!leaveRequest) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    const { status } = req.body;

    if (status && ['Approved', 'Rejected'].includes(status)) {
      leaveRequest.status = status;

      // Update leave balance
      const leaveBalance = await LeaveBalance.findOne({ employeeId: leaveRequest.employeeId });
      if (leaveBalance) {
        const balanceItem = leaveBalance.balances.find(b => b.type === leaveRequest.leaveType);
        if (balanceItem) {
          balanceItem.pending -= leaveRequest.days;
          
          if (status === 'Approved') {
            balanceItem.used += leaveRequest.days;
          }
          
          await leaveBalance.save();
        }
      }

      // Send notification to employee
      const employee = await Employee.findById(leaveRequest.employeeId).populate('userId');
      if (employee && employee.userId) {
        await Notification.create({
          userId: employee.userId._id,
          title: `Leave Request ${status}`,
          message: `Your ${leaveRequest.leaveType} leave request has been ${status.toLowerCase()}`,
          type: 'leave',
          relatedId: leaveRequest._id
        });

        // Send email notification
        await sendLeaveApprovalEmail(
          employee.email,
          employee.name,
          leaveRequest.leaveType,
          status,
          leaveRequest.startDate,
          leaveRequest.endDate
        );
      }
    }

    const updatedLeave = await leaveRequest.save();
    const populatedLeave = await LeaveRequest.findById(updatedLeave._id).populate('employeeId');

    res.json(populatedLeave);
  } catch (error) {
    console.error('Update leave error:', error);
    res.status(500).json({ message: 'Server error updating leave request' });
  }
});

// @route   DELETE /api/leaves/:id
// @desc    Delete leave request
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const leaveRequest = await LeaveRequest.findById(req.params.id);

    if (!leaveRequest) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    // Only allow deletion of pending requests
    if (leaveRequest.status !== 'Pending') {
      return res.status(400).json({ message: 'Cannot delete approved or rejected leave requests' });
    }

    // Update leave balance - remove from pending
    const leaveBalance = await LeaveBalance.findOne({ employeeId: leaveRequest.employeeId });
    if (leaveBalance) {
      const balanceItem = leaveBalance.balances.find(b => b.type === leaveRequest.leaveType);
      if (balanceItem) {
        balanceItem.pending -= leaveRequest.days;
        await leaveBalance.save();
      }
    }

    await leaveRequest.deleteOne();

    res.json({ message: 'Leave request removed' });
  } catch (error) {
    console.error('Delete leave error:', error);
    res.status(500).json({ message: 'Server error deleting leave request' });
  }
});

export default router;
