const API_BASE = 'http://localhost:5000/api/index';

const formatCurrency = (amount) =>
  `$${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

async function fetchTotal(endpoint) {
  try {
    const res = await fetch(`${API_BASE}/${endpoint}/total`);
    if (!res.ok) throw new Error(`Failed to fetch ${endpoint}`);
    const data = await res.json();
    return data.total || 0;
  } catch (err) {
    console.error(`Error loading ${endpoint} total:`, err);
    return 0;
  }
}

// 👉 New function to compute net savings (deposits - withdrawals)
async function fetchNetSavings() {
  try {
    const res = await fetch('http://localhost:5000/api/savings');
    if (!res.ok) throw new Error('Failed to fetch savings');
    const savings = await res.json();

    let deposits = 0, withdrawals = 0;

    for (const item of savings) {
      if (item.type === 'deposit') deposits += parseFloat(item.amount);
      else if (item.type === 'withdrawal') withdrawals += parseFloat(item.amount);
    }

    return deposits - withdrawals;
  } catch (err) {
    console.error('Error computing net savings:', err);
    return 0;
  }
}

async function loadDashboardTotals() {
  const income = Number(await fetchTotal('income')) || 0;
  const expenses = Number(await fetchTotal('expenses')) || 0;
  const savings = await fetchNetSavings(); // use computed net savings
  const assets = Number(await fetchTotal('assets')) || 0;
  const loans = Number(await fetchTotal('loans')) || 0;
  const lent = Number(await fetchTotal('lent')) || 0;

  document.getElementById('total-income').textContent = formatCurrency(income);
  document.getElementById('total-expenses').textContent = formatCurrency(expenses);
  document.getElementById('total-savings').textContent = formatCurrency(savings);
  document.getElementById('total-assets').textContent = formatCurrency(assets);
  document.getElementById('total-loans').textContent = formatCurrency(loans);
  document.getElementById('total-lent').textContent = formatCurrency(lent);

  const balance = income - expenses;
  const netWorth = income + savings + assets + lent - expenses - loans;

  document.getElementById('balance').textContent = formatCurrency(balance);
  document.getElementById('net-worth').textContent = formatCurrency(netWorth);

  const debtToAssetRatio = assets > 0 ? (loans / assets).toFixed(2) : '0.00';
  document.getElementById('debt-to-asset').textContent = debtToAssetRatio;

  const emergencyTarget = expenses * 3;
  const emergencyReady = savings >= emergencyTarget;
  const emergencyPercent = Math.min((savings / emergencyTarget) * 100, 100);

  document.getElementById('emergency-status').textContent = emergencyReady ? 'Ready' : 'Not Ready';
  document.querySelector('.emergency-fund-bar').style.width = `${emergencyPercent}%`;

  document.getElementById('emergency-amount').textContent =
    `${formatCurrency(savings)} of ${formatCurrency(emergencyTarget)} saved`;
}

document.addEventListener('DOMContentLoaded', loadDashboardTotals);
