
import React, { useState, useCallback, useEffect } from 'react';
import Sidebar from './components/layout/Sidebar';
import Topbar from './components/layout/Topbar';
import LoginPage from './components/LoginPage';
// FIX: Corrected imports from the now-fixed types.ts file.
import { User, UserRole, AttendanceRecord, AttendanceStatus, LeaveRequest, Employee, Department, PayrollRecord, LeaveBalance, LeaveStatus, LeaveType, Notification } from './types';
import { ToastProvider, useToast } from './hooks/useToast';
import { mockAttendance, mockLeaveRequests, mockUserWeeklyProgress, mockEmployees, mockDepartments, mockPayroll, initialLeaveBalances, mockUsers, mockNotifications } from './data/mockData';

// Page Components
import DashboardPage from './components/pages/DashboardPage';
import EmployeesPage from './components/pages/EmployeesPage';
import DepartmentsPage from './components/pages/DepartmentsPage';
import AttendancePage from './components/pages/AttendancePage';
import LeavePage from './components/pages/LeavePage';
import LeaveManagementPage from './components/pages/LeaveManagementPage';
import PayrollPage from './components/pages/PayrollPage';
import ReportsPage from './components/pages/ReportsPage';
import ProfilePage from './components/pages/ProfilePage';
import MFASetupPage from './components/mfa/MFASetupPage';
import MFAVerificationPage from './components/mfa/MFAVerificationPage';

type AuthState = 'loggedOut' | 'needsMfaSetup' | 'needsMfaVerification' | 'authenticated';

const FORTY_HOURS_MS = 40 * 60 * 60 * 1000;

// Helper to get a consistent weekly ID using Monday as the start of the week.
const getWeekIdentifier = (d: Date): string => {
    const date = new Date(d);
    const day = date.getDay(); // Sunday - 0, Monday - 1, etc.
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday to go to previous Monday
    date.setDate(diff);
    return date.toISOString().split('T')[0];
};

