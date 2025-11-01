import nodemailer from 'nodemailer';

// Create reusable transporter
const createTransporter = () => {
  // In production, use actual SMTP credentials
  // For development, you can use services like Ethereal or Mailtrap
  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

// Send password reset email
export const sendPasswordResetEmail = async (email, resetToken, name) => {
  try {
    const transporter = createTransporter();
    
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    
    const mailOptions = {
      from: `"WEintegrity HR System" <${process.env.SMTP_FROM || 'noreply@hrms.com'}>`,
      to: email,
      subject: 'Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>Hi ${name},</p>
          <p>You requested to reset your password for your WEintegrity HR account.</p>
          <p>Click the button below to reset your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
          </div>
          <p>Or copy and paste this URL into your browser:</p>
          <p style="color: #666; word-break: break-all;">${resetUrl}</p>
          <p style="color: #999; font-size: 12px; margin-top: 30px;">This link will expire in 1 hour.</p>
          <p style="color: #999; font-size: 12px;">If you didn't request this, please ignore this email.</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return false;
  }
};

// Send account locked email
export const sendAccountLockedEmail = async (email, name) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"WEintegrity HR System" <${process.env.SMTP_FROM || 'noreply@hrms.com'}>`,
      to: email,
      subject: 'Account Locked - Multiple Failed Login Attempts',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #DC2626;">Account Locked</h2>
          <p>Hi ${name},</p>
          <p>Your account has been temporarily locked due to multiple failed login attempts.</p>
          <p>For security reasons, your account will be automatically unlocked after 30 minutes.</p>
          <p>If you didn't attempt to log in, please contact your HR administrator immediately.</p>
          <p>To unlock your account immediately, you can use the "Forgot Password" feature to reset your password.</p>
          <p style="color: #999; font-size: 12px; margin-top: 30px;">WEintegrity HR Management System</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Account locked email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending account locked email:', error);
    return false;
  }
};

// Send leave approval notification
export const sendLeaveApprovalEmail = async (email, name, leaveType, status, startDate, endDate) => {
  try {
    const transporter = createTransporter();
    
    const statusColor = status === 'Approved' ? '#10B981' : '#DC2626';
    
    const mailOptions = {
      from: `"WEintegrity HR System" <${process.env.SMTP_FROM || 'noreply@hrms.com'}>`,
      to: email,
      subject: `Leave Request ${status}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: ${statusColor};">Leave Request ${status}</h2>
          <p>Hi ${name},</p>
          <p>Your ${leaveType} leave request has been <strong>${status.toLowerCase()}</strong>.</p>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Leave Type:</strong> ${leaveType}</p>
            <p style="margin: 5px 0;"><strong>Start Date:</strong> ${new Date(startDate).toLocaleDateString()}</p>
            <p style="margin: 5px 0;"><strong>End Date:</strong> ${new Date(endDate).toLocaleDateString()}</p>
            <p style="margin: 5px 0;"><strong>Status:</strong> <span style="color: ${statusColor};">${status}</span></p>
          </div>
          <p>Login to the HR portal to view more details.</p>
          <p style="color: #999; font-size: 12px; margin-top: 30px;">WEintegrity HR Management System</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Leave approval email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending leave approval email:', error);
    return false;
  }
};

// Send payroll generated notification
export const sendPayrollGeneratedEmail = async (email, name, month, year, netPay) => {
  try {
    const transporter = createTransporter();
    
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'];
    
    const mailOptions = {
      from: `"WEintegrity HR System" <${process.env.SMTP_FROM || 'noreply@hrms.com'}>`,
      to: email,
      subject: `Payslip for ${monthNames[month]} ${year}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4F46E5;">Payslip Generated</h2>
          <p>Hi ${name},</p>
          <p>Your payslip for <strong>${monthNames[month]} ${year}</strong> has been generated.</p>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Period:</strong> ${monthNames[month]} ${year}</p>
            <p style="margin: 5px 0;"><strong>Net Pay:</strong> $${netPay.toFixed(2)}</p>
          </div>
          <p>Login to the HR portal to view and download your complete payslip.</p>
          <p style="color: #999; font-size: 12px; margin-top: 30px;">WEintegrity HR Management System</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Payroll email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending payroll email:', error);
    return false;
  }
};

// Send new employee welcome email
export const sendWelcomeEmail = async (email, name, employeeId, tempPassword) => {
  try {
    const transporter = createTransporter();
    
    const loginUrl = `${process.env.FRONTEND_URL}/login`;
    
    const mailOptions = {
      from: `"WEintegrity HR System" <${process.env.SMTP_FROM || 'noreply@hrms.com'}>`,
      to: email,
      subject: 'Welcome to WEintegrity',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4F46E5;">Welcome to WEintegrity!</h2>
          <p>Hi ${name},</p>
          <p>Welcome to the team! Your account has been created in the WEintegrity HR Management System.</p>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Employee ID:</strong> ${employeeId}</p>
            <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
            <p style="margin: 5px 0;"><strong>Temporary Password:</strong> ${tempPassword}</p>
          </div>
          <p style="color: #DC2626;"><strong>Important:</strong> Please change your password after your first login.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${loginUrl}" style="background-color: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Login to Portal</a>
          </div>
          <p style="color: #999; font-size: 12px; margin-top: 30px;">WEintegrity HR Management System</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Welcome email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return false;
  }
};

export default {
  sendPasswordResetEmail,
  sendAccountLockedEmail,
  sendLeaveApprovalEmail,
  sendPayrollGeneratedEmail,
  sendWelcomeEmail
};
