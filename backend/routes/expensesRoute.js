const express = require('express');
const router = express.Router();
const db = require('../config/db.js');

// Get all expenses (excluding category-only entries)
router.get('/', async (req, res) => {
  const { category } = req.query;
  try {
    let query = `
      SELECT * FROM expenses 
      WHERE description != '[category]' `;
    const params = [];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    query += ' ORDER BY spent_at DESC';
    const [results] = await db.query(query, params);

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Get one expense by ID
router.get('/:id', async (req, res) => {
  try {
    const [results] = await db.query('SELECT * FROM expenses WHERE id = ?', [req.params.id]);
    if (results.length === 0) return res.status(404).json({ error: 'Expense not found' });
    res.json(results[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all unique categories
router.get('/categories/list', async (req, res) => {
  try {
    const [results] = await db.query(
      'SELECT DISTINCT category FROM expenses WHERE category IS NOT NULL AND category != ""'
    );
    const categories = results.map(row => row.category);
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Rename category
router.put('/categories/rename', async (req, res) => {
  const { oldCategory, newCategory } = req.body;
  try {
    await db.query(
      'UPDATE expenses SET category = ? WHERE category = ?',
      [newCategory, oldCategory]
    );
    res.json({ message: 'Category renamed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add new expense
router.post('/', async (req, res) => {
  const { description, amount, spent_at, category } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO expenses (description, amount, spent_at, category) VALUES (?, ?, ?, ?)',
      [description, amount, spent_at, category]
    );
    res.status(201).json({ message: 'Expense added', id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update an expense
router.put('/:id', async (req, res) => {
  const { description, amount, spent_at, category } = req.body;
  try {
    await db.query(
      'UPDATE expenses SET description = ?, amount = ?, spent_at = ?, category = ? WHERE id = ?',
      [description, amount, spent_at, category, req.params.id]
    );
    res.json({ message: 'Expense updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete an expense
router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM expenses WHERE id = ?', [req.params.id]);
    res.json({ message: 'Expense deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
