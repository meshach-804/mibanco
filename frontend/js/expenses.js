const EXPENSE_API = 'http://localhost:5000/api/expenses';
const CATEGORY_API = 'http://localhost:5000/api/expenses/categories/list';

async function fetchCategories() {
  try {
    const res = await fetch(CATEGORY_API);
    const categories = await res.json();

    const select = document.getElementById("expense-category");
    select.innerHTML = `<option value="" disabled selected>Select category</option>`;
    categories.forEach(cat => {
      const option = new Option(cat, cat);
      select.appendChild(option);
    });

    const filter = document.getElementById("filter-category");
    if (filter) {
      filter.innerHTML = `<option value="">All Categories</option>`;
      categories.forEach(cat => {
        const option = new Option(cat, cat);
        filter.appendChild(option);
      });
    }
  } catch (err) {
    console.error("Error fetching categories:", err);
  }
}

async function fetchExpenses() {
  try {
    const filter = document.getElementById("filter-category");
    const filterCategory = filter ? filter.value : "";
    const url = filterCategory ? `${EXPENSE_API}?category=${encodeURIComponent(filterCategory)}` : EXPENSE_API;

    const res = await fetch(url);
    const expenses = await res.json();
    renderExpenseList(expenses);
  } catch (err) {
    console.error("Error fetching expenses:", err);
  }
}

function renderExpenseList(expenses) {
  const list = document.getElementById("expense-list");
  list.innerHTML = "";

  if (!expenses.length) {
    list.innerHTML = `<li class="p-4 bg-white rounded shadow">No expense records yet.</li>`;
    document.getElementById("expense-total").textContent = ""; // Clear total
    return;
  }

  let total = 0;

  expenses.forEach(item => {
    // Skip dummy entries just in case
    if (item.description === 'category' && Number(item.amount) === 0) return;

    const li = document.createElement("li");
    li.className = "p-4 bg-white rounded shadow flex justify-between items-center";

    const date = new Date(item.spent_at);
    const formattedDate = isNaN(date) ? "Invalid date" : date.toISOString().split("T")[0];

    li.innerHTML = `
      <div>
        <p class="font-semibold">${item.description}</p>
        <p class="text-sm text-gray-600">${item.category || 'Uncategorized'} | $${Number(item.amount).toFixed(2)} on ${formattedDate}</p>
      </div>
      <div class="space-x-2">
        <button onclick="editExpense(${item.id}, '${item.description}', ${item.amount}, '${formattedDate}', '${item.category || ""}')" class="px-2 py-1 bg-yellow-500 text-white rounded">Edit</button>
        <button onclick="deleteExpense(${item.id})" class="px-2 py-1 bg-red-500 text-white rounded">Delete</button>
      </div>
    `;

    list.appendChild(li);
    total += Number(item.amount);
  });

  // Update total display
  const totalDisplay = document.getElementById("expense-total");
  totalDisplay.textContent = `Total: $${total.toFixed(2)}`;
}


function editExpense(id, description, amount, date, category) {
  document.getElementById("expense-id").value = id;
  document.getElementById("expense-description").value = description;
  document.getElementById("expense-amount").value = amount;
  document.getElementById("expense-date").value = date;
  document.getElementById("expense-category").value = category;
  document.getElementById("submit-btn").textContent = "Update Expense";
}

async function deleteExpense(id) {
  if (confirm("Are you sure you want to delete this expense?")) {
    await fetch(`${EXPENSE_API}/${id}`, { method: "DELETE" });
    fetchExpenses();
    fetchCategories();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  fetchCategories();
  fetchExpenses();

  document.getElementById("add-category-btn").addEventListener("click", async () => {
    const newCategory = document.getElementById("new-category").value.trim();
    if (!newCategory) return;

    const exists = [...document.getElementById("expense-category").options].some(
      o => o.value.toLowerCase() === newCategory.toLowerCase()
    );
    if (!exists) {
      const dummy = {
        description: "[category]",
        amount: 0,
        spent_at: new Date().toISOString().split("T")[0],
        category: newCategory
      };
      await fetch(EXPENSE_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dummy)
      });
    }

    document.getElementById("new-category").value = "";
    fetchCategories();
  });

  document.getElementById("edit-category-btn").addEventListener("click", async () => {
    const oldCategory = document.getElementById("expense-category").value;
    const newCategory = document.getElementById("new-category").value.trim();
    if (!oldCategory || !newCategory) return;

    await fetch(`${EXPENSE_API}/categories/rename`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ oldCategory, newCategory })
    });

    document.getElementById("new-category").value = "";
    fetchCategories();
    fetchExpenses();
  });

  document.getElementById("expense-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const id = document.getElementById("expense-id").value;
    const payload = {
      description: document.getElementById("expense-description").value,
      amount: document.getElementById("expense-amount").value,
      spent_at: document.getElementById("expense-date").value,
      category: document.getElementById("expense-category").value
    };

    try {
      const method = id ? "PUT" : "POST";
      const url = id ? `${EXPENSE_API}/${id}` : EXPENSE_API;

      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      e.target.reset();
      document.getElementById("submit-btn").textContent = "Add Expense";
      fetchExpenses();
      fetchCategories();
    } catch (err) {
      console.error("Error submitting expense:", err);
    }
  });

  document.getElementById("filter-category").addEventListener("change", fetchExpenses);
});
