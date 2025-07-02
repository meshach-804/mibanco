const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { Parser } = require('json2csv');
const PDFDocument = require('pdfkit');
const stream = require('stream');

// Utility: PDF stream helper
function generatePDF(res, data, title = 'Report') {
  const doc = new PDFDocument();
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${title.replace(/\s/g, '_')}.pdf"`);

  const passthrough = new stream.PassThrough();
  doc.pipe(passthrough);
  passthrough.pipe(res);

  doc.fontSize(18).text(title, { align: 'center' });
  doc.moveDown();

  data.forEach((item, index) => {
    doc.fontSize(12).text(`${index + 1}. ${JSON.stringify(item, null, 2)}`);
    doc.moveDown();
  });

  doc.end();
}

// GET: Combined report (filtered by date range)
router.get('/', async (req, res) => {
  try {
    const { start, end } = req.query;
    if (!start || !end) return res.status(400).json({ error: 'Start and end dates are required' });

    const [loans] = await db.query('SELECT * FROM loans WHERE start_date BETWEEN ? AND ?', [start, end]);
    const [lentFunds] = await db.query('SELECT * FROM lent_funds WHERE date_lent BETWEEN ? AND ?', [start, end]);
    const [assets] = await db.query('SELECT * FROM assets WHERE acquired_date BETWEEN ? AND ?', [start, end]);
    const [expenses] = await db.query('SELECT * FROM expenses WHERE spent_at BETWEEN ? AND ?', [start, end]);
    const [goals] = await db.query('SELECT * FROM goals WHERE start_date BETWEEN ? AND ?', [start, end]);
    const [savings] = await db.query('SELECT * FROM savings WHERE date BETWEEN ? AND ?', [start, end]);

    res.json({ loans, lentFunds, assets, expenses, goals, savings });
  } catch (err) {
    console.error('Error generating report:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET CSV Export
router.get('/export/csv', async (req, res) => {
  try {
    const { start, end, type } = req.query;
    if (!start || !end || !type) return res.status(400).json({ error: 'Start, end and type are required' });

    let data;
    let filename = `${type}_report_${start}_to_${end}.csv`;

    switch (type) {
      case 'loans':
        [data] = await db.query('SELECT * FROM loans WHERE start_date BETWEEN ? AND ?', [start, end]);
        break;
      case 'lentFunds':
        [data] = await db.query('SELECT * FROM lent_funds WHERE date_lent BETWEEN ? AND ?', [start, end]);
        break;
      case 'assets':
        [data] = await db.query('SELECT * FROM assets WHERE acquired_date BETWEEN ? AND ?', [start, end]);
        break;
      case 'expenses':
        [data] = await db.query('SELECT * FROM expenses WHERE spent_at BETWEEN ? AND ?', [start, end]);
        break;
      case 'goals':
        [data] = await db.query('SELECT * FROM goals WHERE start_date BETWEEN ? AND ?', [start, end]);
        break;
      case 'savings':
        [data] = await db.query('SELECT * FROM savings WHERE date BETWEEN ? AND ?', [start, end]);
        break;
      default:
        return res.status(400).json({ error: 'Invalid report type' });
    }

    const parser = new Parser();
    const csv = parser.parse(data);

    res.header('Content-Type', 'text/csv');
    res.attachment(filename);
    return res.send(csv);
  } catch (err) {
    console.error('CSV export error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET PDF Export
router.get('/export/pdf', async (req, res) => {
  try {
    const { start, end, type } = req.query;
    if (!start || !end || !type) return res.status(400).json({ error: 'Start, end and type are required' });

    let data;
    let title = `${type} report from ${start} to ${end}`;

    switch (type) {
      case 'loans':
        [data] = await db.query('SELECT * FROM loans WHERE start_date BETWEEN ? AND ?', [start, end]);
        break;
      case 'lentFunds':
        [data] = await db.query('SELECT * FROM lent_funds WHERE date_lent BETWEEN ? AND ?', [start, end]);
        break;
      case 'assets':
        [data] = await db.query('SELECT * FROM assets WHERE acquired_date BETWEEN ? AND ?', [start, end]);
        break;
      case 'expenses':
        [data] = await db.query('SELECT * FROM expenses WHERE spent_at BETWEEN ? AND ?', [start, end]);
        break;
      case 'goals':
        [data] = await db.query('SELECT * FROM goals WHERE start_date BETWEEN ? AND ?', [start, end]);
        break;
      case 'savings':
        [data] = await db.query('SELECT * FROM savings WHERE date BETWEEN ? AND ?', [start, end]);
        break;
      default:
        return res.status(400).json({ error: 'Invalid report type' });
    }

    generatePDF(res, data, title);
  } catch (err) {
    console.error('PDF export error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
