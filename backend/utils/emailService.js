const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

const sendOTPEmail = async (to, otp) => {
    await transporter.sendMail({
        from: `"${process.env.FROM_NAME}" <${process.env.SMTP_USER}>`,
        to,
        subject: 'Your Porchest verification code',
        html: `
            <div style="font-family: 'Helvetica Neue', sans-serif; max-width: 480px; margin: auto; background: #0a0a0f; color: #fff; padding: 48px 40px; border-radius: 20px; border: 1px solid rgba(123,63,242,0.25);">
                <div style="text-align: center; margin-bottom: 32px;">
                    <div style="display: inline-flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                        <div style="width: 36px; height: 36px; border-radius: 10px; background: linear-gradient(135deg, #7B2FF7, #9d4dff); display: inline-flex; align-items: center; justify-content: center; font-weight: 800; font-size: 18px; color: #fff;">P</div>
                        <span style="font-weight: 800; font-size: 20px; color: #fff;">Por<span style="color: #9d4dff;">chest</span></span>
                    </div>
                </div>
                <h2 style="font-size: 22px; font-weight: 700; color: #fff; margin: 0 0 12px; text-align: center;">Verify your email</h2>
                <p style="font-size: 14px; color: rgba(255,255,255,0.55); text-align: center; margin: 0 0 32px; line-height: 1.6;">
                    Enter the code below to activate your Porchest account. It expires in <strong style="color: #fff;">10 minutes</strong>.
                </p>
                <div style="background: rgba(123,63,242,0.1); border: 1px solid rgba(123,63,242,0.3); border-radius: 16px; padding: 28px; text-align: center; margin-bottom: 32px;">
                    <span style="font-size: 42px; font-weight: 800; letter-spacing: 16px; color: #9d4dff; font-family: monospace;">${otp}</span>
                </div>
                <p style="font-size: 12px; color: rgba(255,255,255,0.3); text-align: center; margin: 0; line-height: 1.6;">
                    If you didn't create a Porchest account, you can safely ignore this email.
                </p>
            </div>
        `,
    });
};

module.exports = { sendOTPEmail };
