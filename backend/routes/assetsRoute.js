const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET all assets
router.get('/', async (req, res) => {
  const [rows] = await db.query('SELECT * FROM assets ORDER BY acquired_date DESC');
  res.json(rows);
});

// POST new asset
router.post('/', async (req, res) => {
  const { name, type, original_value, annual_rate, acquired_date } = req.body;
  const [result] = await db.query(
    `INSERT INTO assets (name, type, original_value, annual_rate, acquired_date)
     VALUES (?, ?, ?, ?, ?)`,
    [name, type, original_value, annual_rate, acquired_date]
  );
  res.status(201).json({ id: result.insertId });
});

// PUT update asset
router.put('/:id', async (req, res) => {
  const { name, type, original_value, annual_rate, acquired_date } = req.body;
  await db.query(
    `UPDATE assets SET name=?, type=?, original_value=?, annual_rate=?, acquired_date=? WHERE id=?`,
    [name, type, original_value, annual_rate, acquired_date, req.params.id]
  );
  res.json({ message: 'Asset updated' });
});

// DELETE asset
router.delete('/:id', async (req, res) => {
  await db.query('DELETE FROM assets WHERE id=?', [req.params.id]);
  res.json({ message: 'Asset deleted' });
});

module.exports = router;
