const API_URL = 'http://localhost:5000/api/lentFunds';
const REFUND_API = 'http://localhost:5000/api/lentFunds/refund';

let allFunds = [];

async function fetchLentFunds() {
  try {
    const res = await fetch(API_URL);
    allFunds = await res.json();
    renderLentList(allFunds);
    renderRefundDropdown(allFunds);
    renderSummary(allFunds);
  } catch (err) {
    console.error('Error fetching lent funds:', err);
  }
}

function renderLentList(funds) {
  const list = document.getElementById('lent-list');
  list.innerHTML = '';

  funds.forEach(fund => {
    const amount = parseFloat(fund.amount) || 0;
    const refunded = parseFloat(fund.refunded_amount) || 0;
    const balance = amount - refunded;
    const status = balance <= 0 ? 'Fully Refunded' : 'Pending';

    const li = document.createElement('li');
    li.className = 'bg-white p-4 rounded shadow';

    li.innerHTML = `
      <div class="flex justify-between items-start">
        <div>
          <h4 class="font-bold">${fund.lender}</h4>
          <p class="text-sm">Lent: $${amount.toFixed(2)}</p>
          <p class="text-sm text-green-700">Refunded: $${refunded.toFixed(2)}</p>
          <p class="text-sm text-red-700">Balance: $${balance.toFixed(2)}</p>
          <p class="text-xs text-gray-500">Lent: ${new Date(fund.date_lent).toLocaleDateString()}</p>
          <p class="text-xs text-gray-500">Expected: ${fund.expected_return_date ? new Date(fund.expected_return_date).toLocaleDateString() : 'N/A'}</p>
          <span class="text-xs inline-block mt-2 px-2 py-1 rounded ${status === 'Fully Refunded' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">${status}</span>
        </div>
        <div class="text-right space-y-1">
          <button onclick="editFund(${fund.id})" class="px-2 py-1 bg-yellow-500 text-white rounded text-sm">Edit</button>
          <button onclick="deleteFund(${fund.id})" class="px-2 py-1 bg-red-500 text-white rounded text-sm">Delete</button>
        </div>
      </div>`;
    list.appendChild(li);
  });
}

function renderRefundDropdown(funds) {
  const select = document.getElementById('refund-lender');
  select.innerHTML = '<option value="">Select Lender</option>';
  funds.forEach(f => {
    select.innerHTML += `<option value="${f.id}">${f.lender}</option>`;
  });
}

function renderSummary(funds) {
  let totalLent = 0, totalRefunded = 0;
  funds.forEach(f => {
    totalLent += parseFloat(f.amount || 0);
    totalRefunded += parseFloat(f.refunded_amount || 0);
  });

  document.getElementById('total-lent').textContent = `$${totalLent.toFixed(2)}`;
  document.getElementById('total-refunded').textContent = `$${totalRefunded.toFixed(2)}`;
  document.getElementById('total-balance').textContent = `$${(totalLent - totalRefunded).toFixed(2)}`;
}

function editFund(id) {
  const fund = allFunds.find(f => f.id === id);
  if (!fund) return;
  document.getElementById('fund-id').value = fund.id;
  document.getElementById('lender-name').value = fund.lender;
  document.getElementById('lent-amount').value = fund.amount;
  document.getElementById('lent-date').value = fund.date_lent.split('T')[0];
  document.getElementById('expected-return-date').value = fund.expected_return_date?.split('T')[0] || '';
}

async function deleteFund(id) {
  if (!confirm('Delete this fund?')) return;
  await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
  fetchLentFunds();
}

document.getElementById('lent-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('fund-id').value;
  const lender = document.getElementById('lender-name').value;
  const amount = parseFloat(document.getElementById('lent-amount').value);
  const date_lent = document.getElementById('lent-date').value;
  const expected_return_date = document.getElementById('expected-return-date').value || null;

  const payload = { lender, amount, date_lent, expected_return_date };

  if (id) {
    await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } else {
    await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  }

  e.target.reset();
  fetchLentFunds();
});

document.getElementById('refund-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const fundId = document.getElementById('refund-lender').value;
  const amount = parseFloat(document.getElementById('refund-amount').value);
  if (!fundId || !amount || amount <= 0) return;

  await fetch(`${REFUND_API}/${fundId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount })
  });

  e.target.reset();
  fetchLentFunds();
});

document.addEventListener('DOMContentLoaded', fetchLentFunds);
