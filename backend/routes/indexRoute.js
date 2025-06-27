const express = require('express');
const router = express.Router();
const db = require('../config/db'); // Adjust to your actual DB path

// Generic helper
const getTotal = async (res, table, column = 'amount') => {
  try {
    const [rows] = await db.query(`SELECT SUM(${column}) AS total FROM ${table}`);
    res.json({ total: rows[0].total || 0 });
  } catch (err) {
    console.error(`Error fetching total from ${table}:`, err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

router.get('/income/total', (req, res) => getTotal(res, 'income'));
router.get('/expenses/total', (req, res) => getTotal(res, 'expenses'));
router.get('/savings/total', (req, res) => getTotal(res, 'savings'));
router.get('/assets/total', (req, res) => getTotal(res, 'assets', 'value'));
router.get('/loans/total', (req, res) => getTotal(res, 'loans'));
router.get('/lent/total', (req, res) => getTotal(res, 'lent_funds'));

module.exports = router;
