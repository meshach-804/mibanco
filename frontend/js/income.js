const API_URL = 'http://localhost:5000/api/income';

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("income-form");
  const submitBtn = document.getElementById("submit-btn");
  const viewAllBtn = document.getElementById("view-all-btn");
  const scrollSection = document.getElementById("income-scroll-section");

  fetchIncome();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const id = form["income-id"].value;
    const source = form["income-source"].value.trim();
    const amount = parseFloat(form["income-amount"].value);
    const date = form["income-date"].value;

    if (!source || isNaN(amount) || !date) {
      alert("Please provide valid source, amount, and date.");
      return;
    }

    const payload = { source, amount, date };

    try {
      const method = id ? "PUT" : "POST";
      const endpoint = id ? `${API_URL}/${id}` : API_URL;

      await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      form.reset();
      form["income-id"].value = "";
      submitBtn.textContent = "Add Income";
      fetchIncome();
    } catch (err) {
      console.error("Error saving income:", err);
    }
  });

  // Toggle View All / Collapse
  viewAllBtn.addEventListener("click", () => {
    scrollSection.classList.toggle("expanded");

    const isExpanded = scrollSection.classList.contains("expanded");
    document.getElementById("toggle-text").textContent = isExpanded ? "Collapse" : "View All";
    document.getElementById("toggle-icon").classList.toggle("rotate-180", isExpanded);

    fetchIncome(); // Re-render income list with new state
  });
});

async function fetchIncome() {
  try {
    const res = await fetch(API_URL);
    const data = await res.json();
    renderIncomeList(data);
  } catch (err) {
    console.error("Error fetching income:", err);
  }
}

function renderIncomeList(incomes) {
  const list = document.getElementById("income-list");
  const totalDisplay = document.getElementById("total-income");
  const viewAllBtn = document.getElementById("view-all-btn");
  const incomeCount = document.getElementById("income-count");
  const scrollSection = document.getElementById("income-scroll-section");

  list.innerHTML = "";

  if (!incomes.length) {
    list.innerHTML = `<li class="p-4 bg-white rounded shadow">No income records yet.</li>`;
    totalDisplay.textContent = "$0.00";
    viewAllBtn.classList.add("hidden");
    incomeCount.textContent = "";
    return;
  }

  const isCollapsed = !scrollSection.classList.contains("expanded");
  const visibleIncomes = isCollapsed ? incomes.slice(0, 1) : incomes;

  visibleIncomes.forEach(({ id, source, amount, date }) => {
    const formattedDate = new Date(date).toISOString().split("T")[0];
    const li = document.createElement("li");
    li.className = "p-4 bg-white rounded shadow flex justify-between items-center";

    li.innerHTML = `
      <div>
        <p class="font-semibold">${source}</p>
        <p>$${Number(amount).toFixed(2)} on ${formattedDate}</p>
      </div>
      <div class="space-x-2">
        <button data-id="${id}" class="edit-btn px-2 py-1 bg-yellow-500 text-white rounded">Edit</button>
        <button data-id="${id}" class="delete-btn px-2 py-1 bg-red-500 text-white rounded">Delete</button>
      </div>
    `;
    list.appendChild(li);
  });

  // Show or hide the View All button
  if (incomes.length > 3) {
    viewAllBtn.classList.remove("hidden");
    incomeCount.textContent = `${incomes.length} total`;
  } else {
    viewAllBtn.classList.add("hidden");
    incomeCount.textContent = "";
  }

  // Update total income
  const total = incomes.reduce((sum, i) => sum + Number(i.amount), 0);
  totalDisplay.textContent = `$${total.toFixed(2)}`;

  // Edit buttons
  document.querySelectorAll(".edit-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const id = e.target.dataset.id;
      const { source, amount, date } = incomes.find(i => i.id == id);
      document.getElementById("income-id").value = id;
      document.getElementById("income-source").value = source;
      document.getElementById("income-amount").value = amount;
      document.getElementById("income-date").value = new Date(date).toISOString().split("T")[0];
      document.getElementById("submit-btn").textContent = "Update Income";
    });
  });

  // Delete buttons
  document.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      const id = e.target.dataset.id;
      if (confirm("Are you sure you want to delete this income?")) {
        try {
          await fetch(`${API_URL}/${id}`, { method: "DELETE" });
          fetchIncome();
        } catch (err) {
          console.error("Error deleting income:", err);
        }
      }
    });
  });
}