const formatMillisecondsToHHMMSS = (ms: number) => {
    if (ms < 0) ms = 0;
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const AppContent: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activePage, setActivePage] = useState<string>('Dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [authState, setAuthState] = useState<AuthState>('loggedOut');
  
  // Centralized State
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [employees, setEmployees] = useState<Employee[]>(mockEmployees);
  const [departments, setDepartments] = useState<Department[]>(mockDepartments);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(mockAttendance);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(mockLeaveRequests);
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>(mockPayroll);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>(initialLeaveBalances);
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);

  const [todayAttendanceRecord, setTodayAttendanceRecord] = useState<AttendanceRecord | null>(null);
  
  // New state for weekly timer
  const [weeklyAccumulatedMs, setWeeklyAccumulatedMs] = useState(0);
  const [isWeeklyTimerActive, setIsWeeklyTimerActive] = useState(true);

  const { addToast } = useToast();

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
        ...notification,
        id: `notif-${Date.now()}`,
        timestamp: new Date().toISOString(),
        read: false,
    };
    setNotifications(prev => [newNotification, ...prev]);
  }, []);

  const handleApplyLeave = useCallback((newRequest: Omit<LeaveRequest, 'id' | 'status' | 'days' | 'employeeId' | 'employeeName'>) => {
    if (!currentUser) return;

    const startDate = new Date(newRequest.startDate);
    const endDate = new Date(newRequest.endDate);
    const timeDiff = endDate.getTime() - startDate.getTime();
    const dayDiff = timeDiff / (1000 * 3600 * 24) + 1;

    const fullRequest: LeaveRequest = {
      ...newRequest,
      id: `lr${Date.now()}`,
      status: LeaveStatus.Pending,
      days: dayDiff,
      employeeId: currentUser.id,
      employeeName: currentUser.name,
    };
    
    setLeaveRequests(prev => [fullRequest, ...prev]);

    setLeaveBalances(prev => prev.map(empBalance => {
        if (empBalance.employeeId === currentUser.id) {
            const newBalances = empBalance.balances.map(balance => {
                if (balance.type === newRequest.leaveType) {
                    return { ...balance, pending: balance.pending + dayDiff };
                }
                return balance;
            });
            return { ...empBalance, balances: newBalances };
        }
        return empBalance;
    }));

    addToast({ type: 'success', message: 'Leave request submitted successfully!' });
    addNotification({ title: 'New Leave Request', message: `${currentUser.name} requested ${dayDiff} day(s) of ${newRequest.leaveType} leave.`, link: 'Leave Requests' });

  }, [currentUser, addToast, addNotification]);

  const handleLeaveAction = useCallback((requestId: string, newStatus: LeaveStatus.Approved | LeaveStatus.Rejected, employeeId: string, leaveType: LeaveType, days: number) => {
    setLeaveRequests(prev => prev.map(req => req.id === requestId ? { ...req, status: newStatus } : req));

    setLeaveBalances(prev => prev.map(empBalance => {
        if (empBalance.employeeId === employeeId) {
            const newBalances = empBalance.balances.map(balance => {
                if (balance.type === leaveType) {
                    const updatedBalance = { ...balance, pending: balance.pending - days };
                    if (newStatus === LeaveStatus.Approved) {
                        updatedBalance.used += days;
                    }
                    return updatedBalance;
                }
                return balance;
            });
            return { ...empBalance, balances: newBalances };
        }
        return empBalance;
    }));
    
    const employee = employees.find(e => e.id === employeeId);
    if (employee) {
        addNotification({ title: 'Leave Request Update', message: `Leave request for ${employee.name} has been ${newStatus}.`, link: 'My Leaves' });
    }
    addToast({ type: 'success', message: `Leave request has been ${newStatus.toLowerCase()}.` });
  }, [addToast, addNotification, employees]);

  const handleLogin = useCallback((user: User) => {
    setCurrentUser(user);
    if (user.isMfaSetup) {
      setAuthState('needsMfaVerification');
    } else {
      setAuthState('needsMfaSetup');
    }
  }, []);

  const handleMfaComplete = useCallback((isSetup: boolean) => {
    if (!currentUser) return;

    let userToAuthenticate = currentUser;

    // If this was the initial setup, persist the `isMfaSetup` flag.
    if (isSetup) {
      const updatedUser = { ...currentUser, isMfaSetup: true };
      setCurrentUser(updatedUser);
      setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
      userToAuthenticate = updatedUser; // Use the updated user for the session logic
    }

    // --- Common logic for post-MFA authentication ---

    setAuthState('authenticated');
    setActivePage('Dashboard');

    // --- Initialize Weekly Timer ---
    const today = new Date();
    const currentWeekId = getWeekIdentifier(today);
    const userProgress = mockUserWeeklyProgress[userToAuthenticate.id];

    let accumulatedMs = 0;
    // Load this week's progress if it exists, otherwise start fresh.
    if (userProgress && userProgress.weekIdentifier === currentWeekId) {
      accumulatedMs = userProgress.accumulatedMs;
    } else {
      // It's a new week, so reset the progress.
      mockUserWeeklyProgress[userToAuthenticate.id] = { accumulatedMs: 0, weekIdentifier: currentWeekId };
    }
    setWeeklyAccumulatedMs(accumulatedMs);

    // Check if the user has already completed their 40 hours for the week.
    if (accumulatedMs >= FORTY_HOURS_MS) {
      setIsWeeklyTimerActive(false);
    } else {
      setIsWeeklyTimerActive(true);
    }

    // --- Auto Clock-In Logic ---
    const todayStr = today.toISOString().split('T')[0];
    let userRecordForToday = attendanceRecords.find(rec => rec.employeeId === userToAuthenticate.id && rec.date === todayStr);

    // If the user hasn't clocked in today, automatically clock them in.
    if (!userRecordForToday || !userRecordForToday.clockIn) {
      const clockInTimeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

      if (userRecordForToday) { // Record exists but no clock-in (e.g., marked absent manually)
        const updatedRecord = { ...userRecordForToday, status: AttendanceStatus.Present, clockIn: clockInTimeStr };
        setAttendanceRecords(prev => prev.map(r => r.id === updatedRecord.id ? updatedRecord : r));
        setTodayAttendanceRecord(updatedRecord);
      } else { // No record for today, create a new one.
        const newRecord: AttendanceRecord = {
          id: `att-${Date.now()}`, employeeId: userToAuthenticate.id, date: todayStr,
          status: AttendanceStatus.Present, clockIn: clockInTimeStr,
        };
        setAttendanceRecords(prev => [...prev, newRecord]);
        setTodayAttendanceRecord(newRecord);
      }
    } else {
      // If already clocked in, just set the record for the dashboard.
      setTodayAttendanceRecord(userRecordForToday);
    }
  }, [currentUser, attendanceRecords, setUsers]);


  const handleLogout = useCallback(() => {
    setCurrentUser(null);
    setTodayAttendanceRecord(null);
    setAuthState('loggedOut');
  }, []);

  const handleClockOut = useCallback(() => {
    if (currentUser && todayAttendanceRecord && todayAttendanceRecord.clockIn && !todayAttendanceRecord.clockOut) {
        const now = new Date();
        const clockOutTimeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

        const [time, modifier] = todayAttendanceRecord.clockIn.split(' ');
        let [hours, minutes] = time.split(':').map(Number);
        if (modifier === 'PM' && hours < 12) hours += 12;
        if (modifier === 'AM' && hours === 12) hours = 0;
        
        const [year, month, day] = todayAttendanceRecord.date.split('-').map(Number);
        const clockInDate = new Date(year, month - 1, day, hours, minutes);
        
        const sessionDurationMs = now.getTime() - clockInDate.getTime();
        
        const newAccumulatedMs = isWeeklyTimerActive ? weeklyAccumulatedMs + sessionDurationMs : weeklyAccumulatedMs;
        const sessionWorkHoursStr = formatMillisecondsToHHMMSS(sessionDurationMs);
        
        const updatedRecord = {
            ...todayAttendanceRecord,
            clockOut: clockOutTimeStr,
            workHours: sessionWorkHoursStr,
        };

        setTodayAttendanceRecord(updatedRecord);
        setAttendanceRecords(prev => prev.map(r => r.id === updatedRecord.id ? updatedRecord : r));
        setWeeklyAccumulatedMs(newAccumulatedMs);

        mockUserWeeklyProgress[currentUser.id] = {
            accumulatedMs: newAccumulatedMs,
            weekIdentifier: getWeekIdentifier(now)
        };

        if (newAccumulatedMs >= FORTY_HOURS_MS) {
            setIsWeeklyTimerActive(false);
            addToast({ type: 'success', message: 'You have completed 40 hours for the week!' });
        }
        addToast({ type: 'success', message: 'You have successfully clocked out.' });
    }
  }, [currentUser, todayAttendanceRecord, addToast, weeklyAccumulatedMs, isWeeklyTimerActive]);
  
  const handleAddNewUser = useCallback((newEmployee: Employee) => {
    const newUser: User = {
        id: newEmployee.id,
        name: newEmployee.name,
        email: newEmployee.email,
        role: UserRole.Employee, // New employees are always 'Employee' role
        avatarUrl: newEmployee.avatarUrl,
        isMfaSetup: false,
        mfaSecret: `SECRET_${Date.now()}`.split('').map(c => c.charCodeAt(0).toString(16)).join('').toUpperCase(), // Generate a mock secret
        password: 'password'
    };
    setUsers(prev => [...prev, newUser]);
  }, []);
  
  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => !prev);
  }, []);

  const renderContent = () => {
    if (!currentUser || authState !== 'authenticated') return null;

    const userLeaveBalance = leaveBalances.find(b => b.employeeId === currentUser.id)?.balances || [];

    switch (activePage) {
      case 'Dashboard':
        return <DashboardPage user={currentUser} employees={employees} departments={departments} attendanceRecords={attendanceRecords} leaveRequests={leaveRequests} todayAttendanceRecord={todayAttendanceRecord} onClockOut={handleClockOut} weeklyAccumulatedMs={weeklyAccumulatedMs} isWeeklyTimerActive={isWeeklyTimerActive} leaveBalances={userLeaveBalance} />;
      case 'Employees':
        return <EmployeesPage employees={employees} setEmployees={setEmployees} departments={departments} setLeaveBalances={setLeaveBalances} onAddNewUser={handleAddNewUser} />;
      case 'Departments':
        return <DepartmentsPage departments={departments} setDepartments={setDepartments} employees={employees} />;
      case 'Attendance':
        return <AttendancePage user={currentUser} records={attendanceRecords} setRecords={setAttendanceRecords} employees={employees} departments={departments} />;
      case 'My Leaves':
        return <LeavePage user={currentUser} leaveRequests={leaveRequests} onApplyLeave={handleApplyLeave} leaveBalances={userLeaveBalance} />;
      case 'Leave Requests':
        return <LeaveManagementPage leaveRequests={leaveRequests} onLeaveAction={handleLeaveAction} />;
      case 'Payroll':
        return <PayrollPage user={currentUser} payrollRecords={payrollRecords} setPayrollRecords={setPayrollRecords} employees={employees} departments={departments} attendanceRecords={attendanceRecords} addNotification={addNotification} />;
      case 'Reports':
        return <ReportsPage employees={employees} departments={departments} attendanceRecords={attendanceRecords} leaveRequests={leaveRequests} payrollRecords={payrollRecords} />;
      case 'Profile':
        return <ProfilePage user={currentUser} onUpdateUser={(updatedUser) => setCurrentUser(u => ({...u, ...updatedUser} as User))} />;
      default:
        return <DashboardPage user={currentUser} employees={employees} departments={departments} attendanceRecords={attendanceRecords} leaveRequests={leaveRequests} todayAttendanceRecord={todayAttendanceRecord} onClockOut={handleClockOut} weeklyAccumulatedMs={weeklyAccumulatedMs} isWeeklyTimerActive={isWeeklyTimerActive} leaveBalances={userLeaveBalance} />;
    }
  };

  if (authState === 'loggedOut') {
    return <LoginPage onLogin={handleLogin} users={users} />;
  }
  if (authState === 'needsMfaSetup' && currentUser) {
    return <MFASetupPage user={currentUser} onComplete={() => handleMfaComplete(true)} />;
  }
  if (authState === 'needsMfaVerification' && currentUser) {
    return <MFAVerificationPage onComplete={() => handleMfaComplete(false)} />;
  }

  return (
      <div className="bg-background text-foreground font-sans flex h-screen overflow-hidden">
        <Sidebar 
          currentUserRole={currentUser!.role} 
          activePage={activePage} 
          setActivePage={setActivePage}
          isOpen={isSidebarOpen}
          onClose={toggleSidebar}
        />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Topbar 
            user={currentUser!}
            onLogout={handleLogout}
            onToggleSidebar={toggleSidebar}
            setActivePage={setActivePage}
            notifications={notifications}
            setNotifications={setNotifications}
          />
          <main className="flex-1 overflow-y-auto p-6 lg:p-12">
            {renderContent()}
          </main>
        </div>
      </div>
  );
};

const App: React.FC = () => (
  <ToastProvider>
    <AppContent />
  </ToastProvider>
);

export default App;
