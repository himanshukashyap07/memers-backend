import nodemailer from 'nodemailer';

// Create a transporter using SMTP settings from environment variables
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export const sendVerificationEmail = async (email: string, username: string, verificationToken: string) => {
    try {
        const verificationUrl = `${process.env.FRONTEND_URL}/verify?token=${verificationToken}&email=${email}`;

        const mailOptions = {
            from: process.env.EMAIL_FROM || 'Memers <onboarding@resend.dev>',
            to: email,
            subject: 'Verify your Memers account',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                    <h1 style="color: #007bff; text-align: center;">Welcome to Memers, ${username}!</h1>
                    <p style="font-size: 16px; line-height: 1.5; color: #333;">
                        Thank you for joining the Memers community. To complete your registration, please verify your email address by clicking the button below:
                    </p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${verificationUrl}" style="background-color: #007bff; color: white; padding: 15px 25px; text-decoration: none; font-weight: bold; border-radius: 5px; font-size: 18px;">Verify Email</a>
                    </div>
                    <p style="font-size: 14px; color: #777; text-align: center;">
                        If the button above doesn't work, copy and paste this code into your app:<br>
                        <span style="color: #007bff;">${verificationToken}</span>
                    </p>
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;">
                    <p style="font-size: 12px; color: #999; text-align: center;">
                        If you didn't create an account, you can safely ignore this email.
                    </p>
                </div>
            `,
        };

        await transporter.sendMail(mailOptions);

        console.log(`Verification email sent to ${email} via SMTP`);
        return true;
    } catch (error) {
        console.error("SMTP email error:", error);
        return false;
    }
};
