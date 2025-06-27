const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Get all goals
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM goals ORDER BY target_date ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add new goal
router.post('/', async (req, res) => {
  const { title, target_amount, saved_amount, start_date, target_date } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO goals (title, target_amount, saved_amount, start_date, target_date) VALUES (?, ?, ?, ?, ?)',
      [title, target_amount, saved_amount, start_date, target_date]
    );
    res.json({ message: 'Goal added', id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update goal
router.put('/:id', async (req, res) => {
  const { title, target_amount, saved_amount, start_date, target_date } = req.body;
  const { id } = req.params;
  try {
    await db.query(
      'UPDATE goals SET title = ?, target_amount = ?, saved_amount = ?, start_date = ?, target_date = ? WHERE id = ?',
      [title, target_amount, saved_amount, start_date, target_date, id]
    );
    res.json({ message: 'Goal updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete goal
router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM goals WHERE id = ?', [req.params.id]);
    res.json({ message: 'Goal deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
