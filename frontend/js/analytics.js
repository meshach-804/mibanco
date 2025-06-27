async function fetchData(url, params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${url}?${query}`);
  return res.json();
}

function getDateFilter() {
  const start = document.getElementById('startDate').value;
  const end = document.getElementById('endDate').value;
  return start && end ? { start, end } : {};
}

let monthlyChart, categoryChart, ratioChart;

function drawLineChart(data) {
  const labels = [...new Set([...data.income.map(i => i.month), ...data.expenses.map(e => e.month)])].sort();
  const incomeMap = Object.fromEntries(data.income.map(i => [i.month, i.total_income]));
  const expenseMap = Object.fromEntries(data.expenses.map(e => [e.month, e.total_expenses]));

  const income = labels.map(label => incomeMap[label] || 0);
  const expenses = labels.map(label => expenseMap[label] || 0);

  if (monthlyChart) monthlyChart.destroy();
  monthlyChart = new Chart(document.getElementById('monthlyChart'), {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: 'Income', data: income, borderColor: 'green', fill: false },
        { label: 'Expenses', data: expenses, borderColor: 'red', fill: false },
      ],
    },
    options: { responsive: true }
  });
}

function drawPieChart(data) {
  if (categoryChart) categoryChart.destroy();
  categoryChart = new Chart(document.getElementById('categoryChart'), {
    type: 'pie',
    data: {
      labels: data.map(d => d.category),
      datasets: [{
        data: data.map(d => d.total),
        backgroundColor: ['#f87171', '#60a5fa', '#34d399', '#fbbf24', '#a78bfa'],
      }],
    },
    options: { responsive: true }
  });
}

function drawDonutChart(data) {
  if (ratioChart) ratioChart.destroy();
  ratioChart = new Chart(document.getElementById('ratioChart'), {
    type: 'doughnut',
    data: {
      labels: ['Expenses', 'Savings', 'Remaining Income'],
      datasets: [{
        data: [
          data.expenses,
          data.savings,
          Math.max(data.income - data.expenses - data.savings, 0)
        ],
        backgroundColor: ['#ef4444', '#10b981', '#3b82f6'],
      }]
    },
    options: { responsive: true }
  });
}

function drawDailyChart(data) {
  const dateSet = new Set([...data.income.map(i => i.date), ...data.expenses.map(e => e.date)]);
  const labels = Array.from(dateSet).sort();

  const incomeMap = Object.fromEntries(data.income.map(i => [i.date, i.total_income]));
  const expenseMap = Object.fromEntries(data.expenses.map(e => [e.date, e.total_expenses]));

  const income = labels.map(date => incomeMap[date] || 0);
  const expenses = labels.map(date => expenseMap[date] || 0);

  if (window.dailyChart) window.dailyChart.destroy();

  window.dailyChart = new Chart(document.getElementById('dailyChart'), {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Income',
          data: income,
          backgroundColor: '#34d399',
        },
        {
          label: 'Expenses',
          data: expenses,
          backgroundColor: '#f87171',
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        x: {
          ticks: {
            maxRotation: 90,
            minRotation: 45
          }
        },
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

async function initAnalytics() {
  const filter = getDateFilter();

  const [monthly, categories, ratio, daily] = await Promise.all([
    fetchData('/api/analytics/monthly-summary', filter),
    fetchData('/api/analytics/expense-categories', filter),
    fetchData('/api/analytics/spending-saving-ratio', filter),
    fetchData('/api/analytics/daily-summary-current-month'),
  ]);

  drawLineChart(monthly);
  drawPieChart(categories);
  drawDonutChart(ratio);
  drawDailyChart(daily);
}

document.getElementById('filterBtn').addEventListener('click', initAnalytics);
window.addEventListener('DOMContentLoaded', initAnalytics);
