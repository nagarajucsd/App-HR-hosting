import express from 'express';
import Employee from '../models/Employee.js';
import Attendance from '../models/Attendance.js';
import LeaveRequest from '../models/LeaveRequest.js';
import Payroll from '../models/Payroll.js';
import ExitInterview from '../models/ExitInterview.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/reports/employee
// @desc    Get employee report
// @access  Private (Admin, HR, Manager)
router.get('/employee', protect, authorize('Admin', 'HR', 'Manager'), async (req, res) => {
  try {
    const { departmentId, status, employeeType, startDate, endDate } = req.query;
    
    let query = {};
    
    if (departmentId) {
      query.departmentId = departmentId;
    }
    
    if (status) {
      query.status = status;
    }
    
    if (employeeType) {
      query.employeeType = employeeType;
    }

    if (startDate || endDate) {
      query.joinDate = {};
      if (startDate) {
        query.joinDate.$gte = new Date(startDate);
      }
      if (endDate) {
        query.joinDate.$lte = new Date(endDate);
      }
    }

    const employees = await Employee.find(query)
      .populate('departmentId')
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 });

    const report = {
      totalEmployees: employees.length,
      byDepartment: {},
      byStatus: {},
      byEmployeeType: {},
      employees: employees
    };

    // Group by department
    employees.forEach(emp => {
      const deptName = emp.departmentId?.name || 'Unknown';
      report.byDepartment[deptName] = (report.byDepartment[deptName] || 0) + 1;
    });

    // Group by status
    employees.forEach(emp => {
      report.byStatus[emp.status] = (report.byStatus[emp.status] || 0) + 1;
    });

    // Group by employee type
    employees.forEach(emp => {
      report.byEmployeeType[emp.employeeType] = (report.byEmployeeType[emp.employeeType] || 0) + 1;
    });

    res.json(report);
  } catch (error) {
    console.error('Get employee report error:', error);
    res.status(500).json({ message: 'Server error generating employee report' });
  }
});

// @route   GET /api/reports/attendance
// @desc    Get attendance report
// @access  Private (Admin, HR, Manager)
router.get('/attendance', protect, authorize('Admin', 'HR', 'Manager'), async (req, res) => {
  try {
    const { employeeId, startDate, endDate, status } = req.query;
    
    let query = {};
    
    if (employeeId) {
      query.employeeId = employeeId;
    }
    
    if (status) {
      query.status = status;
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        query.date.$lte = new Date(endDate);
      }
    }

    const attendanceRecords = await Attendance.find(query)
      .populate('employeeId')
      .sort({ date: -1 });

    const report = {
      totalRecords: attendanceRecords.length,
      byStatus: {},
      totalWorkingHours: 0,
      averageWorkingHours: 0,
      records: attendanceRecords
    };

    // Calculate statistics
    attendanceRecords.forEach(record => {
      report.byStatus[record.status] = (report.byStatus[record.status] || 0) + 1;
      if (record.workingHours) {
        report.totalWorkingHours += record.workingHours;
      }
    });

    if (attendanceRecords.length > 0) {
      report.averageWorkingHours = (report.totalWorkingHours / attendanceRecords.length).toFixed(2);
    }

    res.json(report);
  } catch (error) {
    console.error('Get attendance report error:', error);
    res.status(500).json({ message: 'Server error generating attendance report' });
  }
});

// @route   GET /api/reports/leave
// @desc    Get leave report
// @access  Private (Admin, HR, Manager)
router.get('/leave', protect, authorize('Admin', 'HR', 'Manager'), async (req, res) => {
  try {
    const { employeeId, status, leaveType, startDate, endDate } = req.query;
    
    let query = {};
    
    if (employeeId) {
      query.employeeId = employeeId;
    }
    
    if (status) {
      query.status = status;
    }
    
    if (leaveType) {
      query.leaveType = leaveType;
    }

    if (startDate || endDate) {
      query.startDate = {};
      if (startDate) {
        query.startDate.$gte = new Date(startDate);
      }
      if (endDate) {
        query.startDate.$lte = new Date(endDate);
      }
    }

    const leaveRequests = await LeaveRequest.find(query)
      .populate('employeeId')
      .sort({ createdAt: -1 });

    const report = {
      totalRequests: leaveRequests.length,
      byStatus: {},
      byLeaveType: {},
      totalDays: 0,
      requests: leaveRequests
    };

    // Calculate statistics
    leaveRequests.forEach(leave => {
      report.byStatus[leave.status] = (report.byStatus[leave.status] || 0) + 1;
      report.byLeaveType[leave.leaveType] = (report.byLeaveType[leave.leaveType] || 0) + 1;
      report.totalDays += leave.days || 0;
    });

    res.json(report);
  } catch (error) {
    console.error('Get leave report error:', error);
    res.status(500).json({ message: 'Server error generating leave report' });
  }
});

