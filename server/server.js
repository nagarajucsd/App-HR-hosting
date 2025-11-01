import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/database.js';
import path from 'path';
import { fileURLToPath } from 'url';

// Import routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import employeeRoutes from './routes/employees.js';
import departmentRoutes from './routes/departments.js';
import attendanceRoutes from './routes/attendance.js';
import leaveRoutes from './routes/leaves.js';
import payrollRoutes from './routes/payroll.js';
import notificationRoutes from './routes/notifications.js';
import exitInterviewRoutes from './routes/exitInterview.js';
import reportsRoutes from './routes/reports.js';
import apiInfoRoutes from './routes/api-info.js';

// Load environment variables
dotenv.config();

// ✅ Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*', // allow all in production
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/exit-interviews', exitInterviewRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/info', apiInfoRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'HR Management API is running' });
});

// ✅ -------- Serve Frontend (Vite build) --------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// path to frontend build output (after `vite build`)
const frontendPath = path.join(__dirname, '../dist');

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(frontendPath));

  // for any route not starting with /api, send index.html
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}
// ✅ ---------------------------------------------

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
});
