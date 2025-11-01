import api from './api';
import { Department } from '../types';

export const departmentService = {
  // Get all departments
  async getAllDepartments(): Promise<Department[]> {
    const response = await api.get('/departments');
    return response.data;
  },

  // Get department by ID
  async getDepartmentById(id: string): Promise<Department> {
    const response = await api.get(`/departments/${id}`);
    return response.data;
  },

  // Create new department
  async createDepartment(department: Omit<Department, 'id'>): Promise<Department> {
    const response = await api.post('/departments', department);
    return response.data;
  },

  // Update department
  async updateDepartment(id: string, department: Partial<Department>): Promise<Department> {
    const response = await api.put(`/departments/${id}`, department);
    return response.data;
  },

  // Delete department
  async deleteDepartment(id: string): Promise<{ message: string }> {
    const response = await api.delete(`/departments/${id}`);
    return response.data;
  },
};
