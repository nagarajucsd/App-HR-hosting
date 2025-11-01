import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['Present', 'Absent', 'Leave', 'Half-Day', 'Not Marked'],
    default: 'Not Marked'
  },
  clockIn: {
    type: String,
    default: null
  },
  clockOut: {
    type: String,
    default: null
  },
  workHours: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Create compound index for unique employee-date combination
attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

const Attendance = mongoose.model('Attendance', attendanceSchema);

export default Attendance;
