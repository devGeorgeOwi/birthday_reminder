// src/auth.js
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { pool } = require('./db');
const { addEmailJob } = require('./queue');

const router = express.Router();

// ─── Signup ────────────────────────────────────
router.post('/signup', async (req, res) => {
  const { username, email, password, dob } = req.body;

  try {
    const hash = await bcrypt.hash(password, parseInt(process.env.BCRYPT_SALT_ROUNDS));
    const verificationToken = crypto.randomUUID();

    await pool.query(
      `INSERT INTO users (username, email, password_hash, date_of_birth, verification_token)
       VALUES ($1, $2, $3, $4, $5)`,
      [username, email, hash, dob, verificationToken]
    );

    // // --- Direct email test (bypasses queue) ---
    // const { sendEmail } = require('./mailer');
    // const verifyLink = `${process.env.APP_BASE_URL}/verify-email?token=${verificationToken}&email=${email}`;
    // try {
    //   await sendEmail({
    //     to: email,
    //     subject: 'Verify your email',
    //     html: `<h1>Welcome ${username}!</h1><p>Please verify your email by clicking the link below:</p><
    //     a href="${verifyLink}">Verify Email</a>`,
    //   });
    //   console.log('✅ Verification email sent directly (bypassing queue).');
    // } catch (error) {
    //   console.error('❌ Error sending verification email:', error.message);
    // }

    // Queue verification email
    addEmailJob('verification', {
      to: email,
      username,
      token: verificationToken,
    }).catch(err => console.error('Queue error (non-fatal):', err.message));

    res.status(201).json({ message: 'User registered. Please check your email to verify.' });
  } catch (err) {
    console.log('🔥 SIGNUP ERROR:', err);
    console.error(err);
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Email already exists' });
    }
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── Email Verification ───────────────────────
router.get('/verify-email', async (req, res) => {
  const { token, email } = req.query;

  try {
    const result = await pool.query(
      `UPDATE users SET is_verified = TRUE, verification_token = NULL
       WHERE email = $1 AND verification_token = $2 AND is_verified = FALSE
       RETURNING username`,
      [email, token]
    );

    if (result.rowCount === 0) {
      return res.status(400).send('<h1>Invalid or expired verification link.</h1>');
    }
    res.send(`<h1>Email verified successfully! Welcome ${result.rows[0].username}.</h1>`);
  } catch (err) {
    console.error(err);
    res.status(500).send('<h1>Server error</h1>');
  }
});

// ─── Login ────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user || !user.is_verified) {
      return res.status(401).json({ error: 'Invalid credentials or email not verified' });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ message: 'Login successful', token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── Forgot Password ──────────────────────────
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    const result = await pool.query('SELECT username FROM users WHERE email = $1', [email]);
    if (result.rowCount === 0) {
      // Don't reveal whether user exists
      return res.json({ message: 'If that email exists, a reset link has been sent.' });
    }

    const resetToken = crypto.randomUUID();
    const expires = new Date(Date.now() + 3600000); // 1 hour

    await pool.query(
      `UPDATE users SET reset_token = $1, reset_token_expires_at = $2 WHERE email = $3`,
      [resetToken, expires, email]
    );

    await addEmailJob('password-reset', {
      to: email,
      username: result.rows[0].username,
      token: resetToken,
    });

    res.json({ message: 'If that email exists, a reset link has been sent.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /reset-password - show the reset form
router.get('/reset-password', (req, res) => {
  const { token, email } = req.query;
  if (!token || !email) {
    return res.status(400).send('<h1>Missing token or email.</h1>');
  }
  res.render('reset-password', { token, email });
});

// ─── Reset Password ───────────────────────────
router.post('/reset-password', async (req, res) => {
  const { email, token, newPassword } = req.body;

  try {
    const result = await pool.query(
      `SELECT * FROM users WHERE email = $1 AND reset_token = $2 AND reset_token_expires_at > NOW()`,
      [email, token]
    );

    if (result.rowCount === 0) {
      return res.status(400).json({ error: 'Invalid or expired reset token.' });
    }

    const hash = await bcrypt.hash(newPassword, parseInt(process.env.BCRYPT_SALT_ROUNDS));

    await pool.query(
      `UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires_at = NULL WHERE email = $2`,
      [hash, email]
    );

    res.json({ message: 'Password has been reset successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;