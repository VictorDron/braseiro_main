import nodemailer from 'nodemailer';
import { config } from './index';

const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: config.email.secure,
  auth: {
    user: config.email.user,
    pass: config.email.pass,
  },
});

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  try {
    await transporter.sendMail({
      from: `"Braseiro System" <${config.email.user}>`,
      to,
      subject,
      html,
    });
  } catch (error) {
    console.error('Email send error:', error);
    throw error;
  }
}

export default transporter;
