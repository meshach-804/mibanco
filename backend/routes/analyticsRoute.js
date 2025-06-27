const express = require('express');
const router = express.Router();
const db = require('../config/db.js');

// Helper: date filtering
const getDateFilter = (req) => {
  const { startDate, endDate } = req.query;
  return {
    start: startDate || '1970-01-01',
    end: endDate || '2999-12-31'
  };
};

// Monthly summary (line chart)
router.get('/monthly-summary', async (req, res) => {
  const { start, end } = getDateFilter(req);
  try {
    const [income] = await db.query(`
      SELECT DATE_FORMAT(received_at, '%Y-%m') AS month, SUM(amount) AS total_income
      FROM income
      WHERE received_at BETWEEN ? AND ?
      GROUP BY month
    `, [start, end]);

    const [expenses] = await db.query(`
      SELECT DATE_FORMAT(spent_at, '%Y-%m') AS month, SUM(amount) AS total_expenses
      FROM expenses
      WHERE spent_at BETWEEN ? AND ?
      GROUP BY month
    `, [start, end]);

    const months = Array.from(new Set([...income.map(i => i.month), ...expenses.map(e => e.month)])).sort();

    const incomeMap = Object.fromEntries(income.map(i => [i.month, i.total_income]));
    const expenseMap = Object.fromEntries(expenses.map(e => [e.month, e.total_expenses]));

    const result = months.map(month => ({
      month,
      income: incomeMap[month] || 0,
      expenses: expenseMap[month] || 0
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Expense categories (pie chart)
router.get('/expense-categories', async (req, res) => {
  const { start, end } = getDateFilter(req);
  try {
    const [results] = await db.query(`
      SELECT category, SUM(amount) AS total
      FROM expenses
      WHERE spent_at BETWEEN ? AND ?
      GROUP BY category
    `, [start, end]);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Spending vs Saving ratio (donut chart)
router.get('/spending-saving-ratio', async (req, res) => {
  const { start, end } = getDateFilter(req);
  try {
    const [expenses] = await db.query(`
      SELECT SUM(amount) AS total_expenses
      FROM expenses
      WHERE spent_at BETWEEN ? AND ?
    `, [start, end]);

    const [savings] = await db.query(`
      SELECT SUM(amount) AS total_savings
      FROM savings
      WHERE saved_at BETWEEN ? AND ?
    `, [start, end]);

    res.json({
      expenses: expenses[0].total_expenses || 0,
      savings: savings[0].total_savings || 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Daily income vs expenses (current month)
router.get('/daily-summary-current-month', async (req, res) => {
  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const firstDay = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).toISOString().slice(0, 10);

    const [income] = await db.query(`
      SELECT received_at AS date, SUM(amount) AS total_income
      FROM income
      WHERE received_at BETWEEN ? AND ?
      GROUP BY received_at
    `, [firstDay, lastDay]);

    const [expenses] = await db.query(`
      SELECT spent_at AS date, SUM(amount) AS total_expenses
      FROM expenses
      WHERE spent_at BETWEEN ? AND ?
      GROUP BY spent_at
    `, [firstDay, lastDay]);

    res.json({ income, expenses });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
