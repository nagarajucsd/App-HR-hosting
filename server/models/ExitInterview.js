import mongoose from 'mongoose';

const exitInterviewSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  resignationDate: {
    type: Date,
    required: true
  },
  lastWorkingDay: {
    type: Date,
    required: true
  },
  reasonForLeaving: {
    type: String,
    required: true,
    enum: ['Better Opportunity', 'Career Growth', 'Relocation', 'Personal Reasons', 'Health Issues', 'Retirement', 'Higher Education', 'Work-Life Balance', 'Company Culture', 'Compensation', 'Other']
  },
  newEmployer: {
    type: String,
    default: ''
  },
  overallExperience: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  managementRating: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  workEnvironmentRating: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  compensationRating: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  careerGrowthRating: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  wouldRecommend: {
    type: Boolean,
    required: true
  },
  wouldRejoin: {
    type: Boolean,
    required: true
  },
  improvements: {
    type: String,
    required: true
  },
  positiveAspects: {
    type: String,
    required: true
  },
  additionalComments: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  reviewedAt: {
    type: Date,
    default: null
  },
  rejectionReason: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

const ExitInterview = mongoose.model('ExitInterview', exitInterviewSchema);

export default ExitInterview;
