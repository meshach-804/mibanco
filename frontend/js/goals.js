const GOALS_API = 'http://localhost:5000/api/goals';

document.addEventListener('DOMContentLoaded', () => {
  fetchGoals();

  document.getElementById('goal-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = document.getElementById('goal-id').value;
    const payload = {
      title: document.getElementById('goal-name').value,
      target_amount: parseFloat(document.getElementById('goal-target').value),
      saved_amount: parseFloat(document.getElementById('goal-saved').value),
      start_date: document.getElementById('goal-start-date').value,
      target_date: document.getElementById('goal-date').value
    };

    const url = id ? `${GOALS_API}/${id}` : GOALS_API;
    const method = id ? 'PUT' : 'POST';

    try {
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      resetForm();
      fetchGoals();
    } catch (err) {
      console.error('Error saving goal:', err);
    }
  });
});

async function fetchGoals() {
  try {
    const res = await fetch(GOALS_API);
    const goals = await res.json();
    renderGoalList(goals);
  } catch (err) {
    console.error('Error fetching goals:', err);
  }
}

function renderGoalList(goals) {
  const list = document.getElementById('goal-list');
  list.innerHTML = '';

  if (!goals.length) {
    list.innerHTML = `<li class="p-4 bg-white rounded shadow">No goals set yet.</li>`;
    return;
  }

  goals.forEach(goal => {
    const progress = Math.min((goal.saved_amount / goal.target_amount) * 100, 100).toFixed(2);

    const li = document.createElement('li');
    li.className = 'p-4 bg-white rounded shadow';
    li.innerHTML = `
      <div class="flex flex-col sm:flex-row justify-between items-start gap-4 mb-2">
        <div>
          <p class="font-bold text-lg">${goal.title}</p>
          <p class="text-sm text-gray-600">Target: $${goal.target_amount} | Saved: $${goal.saved_amount}</p>
          <p class="text-sm text-gray-500">${getRemainingDays(goal.target_date)}</p>
        </div>
        <div class="flex gap-2">
          <button onclick="editGoal(${goal.id}, '${goal.title}', ${goal.target_amount}, ${goal.saved_amount}, '${goal.start_date}', '${goal.target_date}')" class="px-3 py-1 bg-yellow-500 text-white rounded">Edit</button>
          <button onclick="deleteGoal(${goal.id})" class="px-3 py-1 bg-red-500 text-white rounded">Delete</button>
        </div>
      </div>
      <div class="w-full bg-gray-200 rounded-full h-4">
        <div class="bg-green-500 h-4 rounded-full" style="width: ${progress}%"></div>
      </div>
      <p class="text-sm mt-1 text-right">${progress}% achieved</p>
    `;
    list.appendChild(li);
  });
}

function editGoal(id, title, targetAmount, savedAmount, startDate, targetDate) {
  document.getElementById('goal-id').value = id;
  document.getElementById('goal-name').value = title;
  document.getElementById('goal-target').value = targetAmount;
  document.getElementById('goal-saved').value = savedAmount;
  document.getElementById('goal-start-date').value = startDate ? formatDate(startDate) : '';
  document.getElementById('goal-date').value = formatDate(targetDate);

  document.getElementById('submit-btn').textContent = 'Update Goal';
}

async function deleteGoal(id) {
  if (confirm('Are you sure you want to delete this goal?')) {
    try {
      await fetch(`${GOALS_API}/${id}`, { method: 'DELETE' });
      fetchGoals();
    } catch (err) {
      console.error('Error deleting goal:', err);
    }
  }
}

function getRemainingDays(targetDate) {
  const today = new Date();
  const target = new Date(targetDate);
  const diffDays = Math.ceil((target - today) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return `⏰ Past due (${Math.abs(diffDays)} days ago)`;
  if (diffDays === 0) return `🕒 Due today`;
  return `📅 ${diffDays} day(s) remaining`;
}

function resetForm() {
  document.getElementById('goal-form').reset();
  document.getElementById('goal-id').value = '';
  document.getElementById('submit-btn').textContent = 'Add Goal';
}

function formatDate(dateStr) {
  return new Date(dateStr).toISOString().split('T')[0];
}
