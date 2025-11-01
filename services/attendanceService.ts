import api from './api';
import { AttendanceRecord } from '../types';

export interface ClockInResponse {
  record: AttendanceRecord;
  message: string;
}

export interface ClockOutResponse {
  record: AttendanceRecord;
  message: string;
}

export const attendanceService = {
  // Get all attendance records
  async getAllAttendance(): Promise<AttendanceRecord[]> {
    const response = await api.get('/attendance');
    return response.data;
  },

  // Get attendance by employee ID
  async getAttendanceByEmployee(employeeId: string): Promise<AttendanceRecord[]> {
    const response = await api.get(`/attendance/employee/${employeeId}`);
    return response.data;
  },

  // Get attendance for date range
  async getAttendanceByDateRange(startDate: string, endDate: string): Promise<AttendanceRecord[]> {
    const response = await api.get('/attendance/range', {
      params: { startDate, endDate }
    });
    return response.data;
  },

  // Clock in
  async clockIn(): Promise<ClockInResponse> {
    const response = await api.post('/attendance/clock-in');
    return response.data;
  },

  // Clock out
  async clockOut(): Promise<ClockOutResponse> {
    const response = await api.post('/attendance/clock-out');
    return response.data;
  },

  // Create attendance record (admin)
  async createAttendanceRecord(record: Omit<AttendanceRecord, 'id'>): Promise<AttendanceRecord> {
    const response = await api.post('/attendance', record);
    return response.data;
  },

  // Update attendance record
  async updateAttendanceRecord(id: string, record: Partial<AttendanceRecord>): Promise<AttendanceRecord> {
    const response = await api.put(`/attendance/${id}`, record);
    return response.data;
  },

  // Delete attendance record
  async deleteAttendanceRecord(id: string): Promise<{ message: string }> {
    const response = await api.delete(`/attendance/${id}`);
    return response.data;
  },

  // Get today's attendance for current user
  async getTodayAttendance(): Promise<AttendanceRecord | null> {
    const response = await api.get('/attendance/today');
    return response.data;
  },
};
