const LOANS_API = 'http://localhost:5000/api/loans';
let loans = [];
let editingLoanId = null;

const loanForm = document.getElementById('loan-form');
const repaymentForm = document.getElementById('repayment-form');
const loanList = document.getElementById('loan-list');
const repaymentLenderSelect = document.getElementById('repayment-lender');

// Loan creation/edit form submission
loanForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const lender = document.getElementById('loan-lender').value.trim();
  const amount = parseFloat(document.getElementById('loan-amount').value);
  const loan_type = document.getElementById('loan-type').value;
  const interest_rate = parseFloat(document.getElementById('loan-interest').value);
  const due_date = document.getElementById('loan-due').value;
  const start_date = new Date().toISOString().split('T')[0];
  const interest = calculateInitialInterest(loan_type, amount, interest_rate);
  const total_payable = amount + interest;

  const loan = {
    lender, amount, loan_type, interest_rate,
    start_date, due_date, status: 'pending',
    amount_paid: editingLoanId ? undefined : 0,
    total_payable
  };

  if (editingLoanId) {
    await fetch(`${LOANS_API}/${editingLoanId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...loan, amount_paid: parseFloat(document.getElementById('loan-repaid')?.value || 0) })
    });
    editingLoanId = null;
    document.getElementById('submit-btn').textContent = 'Add Loan';
  } else {
    await fetch(LOANS_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loan)
    });
  }

  loanForm.reset();
  fetchLoans();
});

// Repayment submission
repaymentForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const lender = repaymentLenderSelect.value;
  const amount = parseFloat(document.getElementById('repayment-amount').value);
  const repaymentDate = document.getElementById('repayment-date')?.value || new Date().toISOString().split('T')[0];

  const loan = loans.find(l => l.lender === lender);
  if (!loan) return;

  const updatedPaid = parseFloat(loan.amount_paid || 0) + amount;

  // ✅ Send only repayment info
  await fetch(`${LOANS_API}/${loan.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount_paid: updatedPaid })
  });

  repaymentForm.reset();
  fetchLoans();
});

// Initial interest calculation
function calculateInitialInterest(type, P, R) {
  const T = 1;
  if (type === 'mortgage' || type === 'auto') {
    const r = R / 12 / 100, n = 12;
    const monthly = P * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
    return (monthly * n) - P;
  } else if (type === 'business' || type === 'credit') {
    return P * (Math.pow((1 + R / 100), T) - 1);
  } else if (type === 'emergency') {
    return P * 0.05;
  } else {
    return P * (R / 100) * T;
  }
}

// Accumulated interest calculation
function calculateAccumulatedInterest(loan) {
  const start = new Date(loan.start_date);
  const now = new Date();
  const elapsedYears = (now - start) / (1000 * 60 * 60 * 24 * 365.25);
  const P = parseFloat(loan.amount);
  const R = loan.interest_rate / 100;

  switch (loan.loan_type) {
    case 'business':
    case 'credit':
      return P * (Math.pow((1 + R), elapsedYears) - 1);
    case 'mortgage':
    case 'auto':
      const r = R / 12;
      const n = elapsedYears * 12;
      const monthly = P * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
      return (monthly * n) - P;
    case 'emergency':
      return P * 0.05;
    default:
      return P * R * elapsedYears;
  }
}

// Format date display
function formatDateToDDMMYYYY(dateStr) {
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

// Fetch and render all loans
async function fetchLoans() {
  try {
    const res = await fetch(LOANS_API);
    loans = await res.json();
    renderLoans();
    updateRepaymentDropdown();
  } catch (err) {
    console.error('Failed to load loans:', err);
  }
}

// Render the loan list
function renderLoans() {
  loanList.innerHTML = '';
  loans.forEach(loan => {
    const amount = parseFloat(loan.amount);
    const accumulatedInterest = calculateAccumulatedInterest(loan);
    const total = amount + accumulatedInterest;
    const repaid = parseFloat(loan.amount_paid || 0);
    const progress = Math.min(100, (repaid / total) * 100).toFixed(1);
    const overdue = new Date(loan.due_date) < new Date();

    const item = document.createElement('li');
    item.className = 'bg-white p-4 rounded shadow border-l-4 ' + (overdue ? 'border-red-500' : 'border-green-500');

    item.innerHTML = `
      <p><strong>Lender:</strong> ${loan.lender}</p>
      <p><strong>Type:</strong> ${loan.loan_type}</p>
      <p><strong>Lent Date:</strong> ${formatDateToDDMMYYYY(loan.start_date)}</p>
      <p><strong>Principal:</strong> $${amount.toFixed(2)}</p>
      <p><strong>Interest Rate:</strong> ${loan.interest_rate}%</p>
      <p><strong>Accumulated Interest:</strong> $${accumulatedInterest.toFixed(2)}</p>
      <p><strong>Total Payable:</strong> $${total.toFixed(2)}</p>
      <p><strong>Due Date:</strong> ${formatDateToDDMMYYYY(loan.due_date)} ${overdue ? '<span class="text-red-600">(Overdue)</span>' : ''}</p>
      <p><strong>Repaid:</strong> $${repaid.toFixed(2)}</p>
      <div class="w-full bg-gray-200 rounded mt-2">
        <div class="bg-green-500 h-4 text-xs text-white text-center rounded" style="width:${progress}%">
          ${progress}%
        </div>
      </div>
      <div class="mt-4 flex gap-4">
        <button onclick='editLoan(${JSON.stringify(loan)})'
          class="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600">Edit</button>
        <button onclick='deleteLoan(${loan.id})'
          class="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700">Delete</button>
      </div>
    `;
    loanList.appendChild(item);
  });

  renderLoanSummary();
}

// Show summary of loans
function renderLoanSummary() {
  let totalBorrowed = 0;
  let totalRepaid = 0;

  loans.forEach(loan => {
    const principal = parseFloat(loan.amount) || 0;
    const interest = calculateAccumulatedInterest(loan);
    const totalPayable = principal + interest;
    const repaid = parseFloat(loan.amount_paid || 0);

    totalBorrowed += totalPayable;
    totalRepaid += repaid;
  });

  const totalOutstanding = totalBorrowed - totalRepaid;

  document.getElementById('total-borrowed').textContent = `$${totalBorrowed.toFixed(2)}`;
  document.getElementById('total-repaid').textContent = `$${totalRepaid.toFixed(2)}`;
  document.getElementById('total-outstanding').textContent = `$${totalOutstanding.toFixed(2)}`;
}

// Update lender dropdown
function updateRepaymentDropdown() {
  repaymentLenderSelect.innerHTML = '<option value="">Select Loan</option>';
  loans.forEach(loan => {
    const opt = document.createElement('option');
    opt.value = loan.lender;
    opt.textContent = loan.lender;
    repaymentLenderSelect.appendChild(opt);
  });
}

// Prefill loan form for editing
function editLoan(loan) {
  document.getElementById('loan-lender').value = loan.lender;
  document.getElementById('loan-amount').value = loan.amount;
  document.getElementById('loan-type').value = loan.loan_type;
  document.getElementById('loan-interest').value = loan.interest_rate;
  document.getElementById('loan-due').value = loan.due_date;
  document.getElementById('submit-btn').textContent = 'Update Loan';
  editingLoanId = loan.id;
}

// Delete loan
async function deleteLoan(id) {
  if (confirm('Are you sure you want to delete this loan?')) {
    await fetch(`${LOANS_API}/${id}`, { method: 'DELETE' });
    fetchLoans();
  }
}

// Initial fetch
fetchLoans();
