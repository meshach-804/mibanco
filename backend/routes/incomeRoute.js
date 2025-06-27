const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET all incomes
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM income ORDER BY date DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Database fetch error: " + err.message });
  }
});

// POST new income
router.post('/', async (req, res) => {
  const { source, amount, date } = req.body;
  if (!source || !amount || !date) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  try {
    const [result] = await db.query(
      'INSERT INTO income (source, amount, date) VALUES (?, ?, ?)',
      [source, amount, date]
    );
    res.status(201).json({ message: 'Income added', id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: "Insert failed: " + err.message });
  }
});

// PUT update income
router.put('/:id', async (req, res) => {
  const { source, amount, date } = req.body;
  const { id } = req.params;

  if (!source || !amount || !date) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  try {
    await db.query(
      'UPDATE income SET source = ?, amount = ?, date = ? WHERE id = ?',
      [source, amount, date, id]
    );
    res.json({ message: 'Income updated' });
  } catch (err) {
    res.status(500).json({ error: "Update failed: " + err.message });
  }
});

// DELETE income
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM income WHERE id = ?', [id]);
    res.json({ message: 'Income deleted' });
  } catch (err) {
    res.status(500).json({ error: "Delete failed: " + err.message });
  }
});

module.exports = router;
