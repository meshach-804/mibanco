const API_URL = 'http://localhost:5000/api/assets';

const form = document.getElementById('asset-form');
const nameInput = document.getElementById('asset-name');
const typeInput = document.getElementById('asset-type');
const originalInput = document.getElementById('asset-original-value');
const rateInput = document.getElementById('asset-rate');
const dateInput = document.getElementById('asset-date');
const idInput = document.getElementById('asset-id');

const totalCurrent = document.getElementById('total-current');
const totalFixed = document.getElementById('total-fixed');
const totalAssets = document.getElementById('total-assets');
const availableFunds = document.getElementById('available-funds');
const assetList = document.getElementById('asset-list');

let allAssets = [];

async function fetchAssets() {
  const res = await fetch(API_URL);
  allAssets = await res.json();
  renderAssets();
}

function estimateCurrentValue(original, rate, years) {
  return original * Math.pow(1 + (rate / 100), years);
}

function renderAssets() {
  assetList.innerHTML = '';
  let fixedSum = 0;
  let liquidSum = 5000; // placeholder value

  allAssets.forEach(asset => {
    const original = parseFloat(asset.original_value);
    const rate = parseFloat(asset.annual_rate);
    const years = Math.max(0, (new Date().getFullYear() - new Date(asset.acquired_date).getFullYear()));
    const current = estimateCurrentValue(original, rate, years).toFixed(2);
    fixedSum += parseFloat(current);

    const li = document.createElement('li');
    li.className = 'bg-white p-4 rounded shadow';

    li.innerHTML = `
      <div class="flex justify-between items-center">
        <div>
          <h4 class="font-semibold">${asset.name} (${asset.type})</h4>
          <p class="text-sm text-gray-600">Original: KES ${original.toLocaleString()} | Estimated Now: KES ${parseFloat(current).toLocaleString()}</p>
          <p class="text-sm text-gray-500">Rate: ${rate}% | Acquired: ${new Date(asset.acquired_date).toLocaleDateString()}</p>
        </div>
        <button onclick="deleteAsset(${asset.id})" class="text-red-500 hover:underline">Delete</button>
      </div>
    `;
    assetList.appendChild(li);
  });

  totalCurrent.textContent = `KES ${liquidSum.toLocaleString()}`;
  totalFixed.textContent = `KES ${fixedSum.toLocaleString()}`;
  totalAssets.textContent = `KES ${(fixedSum + liquidSum).toLocaleString()}`;
  availableFunds.textContent = `KES ${liquidSum.toLocaleString()}`;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const asset = {
    name: nameInput.value,
    type: typeInput.value,
    original_value: parseFloat(originalInput.value),
    annual_rate: parseFloat(rateInput.value),
    acquired_date: dateInput.value
  };

  const method = idInput.value ? 'PUT' : 'POST';
  const url = idInput.value ? `${API_URL}/${idInput.value}` : API_URL;

  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(asset)
  });

  form.reset();
  idInput.value = '';
  fetchAssets();
});

async function deleteAsset(id) {
  if (!confirm('Delete this asset?')) return;
  await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
  fetchAssets();
}

fetchAssets();
