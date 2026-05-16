// src/server.js
require('dotenv').config();
const express = require('express');
const path = require('path');
const { pool, initializeDB } = require('./db');
const authRouter = require('./auth');

// Test out the router
// console.log('Auth module type:', typeof authRouter);
// console.log('Auth keys:', Object.keys(authRouter));
const { startCronJob } = require('./cronJob');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// app.use((req, res, next) => {
//   console.log('Body:', req.body);
//   next();
// });

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Initialize DB and start cron after connection ready
(async () => {
  await initializeDB();
  startCronJob();
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🎂 Server running on port ${PORT}`);
  });
})();

// Serve UI pages
app.get('/', (req, res) => res.render('index', { message: null, error: null }));
app.get('/signup', (req, res) => res.render('signup'));
app.get('/login', (req, res) => res.render('login'));
app.get('/forgot-password', (req, res) => res.render('forgot-password'));

// Old birthday form – not used in new flow, but kept as example
app.post('/register', (req, res) => {
  // The new signup route is /signup, so this can be ignored or removed
  res.redirect('/signup');
});

// Temporary test route
// app.post('/signup', (req, res) => {
//   res.json({ message: 'Direct route works!' });
// });

// Auth routes
app.use(authRouter);

// Webhook endpoint for email status callbacks
app.post('/webhook/email-status', (req, res) => {
  console.log('📬 Webhook received:', req.body);
  res.sendStatus(200);
});



module.exports = app; // for testing