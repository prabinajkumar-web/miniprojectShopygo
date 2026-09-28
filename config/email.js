const nodemailer = require('nodemailer');
require('dotenv').config();

// ================================================================
// EMAIL TRANSPORTER CONFIGURATION
// ================================================================

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false
    },
    connectionTimeout: 30000,
    greetingTimeout: 30000,
    socketTimeout: 30000
});

// ================================================================
// VERIFY EMAIL CONFIGURATION
// ================================================================

transporter.verify((error, success) => {
    if (error) {
        console.log('❌ Email Configuration Error:', error.message);
        console.log('⚠️ Please check your EMAIL_USER and EMAIL_PASS in .env');
        console.log('💡 If using Gmail, make sure you are using App Password');
        console.log('📧 Email:', process.env.EMAIL_USER || 'Not set');
    } else {
        console.log('✅ Email configured successfully!');
        console.log('📧 Sending emails from:', process.env.EMAIL_USER);
    }
});

// ================================================================
// SEND EMAIL FUNCTION
// ================================================================

async function sendEmail({ to, subject, html, text }) {
    try {
        const mailOptions = {
            from: `"ShopyGo" <${process.env.EMAIL_USER}>`,
            to: to,
            subject: subject,
            html: html || text || '',
            text: text || ''
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Email sent to ${to}`);
        console.log(`📧 Message ID: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Error sending email:', error.message);
        return { success: false, error: error.message };
    }
}

// ================================================================
// SEND OTP EMAIL
// ================================================================

async function sendOTPEmail(email, otp, type = 'login', isAdmin = false) {
    const appName = isAdmin ? 'ShopyGo Admin' : 'ShopyGo';
    const fromName = isAdmin ? 'ShopyGo Admin' : 'ShopyGo';
    
    const subjectMap = {
        login: isAdmin ? '🔐 Admin Login OTP' : '🔐 ShopyGo Login OTP',
        register: isAdmin ? '📝 Admin Registration OTP' : '📝 ShopyGo Registration OTP',
        reset: '🔑 ShopyGo Password Reset OTP'
    };

    const messageMap = {
        login: 'Your One-Time Password for login is:',
        register: 'Your One-Time Password for registration is:',
        reset: 'Your One-Time Password for password reset is:'
    };

    const subject = subjectMap[type] || '🔐 ShopyGo OTP';
    const message = messageMap[type] || 'Your One-Time Password is:';

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${appName} OTP</title>
            <style>
                body { font-family: Arial, sans-serif; background: #f4f6fc; margin: 0; padding: 20px; }
                .container { max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; padding: 30px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
                .header { text-align: center; padding-bottom: 20px; border-bottom: 2px solid #eef2ff; }
                .header h1 { color: #2563eb; margin: 0; font-size: 28px; }
                .header p { color: #64748b; margin: 4px 0 0; }
                .otp-box { background: #eff6ff; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
                .otp-box .otp { font-size: 40px; font-weight: 700; color: #2563eb; letter-spacing: 12px; }
                .otp-box .label { color: #64748b; font-size: 14px; margin-bottom: 8px; }
                .info { color: #94a3b8; font-size: 13px; text-align: center; margin: 16px 0; }
                .footer { text-align: center; color: #94a3b8; font-size: 12px; padding-top: 20px; border-top: 1px solid #eef2ff; margin-top: 20px; }
                .highlight { color: #2563eb; font-weight: 600; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🛒 ${appName}</h1>
                    <p>${type === 'login' ? 'Login' : type === 'register' ? 'Registration' : 'Password Reset'}</p>
                </div>
                <div class="otp-box">
                    <div class="label">${message}</div>
                    <div class="otp">${otp}</div>
                </div>
                <div class="info">
                    ⏱️ This OTP is valid for <span class="highlight">5 minutes</span><br>
                    🔒 For security, do not share this OTP with anyone
                </div>
                <div class="footer">
                    If you didn't request this, please ignore this email.<br>
                    &copy; ${new Date().getFullYear()} ShopyGo - All rights reserved.
                </div>
            </div>
        </body>
        </html>
    `;

    return await sendEmail({
        to: email,
        subject: subject,
        html: html,
        text: `Your OTP is: ${otp}`
    });
}

// ================================================================
// SEND WELCOME EMAIL
// ================================================================

async function sendWelcomeEmail(email, name, isAdmin = false) {
    const appName = isAdmin ? 'ShopyGo Admin' : 'ShopyGo';
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to ${appName}</title>
            <style>
                body { font-family: Arial, sans-serif; background: #f4f6fc; margin: 0; padding: 20px; }
                .container { max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; padding: 30px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
                .header { text-align: center; padding-bottom: 20px; border-bottom: 2px solid #eef2ff; }
                .header h1 { color: #2563eb; margin: 0; font-size: 28px; }
                .content { padding: 20px 0; }
                .btn { display: inline-block; background: #2563eb; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; }
                .footer { text-align: center; color: #94a3b8; font-size: 12px; padding-top: 20px; border-top: 1px solid #eef2ff; margin-top: 20px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🛒 ${appName}</h1>
                </div>
                <div class="content">
                    <h2>Welcome, ${name || 'User'}! 👋</h2>
                    <p>Thank you for joining ${appName}. We're excited to have you on board!</p>
                    <p>You can now start shopping and exploring our products.</p>
                    <br>
                    <a href="http://localhost:5200" class="btn">Visit Store</a>
                </div>
                <div class="footer">
                    &copy; ${new Date().getFullYear()} ShopyGo - All rights reserved.
                </div>
            </div>
        </body>
        </html>
    `;

    return await sendEmail({
        to: email,
        subject: `Welcome to ${appName}! 🎉`,
        html: html,
        text: `Welcome to ${appName}!`
    });
}

module.exports = {
    transporter,
    sendEmail,
    sendOTPEmail,
    sendWelcomeEmail
};