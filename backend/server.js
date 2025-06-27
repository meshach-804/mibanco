// server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const indexRoutes = require('./routes/indexRoute')
const assetsRoutes = require('./routes/assetsRoute');
const incomeRoutes = require('./routes/incomeRoute');
const expensesRoutes = require('./routes/expensesRoute');
const savingsRoutes = require('./routes/savingsRoute');
const loansRoutes = require('./routes/loansRoute');
const lentFundsRoutes = require('./routes/lentFundsRoute')
const analyticsRoutes = require('./routes/analyticsRoute');
const usersRoutes = require('./routes/usersRoute');
const goalsRoutes = require('./routes/goalsRoute'); // ✅ Added Goals route

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/index', indexRoutes)
app.use('/api/assets', assetsRoutes)
app.use('/api/income', incomeRoutes);
app.use('/api/expenses', expensesRoutes);
app.use('/api/savings', savingsRoutes);
app.use('/api/loans', loansRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/lentFunds', lentFundsRoutes)
app.use('/api/goals', goalsRoutes); // ✅ Registered /api/goals

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Connected to mysql database\nServer running on port ${PORT}`));
