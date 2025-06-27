const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Get all
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM lent_funds ORDER BY date_lent DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create
router.post('/', async (req, res) => {
  const { lender, amount, date_lent, expected_return_date } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO lent_funds (lender, amount, date_lent, expected_return_date, refunded_amount) VALUES (?, ?, ?, ?, 0)',
      [lender, amount, date_lent, expected_return_date || null]
    );
    res.json({ message: 'Lent fund added', id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update
router.put('/:id', async (req, res) => {
  const { lender, amount, date_lent, expected_return_date } = req.body;
  try {
    await db.query(
      'UPDATE lent_funds SET lender = ?, amount = ?, date_lent = ?, expected_return_date = ? WHERE id = ?',
      [lender, amount, date_lent, expected_return_date || null, req.params.id]
    );
    res.json({ message: 'Lent fund updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete
router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM lent_funds WHERE id = ?', [req.params.id]);
    res.json({ message: 'Lent fund deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Refund logic
router.post('/refund/:id', async (req, res) => {
  const { amount } = req.body;
  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Refund amount must be positive.' });
  }

  try {
    const [[fund]] = await db.query('SELECT amount, refunded_amount FROM lent_funds WHERE id = ?', [req.params.id]);
    if (!fund) return res.status(404).json({ error: 'Fund not found' });

    const totalRefund = parseFloat(fund.refunded_amount) + parseFloat(amount);
    if (totalRefund > parseFloat(fund.amount)) {
      return res.status(400).json({ error: 'Refund exceeds total lent amount.' });
    }

    await db.query('UPDATE lent_funds SET refunded_amount = ? WHERE id = ?', [totalRefund, req.params.id]);
    res.json({ message: 'Refund recorded' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
