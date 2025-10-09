import express from 'express';
import crypto from 'crypto';
import OtpToken from '../models/OtpToken.js';
import  {sendEmail}  from '../utils/mailer.js';

const router = express.Router();

// Configure nodemailer transporter
// const transporter = nodemailer.createTransport({
//   host: process.env.EMAIL_HOST || 'smtp.gmail.com',
//   port: parseInt(process.env.EMAIL_PORT || '587', 10),
//   secure: false, // true for 465, false for other ports
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS,
//   }
// });

// Helper functions
function generateOtp(length = 6) {
  const min = 10**(length-1);
  const max = (10**length) - 1;
  return String(Math.floor(Math.random() * (max - min + 1)) + min);
}

function hashOtp(otp) {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

// Request OTP for password reset
router.post('/request-reset', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ 
        ok: false, 
        message: 'Email is required' 
      });
    }

    // Generate 6-digit OTP
    const otp = generateOtp(6);
    const otpHash = hashOtp(otp);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete any existing OTPs for this email
    await OtpToken.deleteMany({ email });

    // Save new OTP to database
    await OtpToken.create({ 
      email, 
      otpHash, 
      expiresAt 
    });

    // Send OTP via email
    // const mailOptions = {
    //   from: process.env.EMAIL_USER,
    //   to: email,
    //   subject: 'MyVoice974 - Code de vérification',
    //   text: `Votre code de vérification est : ${otp}. Ce code expire dans 10 minutes.`,
    //   html: `
    //      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    //       <h2 style="color: #f97316;">MyVoice974 - Code de vérification</h2>
    //       <p>Bonjour,</p>
    //       <p>Vous avez demandé un code de vérification pour réinitialiser votre mot de passe.</p>
    //       <div style="background-color: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0;">
    //         <h1 style="color: #f97316; font-size: 32px; margin: 0;">${otp}</h1>
    //       </div>
    //       <p>Ce code expire dans <strong>10 minutes</strong>.</p>
    //       <p>Si vous n'avez pas demandé ce code, ignorez cet email.</p>
    //       <hr style="margin: 20px 0;">
    //       <p style="color: #6b7280; font-size: 12px;">MyVoice974 - Plateforme de sondages</p>
    //     </div>
    //   `
    // };

    // await transporter.sendMail(mailOptions);

   await sendEmail(email, 'MyVoice974 - Code de vérification', `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
       <h2 style="color: #f97316;">MyVoice974 - Code de vérification</h2>
       <p>Bonjour,</p>
       <p>Vous avez demandé un code de vérification pour réinitialiser votre mot de passe.</p>
       <div style="background-color: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0;">
         <h1 style="color: #f97316; font-size: 32px; margin: 0;">${otp}</h1>
       </div>
       <p>Ce code expire dans <strong>10 minutes</strong>.</p>
       <p>Si vous n'avez pas demandé ce code, ignorez cet email.</p>
       <hr style="margin: 20px 0;">
       <p style="color: #6b7280; font-size: 12px;">MyVoice974 - Plateforme de sondages</p>
     </div>
      `)

    console.log(`OTP sent to ${email}: ${otp}`);

    return res.json({ 
      ok: true, 
      message: 'Code de vérification envoyé à votre email' 
    });

  } catch (error) {
    console.error('Error sending OTP:', error);
    return res.status(500).json({ 
      ok: false, 
      message: 'Erreur lors de l\'envoi du code' 
    });
  }
});

// Verify OTP only (without password reset)
router.post('/verify-otp-only', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ 
        ok: false, 
        message: 'Email et OTP requis' 
      });
    }

    // Find OTP record
    const otpRecord = await OtpToken.findOne({ 
      email, 
      used: false 
    });

    if (!otpRecord) {
      return res.status(400).json({ 
        ok: false, 
        message: 'Code invalide ou expiré' 
      });
    }

    // Check if OTP is expired
    if (otpRecord.expiresAt < new Date()) {
      await OtpToken.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ 
        ok: false, 
        message: 'Code expiré' 
      });
    }

    // Verify OTP
    const otpHash = hashOtp(otp);
    if (otpHash !== otpRecord.otpHash) {
      return res.status(400).json({ 
        ok: false, 
        message: 'Code incorrect' 
      });
    }

    // Don't mark as used yet - will be marked when password is reset
    console.log(`OTP verified successfully for ${email}`);

    return res.json({ 
      ok: true, 
      message: 'Code vérifié avec succès' 
    });

  } catch (error) {
    console.error('Error verifying OTP:', error);
    return res.status(500).json({ 
      ok: false, 
      message: 'Erreur interne du serveur' 
    });
  }
});

// Verify OTP and reset password
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ 
        ok: false, 
        message: 'Email, OTP et nouveau mot de passe requis' 
      });
    }

    // Find OTP record
    const otpRecord = await OtpToken.findOne({ 
      email, 
      used: false 
    });

    if (!otpRecord) {
      return res.status(400).json({ 
        ok: false, 
        message: 'Code invalide ou expiré' 
      });
    }

    // Check if OTP is expired
    if (otpRecord.expiresAt < new Date()) {
      await OtpToken.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ 
        ok: false, 
        message: 'Code expiré' 
      });
    }

    // Verify OTP
    const otpHash = hashOtp(otp);
    if (otpHash !== otpRecord.otpHash) {
      return res.status(400).json({ 
        ok: false, 
        message: 'Code incorrect' 
      });
    }

    // Mark OTP as used
    await OtpToken.updateOne(
      { _id: otpRecord._id }, 
      { used: true }
    );

    // Here you would typically update the user's password in your user database
    // For now, we'll just return success
    console.log(`Password reset successful for ${email}`);

    return res.json({ 
      ok: true, 
      message: 'Mot de passe réinitialisé avec succès' 
    });

  } catch (error) {
    console.error('Error verifying OTP:', error);
    return res.status(500).json({ 
      ok: false, 
      message: 'Erreur interne du serveur' 
    });
  }
});

export default router;