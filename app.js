// Reading Tracker App v8 with theme toggle
const form = document.getElementById('entry-form');
const dateInput = document.getElementById('date');
const dateBtn = document.getElementById('date-btn');
const titleInput = document.getElementById('title');
const entriesList = document.getElementById('entries');
const themeBtn = document.getElementById('theme-btn');
const htmlEl = document.documentElement;

let entries = JSON.parse(localStorage.getItem('entries') || '[]');

// Theme setup
const savedTheme = localStorage.getItem('theme') || 'light';
htmlEl.setAttribute('data-theme', savedTheme);
themeBtn.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
themeBtn.addEventListener('click', () => {
  const newTheme = htmlEl.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
  htmlEl.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  themeBtn.textContent = newTheme === 'dark' ? '☀️' : '🌙';
});

// Date picker
function updateDateBtn(val) {
  const [year, month, day] = val.split('-');
  dateBtn.textContent = `📅 ${day}.${month}.${year}`;
}
const today = new Date().toISOString().substr(0, 10);
dateInput.value = today;
updateDateBtn(today);

dateBtn.addEventListener('click', () => {
  if (dateInput.showPicker) dateInput.showPicker();
  else dateInput.click();
});
dateInput.addEventListener('change', () => updateDateBtn(dateInput.value));

// Entries logic
function saveEntries() {
  localStorage.setItem('entries', JSON.stringify(entries));
}

function renderEntries() {
  entriesList.innerHTML = '';
  entries.sort((a, b) => new Date(b.date) - new Date(a.date));
  const groups = {};
  entries.forEach(entry => {
    if (!groups[entry.date]) groups[entry.date] = [];
    groups[entry.date].push(entry.title);
  });
  Object.keys(groups).forEach(date => {
    const [year, month, day] = date.split('-');
    const formattedDate = `${day}.${month}.${year}`;
    const li = document.createElement('li');
    li.className = 'entry-group';
    const dateDiv = document.createElement('div');
    dateDiv.className = 'date';
    dateDiv.textContent = formattedDate;
    li.appendChild(dateDiv);
    const itemsDiv = document.createElement('div');
    itemsDiv.className = 'items';
    groups[date].forEach(title => {
      const itemDiv = document.createElement('div');
      itemDiv.className = 'item';
      const titleSpan = document.createElement('span');
      titleSpan.className = 'title';
      titleSpan.textContent = title;
      const btn = document.createElement('button');
      btn.className = 'delete-btn';
      btn.textContent = '×';
      btn.dataset.date = date;
      btn.dataset.title = title;
      itemDiv.appendChild(titleSpan);
      itemDiv.appendChild(btn);
      itemsDiv.appendChild(itemDiv);
    });
    li.appendChild(itemsDiv);
    entriesList.appendChild(li);
  });
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      entries = entries.filter(e => !(e.date === btn.dataset.date && e.title === btn.dataset.title));
      saveEntries();
      renderEntries();
    });
  });
}

form.addEventListener('submit', e => {
  e.preventDefault();
  entries.push({ date: dateInput.value, title: titleInput.value });
  saveEntries();
  renderEntries();
  titleInput.value = '';
});

renderEntries();

// Service Worker registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js')
      .catch(err => console.warn('SW registration failed:', err));
  });
}