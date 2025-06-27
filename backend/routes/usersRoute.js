const express = require('express');
const router = express.Router();

router.post('/register', (req, res) => {
  res.json({ message: 'User registered' });
});

router.post('/login', (req, res) => {
  res.json({ message: 'User logged in' });
});

router.get('/profile', (req, res) => {
  res.json({ message: 'User profile' });
});

module.exports = router;
