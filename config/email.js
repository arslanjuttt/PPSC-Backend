const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const {
  buildOtpEmailHtml,
  buildOtpEmailText,
} = require('../utils/emailTemplates');

const normalizeUrl = (url) => (url ? url.replace(/\/$/, '') : '');

const brandName = 'PPSC';
const appBaseUrl = normalizeUrl(process.env.CLIENT_URL || 'http://localhost:3000');
const logoPath = path.join(__dirname, '../assets/LoginLogo.png');
const LOGO_CID = 'logo@ppsc';
const smtpPass = (process.env.SMTP_PASS || '').replace(/\s+/g, '');

const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER;
const mailFrom = process.env.SMTP_FROM_NAME
  ? `"${process.env.SMTP_FROM_NAME}" <${fromAddress}>`
  : fromAddress;

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: smtpPass,
  },
});

const getLogoConfig = () => {
  if (fs.existsSync(logoPath)) {
    return {
      logoUrl: `cid:${LOGO_CID}`,
      attachments: [
        {
          filename: 'LoginLogo.png',
          path: logoPath,
          cid: LOGO_CID,
        },
      ],
    };
  }

  const publicAppUrl = appBaseUrl;
  if (publicAppUrl && !/localhost|127\.0\.0\.1/i.test(publicAppUrl)) {
    return {
      logoUrl: `${publicAppUrl.replace(/\/$/, '')}/LoginLogo.png`,
      attachments: [],
    };
  }

  return { logoUrl: null, attachments: [] };
};

const sendOtpEmail = async (to, otp) => {
  const { logoUrl, attachments } = getLogoConfig();

  await transporter.sendMail({
    from: mailFrom,
    to,
    subject: `${brandName} password reset code`,
    attachments,
    text: buildOtpEmailText({
      greeting: `Hello from ${brandName},`,
      otp,
      expiryText: 'This code expires in 10 minutes.',
      footerNote: 'Use this code to continue the password reset flow.',
    }),
    html: buildOtpEmailHtml({
      brandName,
      logoUrl,
      preheader: 'Your password reset code is ready.',
      title: 'Password Reset Code',
      headline: 'Use this code to continue resetting your password.',
      message: `We received a request to reset the password for your ${brandName} account. Enter the verification code below to proceed.`,
      otp,
      expiryText: 'This code expires in 10 minutes.',
      footerNote: 'Use this code only if you requested a password reset.',
    }),
  });
};

const sendEmailVerificationOtp = async (to, otp, name) => {
  const { logoUrl, attachments } = getLogoConfig();

  await transporter.sendMail({
    from: mailFrom,
    to,
    subject: `Verify your ${brandName} email address`,
    attachments,
    text: buildOtpEmailText({
      greeting: `Hi ${name || 'there'},`,
      otp,
      expiryText: 'This code expires in 24 hours.',
      footerNote: `Welcome to ${brandName}. Use this code to verify your email address.`,
    }),
    html: buildOtpEmailHtml({
      brandName,
      logoUrl,
      preheader: 'Verify your account to finish setup.',
      title: 'Verify Your Email',
      headline: `Welcome${name ? `, ${name}` : ''}. Confirm your email address to finish setting up your account.`,
      message: `Thanks for signing up for ${brandName}. Enter the verification code below to activate your account and start using the platform.`,
      otp,
      expiryText: 'This verification code expires in 24 hours.',
      footerNote: `If you created a ${brandName} account, use the code below to verify your email.`,
      buttonText: 'Open PPSC',
      buttonLink: appBaseUrl,
    }),
  });
};

module.exports = { sendOtpEmail, sendEmailVerificationOtp };
