const SAVINGS_API = 'http://localhost:5000/api/savings';
let allSavings = [];

// Fetch and render
async function fetchSavings() {
  try {
    const res = await fetch(SAVINGS_API);
    allSavings = await res.json();
    renderSavings(allSavings);
  } catch (err) {
    console.error("Error fetching savings:", err);
  }
}

// Render list + summary
function renderSavings(data, mode = 'all') {
  const list = document.getElementById("savings-list");
  const summary = document.getElementById("savings-summary");
  list.innerHTML = "";

  let filtered = data;
  let totalDeposits = 0, totalWithdrawals = 0;

  if (mode === 'deposit') filtered = data.filter(i => i.type === 'deposit');
  else if (mode === 'withdrawal') filtered = data.filter(i => i.type === 'withdrawal');

  if (!filtered.length) {
    list.innerHTML = `<li class="p-4 bg-white rounded shadow">No savings records found.</li>`;
    summary.textContent = getSummaryText(mode, totalDeposits, totalWithdrawals);
    return;
  }

  filtered.forEach(item => {
    const li = document.createElement("li");
    li.className = "p-4 bg-white rounded shadow";
    const date = new Date(item.date).toISOString().split("T")[0];
    let content = '', editBtn = '';

    if (item.type === 'deposit') {
      totalDeposits += +item.amount;
      content = `<p class="text-green-600 font-semibold">Deposit: $${+item.amount} on ${date}</p><p>Goal: ${item.goal}</p>`;
      editBtn = `<button onclick="editDeposit(${item.id}, '${item.goal}', ${item.amount}, '${date}')" class="px-2 py-1 bg-yellow-500 text-white rounded">Edit</button>`;
    } else {
      totalWithdrawals += +item.amount;
      content = `<p class="text-red-600 font-semibold">Withdrawal: $${+item.amount} on ${date}</p><p>Reason: ${item.reason}</p>`;
      editBtn = `<button onclick="editWithdrawal(${item.id}, '${item.reason}', ${item.amount}, '${date}')" class="px-2 py-1 bg-yellow-500 text-white rounded">Edit</button>`;
    }

    li.innerHTML = `
      <div class="flex justify-between items-start gap-4">
        <div>${content}</div>
        <div class="space-x-2">
          ${editBtn}
          <button onclick="deleteSaving(${item.id})" class="px-2 py-1 bg-red-500 text-white rounded">Delete</button>
        </div>
      </div>
    `;
    list.appendChild(li);
  });

  summary.textContent = getSummaryText(mode, totalDeposits, totalWithdrawals);
}

// Summary text logic
function getSummaryText(mode, deposits, withdrawals) {
  if (mode === 'deposit') return `Total Deposits: $${deposits.toFixed(2)}`;
  if (mode === 'withdrawal') return `Total Withdrawals: $${withdrawals.toFixed(2)}`;
  return `Net Savings: $${(deposits - withdrawals).toFixed(2)}`;
}

function filterSavings(mode = 'all') {
  renderSavings(allSavings, mode);
}

// Form Prefills
function editDeposit(id, goal, amount, date) {
  document.getElementById("add-savings-id").value = id;
  document.getElementById("add-savings-goal").value = goal;
  document.getElementById("add-savings-amount").value = amount;
  document.getElementById("add-savings-date").value = date;
  document.getElementById("add-submit-btn").textContent = "Update Deposit";
}

function editWithdrawal(id, reason, amount, date) {
  document.getElementById("withdraw-savings-id").value = id;
  document.getElementById("withdraw-savings-reason").value = reason;
  document.getElementById("withdraw-savings-amount").value = amount;
  document.getElementById("withdraw-savings-date").value = date;
  document.getElementById("withdraw-submit-btn").textContent = "Update Withdrawal";
}

async function deleteSaving(id) {
  if (confirm("Are you sure you want to delete this saving?")) {
    await fetch(`${SAVINGS_API}/${id}`, { method: "DELETE" });
    fetchSavings();
  }
}

// Helpers
function calculateNetBalance() {
  let deposits = 0, withdrawals = 0;
  allSavings.forEach(item => {
    if (item.type === 'deposit') deposits += +item.amount;
    else withdrawals += +item.amount;
  });
  return deposits - withdrawals;
}

// Events
document.addEventListener("DOMContentLoaded", () => {
  fetchSavings();

  document.getElementById("add-savings-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const id = document.getElementById("add-savings-id").value;
    const payload = {
      goal: document.getElementById("add-savings-goal").value,
      amount: document.getElementById("add-savings-amount").value,
      date: document.getElementById("add-savings-date").value,
      type: 'deposit'
    };

    await fetch(`${SAVINGS_API}/${id || ''}`, {
      method: id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    e.target.reset();
    document.getElementById("add-submit-btn").textContent = "Add Saving";
    fetchSavings();
  });

  document.getElementById("withdraw-savings-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const id = document.getElementById("withdraw-savings-id").value;
    const amount = parseFloat(document.getElementById("withdraw-savings-amount").value);

    if (amount > calculateNetBalance()) {
      return alert("Insufficient savings balance. Withdrawal exceeds current net savings.");
    }

    const payload = {
      reason: document.getElementById("withdraw-savings-reason").value,
      amount,
      date: document.getElementById("withdraw-savings-date").value,
      type: 'withdrawal'
    };

    await fetch(`${SAVINGS_API}/${id || ''}`, {
      method: id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    e.target.reset();
    document.getElementById("withdraw-submit-btn").textContent = "Withdraw";
    fetchSavings();
  });
});