// @route   GET /api/reports/payroll
// @desc    Get payroll report
// @access  Private (Admin, HR)
router.get('/payroll', protect, authorize('Admin', 'HR'), async (req, res) => {
  try {
    const { month, year, status } = req.query;
    
    let query = {};
    
    if (month !== undefined) {
      query.month = parseInt(month);
    }
    
    if (year) {
      query.year = parseInt(year);
    }
    
    if (status) {
      query.status = status;
    }

    const payrollRecords = await Payroll.find(query)
      .populate('employeeId')
      .populate('approvedBy', 'name email')
      .sort({ year: -1, month: -1 });

    const report = {
      totalRecords: payrollRecords.length,
      byStatus: {},
      totalGrossPay: 0,
      totalNetPay: 0,
      totalDeductions: 0,
      records: payrollRecords
    };

    // Calculate statistics
    payrollRecords.forEach(payroll => {
      report.byStatus[payroll.status] = (report.byStatus[payroll.status] || 0) + 1;
      report.totalGrossPay += payroll.grossPay || 0;
      report.totalNetPay += payroll.netPay || 0;
      
      const totalDed = (payroll.deductions?.tax || 0) + 
                       (payroll.deductions?.providentFund || 0) + 
                       (payroll.deductions?.absence || 0);
      report.totalDeductions += totalDed;
    });

    res.json(report);
  } catch (error) {
    console.error('Get payroll report error:', error);
    res.status(500).json({ message: 'Server error generating payroll report' });
  }
});

// @route   GET /api/reports/exit-interviews
// @desc    Get exit interviews report
// @access  Private (Admin, HR)
router.get('/exit-interviews', protect, authorize('Admin', 'HR'), async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;
    
    let query = {};
    
    if (status) {
      query.status = status;
    }

    if (startDate || endDate) {
      query.resignationDate = {};
      if (startDate) {
        query.resignationDate.$gte = new Date(startDate);
      }
      if (endDate) {
        query.resignationDate.$lte = new Date(endDate);
      }
    }

    const exitInterviews = await ExitInterview.find(query)
      .populate('employeeId')
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    const report = {
      totalInterviews: exitInterviews.length,
      byReason: {},
      byStatus: {},
      averageRatings: {
        overall: 0,
        management: 0,
        workEnvironment: 0,
        compensation: 0,
        careerGrowth: 0
      },
      wouldRecommendCount: 0,
      wouldRejoinCount: 0,
      interviews: exitInterviews
    };

    let totalRatings = {
      overall: 0,
      management: 0,
      workEnvironment: 0,
      compensation: 0,
      careerGrowth: 0
    };

    // Calculate statistics
    exitInterviews.forEach(interview => {
      report.byReason[interview.reasonForLeaving] = (report.byReason[interview.reasonForLeaving] || 0) + 1;
      report.byStatus[interview.status] = (report.byStatus[interview.status] || 0) + 1;
      
      totalRatings.overall += interview.overallExperience || 0;
      totalRatings.management += interview.managementRating || 0;
      totalRatings.workEnvironment += interview.workEnvironmentRating || 0;
      totalRatings.compensation += interview.compensationRating || 0;
      totalRatings.careerGrowth += interview.careerGrowthRating || 0;
      
      if (interview.wouldRecommend) report.wouldRecommendCount++;
      if (interview.wouldRejoin) report.wouldRejoinCount++;
    });

    if (exitInterviews.length > 0) {
      report.averageRatings.overall = (totalRatings.overall / exitInterviews.length).toFixed(2);
      report.averageRatings.management = (totalRatings.management / exitInterviews.length).toFixed(2);
      report.averageRatings.workEnvironment = (totalRatings.workEnvironment / exitInterviews.length).toFixed(2);
      report.averageRatings.compensation = (totalRatings.compensation / exitInterviews.length).toFixed(2);
      report.averageRatings.careerGrowth = (totalRatings.careerGrowth / exitInterviews.length).toFixed(2);
    }

    res.json(report);
  } catch (error) {
    console.error('Get exit interviews report error:', error);
    res.status(500).json({ message: 'Server error generating exit interviews report' });
  }
});

// @route   GET /api/reports/dashboard-stats
// @desc    Get dashboard statistics
// @access  Private (Admin, HR, Manager)
router.get('/dashboard-stats', protect, authorize('Admin', 'HR', 'Manager'), async (req, res) => {
  try {
    // Get current month/year
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const startOfMonth = new Date(currentYear, currentMonth, 1);
    const endOfMonth = new Date(currentYear, currentMonth + 1, 0);

    // Count employees
    const totalEmployees = await Employee.countDocuments({ status: 'Active' });
    const newEmployeesThisMonth = await Employee.countDocuments({
      status: 'Active',
      joinDate: { $gte: startOfMonth, $lte: endOfMonth }
    });

    // Count leave requests
    const pendingLeaves = await LeaveRequest.countDocuments({ status: 'Pending' });
    const approvedLeavesThisMonth = await LeaveRequest.countDocuments({
      status: 'Approved',
      startDate: { $gte: startOfMonth, $lte: endOfMonth }
    });

    // Count attendance
    const todayAttendance = await Attendance.countDocuments({
      date: {
        $gte: new Date(now.setHours(0, 0, 0, 0)),
        $lt: new Date(now.setHours(23, 59, 59, 999))
      },
      status: 'Present'
    });

    // Count exit interviews
    const pendingExitInterviews = await ExitInterview.countDocuments({ status: 'Pending' });

    // Payroll stats
    const pendingPayroll = await Payroll.countDocuments({ 
      status: 'Pending Approval',
      month: currentMonth,
      year: currentYear
    });

    res.json({
      employees: {
        total: totalEmployees,
        newThisMonth: newEmployeesThisMonth
      },
      leaves: {
        pending: pendingLeaves,
        approvedThisMonth: approvedLeavesThisMonth
      },
      attendance: {
        presentToday: todayAttendance
      },
      exitInterviews: {
        pending: pendingExitInterviews
      },
      payroll: {
        pendingApproval: pendingPayroll
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ message: 'Server error generating dashboard statistics' });
  }
});

export default router;
