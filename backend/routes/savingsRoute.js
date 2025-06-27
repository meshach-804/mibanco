const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET all savings records
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM savings ORDER BY date DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST a deposit or withdrawal
router.post('/', async (req, res) => {
  const { goal, amount, date, type, reason } = req.body;

  try {
    if (type === 'deposit') {
      const [result] = await db.query(
        'INSERT INTO savings (goal, amount, date, type) VALUES (?, ?, ?, ?)',
        [goal, amount, date, type]
      );
      res.json({ message: 'Deposit added', id: result.insertId });
    } else if (type === 'withdrawal') {
      const [result] = await db.query(
        'INSERT INTO savings (amount, reason, date, type) VALUES (?, ?, ?, ?)',
        [amount, reason, date, type]
      );
      res.json({ message: 'Withdrawal recorded', id: result.insertId });
    } else {
      res.status(400).json({ error: 'Invalid type specified' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT (Edit) a deposit or withdrawal record
router.put('/:id', async (req, res) => {
  const { goal, amount, date, reason, type } = req.body;
  const { id } = req.params;

  try {
    if (type === 'deposit') {
      const [result] = await db.query(
        'UPDATE savings SET goal = ?, amount = ?, date = ? WHERE id = ? AND type = "deposit"',
        [goal, amount, date, id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Deposit not found or not editable' });
      }

      res.json({ message: 'Deposit updated' });
    } else if (type === 'withdrawal') {
      const [result] = await db.query(
        'UPDATE savings SET reason = ?, amount = ?, date = ? WHERE id = ? AND type = "withdrawal"',
        [reason, amount, date, id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Withdrawal not found or not editable' });
      }

      res.json({ message: 'Withdrawal updated' });
    } else {
      res.status(400).json({ message: 'Invalid type specified for update' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE any record
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await db.query('DELETE FROM savings WHERE id = ?', [id]);
    res.json({ message: 'Record deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
