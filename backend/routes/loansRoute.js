const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET all loans
router.get('/', async (req, res) => {
  try {
    const { loan_type, status } = req.query;
    let sql = 'SELECT * FROM loans';
    const params = [];

    const conditions = [];
    if (loan_type) {
      conditions.push('loan_type = ?');
      params.push(loan_type);
    }
    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }

    if (conditions.length) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY created_at DESC';

    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching loans:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST new loan
router.post('/', async (req, res) => {
  const {
    lender, amount, loan_type, interest_rate,
    start_date, due_date, amount_paid, status
  } = req.body;

  if (!lender || !amount || !loan_type || !interest_rate || !start_date || !due_date) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const [result] = await db.query(
      `INSERT INTO loans 
      (lender, amount, loan_type, interest_rate, start_date, due_date, amount_paid, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [lender, amount, loan_type, interest_rate, start_date, due_date, amount_paid || 0, status || 'pending']
    );
    res.status(201).json({ message: 'Loan added', id: result.insertId });
  } catch (err) {
    console.error('Error inserting loan:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT update loan (repayment or edit)
router.put('/:id', async (req, res) => {
  const { amount_paid } = req.body;

  // Repayment-only case
  if (amount_paid !== undefined && Object.keys(req.body).length === 1) {
    try {
      const [rows] = await db.query('SELECT amount, due_date FROM loans WHERE id = ?', [req.params.id]);
      if (!rows.length) return res.status(404).json({ error: 'Loan not found' });

      const { amount, due_date } = rows[0];
      const now = new Date();
      const due = new Date(due_date + 'T00:00:00Z');

      const status =
        parseFloat(amount_paid) >= parseFloat(amount)
          ? 'paid'
          : now > due
          ? 'overdue'
          : 'pending';

      await db.query(
        'UPDATE loans SET amount_paid = ?, status = ? WHERE id = ?',
        [amount_paid, status, req.params.id]
      );

      return res.json({ message: 'Repayment recorded' });
    } catch (err) {
      console.error('Error updating repayment:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  // Full loan update case
  const {
    lender, amount, loan_type, interest_rate,
    start_date, due_date, total_payable
  } = req.body;

  if (!lender || !amount || !loan_type || !interest_rate || !start_date || !due_date || amount_paid === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const now = new Date();
    const due = new Date(due_date + 'T00:00:00Z');

    const status =
      parseFloat(amount_paid) >= parseFloat(total_payable || amount)
        ? 'paid'
        : now > due
        ? 'overdue'
        : 'pending';

    await db.query(
      `UPDATE loans SET
        lender = ?, amount = ?, loan_type = ?, interest_rate = ?,
        start_date = ?, due_date = ?, amount_paid = ?, status = ?
       WHERE id = ?`,
      [lender, amount, loan_type, interest_rate, start_date, due_date, amount_paid, status, req.params.id]
    );

    res.json({ message: 'Loan updated' });
  } catch (err) {
    console.error('Error updating loan:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE loan
router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM loans WHERE id = ?', [req.params.id]);
    res.json({ message: 'Loan deleted' });
  } catch (err) {
    console.error('Error deleting loan:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
