const API_BASE = 'http://localhost:5000/api';

const generateBtn = document.getElementById('generate-btn');
const downloadCsvBtn = document.getElementById('download-csv');
const downloadPdfBtn = document.getElementById('download-pdf');
const startDateInput = document.getElementById('start-date');
const endDateInput = document.getElementById('end-date');
const reportTypeSelect = document.getElementById('report-type');
const outputJson = document.getElementById('report-data');
const outputTable = document.getElementById('report-table');
const viewToggle = document.getElementById('view-toggle');

generateBtn.addEventListener('click', fetchReport);
downloadCsvBtn.addEventListener('click', () => downloadReport('csv'));
downloadPdfBtn.addEventListener('click', () => downloadReport('pdf'));
if (viewToggle) viewToggle.addEventListener('change', () => renderView(currentData));

let currentData = [];

async function fetchReport() {
  const start = startDateInput.value;
  const end = endDateInput.value;
  const type = reportTypeSelect.value;

  if (!start || !end) {
    outputJson.textContent = '❌ Please select both start and end dates.';
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/reports?start=${start}&end=${end}`);
    if (!response.ok) throw new Error(`Server responded with status ${response.status}`);
    const data = await response.json();

    if (!data[type] || data[type].length === 0) {
      outputJson.textContent = `⚠️ No ${type} data found between ${start} and ${end}.`;
      currentData = [];
    } else {
      currentData = data[type];
      renderView(currentData);
    }
  } catch (error) {
    console.error('❌ Failed to fetch report:', error);
    outputJson.textContent = '❌ Error fetching report. Check console for details.';
  }
}

function renderView(data) {
  const view = viewToggle?.value || 'json';

  if (view === 'json') {
    outputJson.classList.remove('hidden');
    outputTable.classList.add('hidden');
    outputJson.textContent = JSON.stringify(data, null, 2);
  } else {
    outputJson.classList.add('hidden');
    outputTable.classList.remove('hidden');
    renderTable(data);
  }
}

function renderTable(data) {
  if (!data.length) {
    outputTable.innerHTML = '<p class="text-gray-600">No data to display in table view.</p>';
    return;
  }

  const headers = Object.keys(data[0]);
  const tableHtml = `
    <table class="min-w-full text-left border">
      <thead class="bg-gray-200 text-sm">
        <tr>${headers.map(h => `<th class="border px-2 py-1">${h}</th>`).join('')}</tr>
      </thead>
      <tbody class="text-sm">
        ${data.map(row => `
          <tr>${headers.map(h => `<td class="border px-2 py-1">${row[h] ?? ''}</td>`).join('')}</tr>
        `).join('')}
      </tbody>
    </table>
  `;

  outputTable.innerHTML = tableHtml;
}

function downloadReport(format) {
  const start = startDateInput.value;
  const end = endDateInput.value;
  const type = reportTypeSelect.value;

  if (!start || !end || !type) {
    alert('Please fill in all fields before exporting.');
    return;
  }

  const url = `${API_BASE}/reports/export/${format}?type=${type}&start=${start}&end=${end}`;
  window.open(url, '_blank');
}
