// utils/mailer.js
import  nodemailer from 'nodemailer';
import dotenv from "dotenv";
dotenv.config();
console.log('Nodemailer Auth Username:', process.env.NODEMAILER_AUTH_USERNAME);
console.log('Nodemailer Auth Password:', process.env.NODEMAILER_AUTH_PASSWORD);
// Create a reusable transporter object
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'grow.code.solutions24@gmail.com',
    pass: 'bbkewhxuatmstbpw',
  },
});

// Verify the connection configuration
transporter.verify((error) => {
  if (error) {
    console.error('Email transporter configuration error:', error);
  }
});

export const sendEmail = async (to, subject, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"Support Team" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`Email sent to ${to}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};
