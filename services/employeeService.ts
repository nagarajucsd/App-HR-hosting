import api from './api';
import { Employee } from '../types';

export const employeeService = {
  // Get all employees
  async getAllEmployees(): Promise<Employee[]> {
    const response = await api.get('/employees');
    return response.data;
  },

  // Get employee by ID
  async getEmployeeById(id: string): Promise<Employee> {
    const response = await api.get(`/employees/${id}`);
    return response.data;
  },

  // Create new employee
  async createEmployee(employee: Omit<Employee, 'id'>): Promise<Employee> {
    const response = await api.post('/employees', employee);
    return response.data;
  },

  // Update employee
  async updateEmployee(id: string, employee: Partial<Employee>): Promise<Employee> {
    const response = await api.put(`/employees/${id}`, employee);
    return response.data;
  },

  // Delete employee
  async deleteEmployee(id: string): Promise<{ message: string }> {
    const response = await api.delete(`/employees/${id}`);
    return response.data;
  },

  // Get employees by department
  async getEmployeesByDepartment(departmentId: string): Promise<Employee[]> {
    const response = await api.get(`/employees/department/${departmentId}`);
    return response.data;
  },
};
