// Reading Tracker App v8 with theme toggle
const form = document.getElementById("entry-form");
const dateInput = document.getElementById("date");

const today = new Date().toISOString().split("T")[0];
dateInput.value = today;

const dateBtn = document.getElementById("date-btn");
const titleInput = document.getElementById("title");
const entriesList = document.getElementById("entries");
const themeBtn = document.getElementById("theme-btn");
const htmlEl = document.documentElement;

let entries = JSON.parse(localStorage.getItem("entries") || "[]");

// Theme setup
const savedTheme = localStorage.getItem("theme") || "light";
htmlEl.setAttribute("data-theme", savedTheme);
themeBtn.textContent = savedTheme === "dark" ? "☀️" : "🌙";
themeBtn.addEventListener("click", () => {
  const newTheme =
    htmlEl.getAttribute("data-theme") === "light" ? "dark" : "light";
  htmlEl.setAttribute("data-theme", newTheme);
  localStorage.setItem("theme", newTheme);
  themeBtn.textContent = newTheme === "dark" ? "☀️" : "🌙";
});

// Date picker
function updateDateBtn(val) {
  const [year, month, day] = val.split("-");
  dateBtn.textContent = `📅 ${day}.${month}.${year}`;
}

updateDateBtn(today);

dateBtn.addEventListener("click", () => {
  if (dateInput.showPicker) dateInput.showPicker();
  else dateInput.click();
});
dateInput.addEventListener("change", () => updateDateBtn(dateInput.value));

// Entries logic
function saveEntries() {
  localStorage.setItem("entries", JSON.stringify(entries));
}

function renderEntries() {
  entriesList.innerHTML = "";
  // Сортируем по дате (самые новые наверху)
  entries.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Группируем по дате
  const groups = {};
  entries.forEach((entry) => {
    if (!groups[entry.date]) groups[entry.date] = [];
    groups[entry.date].push(entry); // теперь это сам объект, не просто title
  });

  // Рендерим группы
  Object.keys(groups).forEach((date) => {
    const [year, month, day] = date.split("-");
    const formattedDate = `${day}.${month}.${year}`;

    const li = document.createElement("li");
    li.className = "entry-group";

    const dateDiv = document.createElement("div");
    dateDiv.className = "date";
    dateDiv.textContent = formattedDate;
    li.appendChild(dateDiv);

    const itemsDiv = document.createElement("div");
    itemsDiv.className = "items";

    groups[date].forEach((entry) => {
      const itemDiv = document.createElement("div");
      itemDiv.className = "item";

      const titleSpan = document.createElement("span");
      titleSpan.className = "title";
      titleSpan.textContent = entry.title;
      itemDiv.appendChild(titleSpan);

      const btn = document.createElement("button");
      btn.className = "delete-btn";
      btn.textContent = "×";
      // кладём data-id для облака, и — на всякий случай — date/title для локала
      if (entry.id) {
        btn.dataset.id = entry.id;
      }
      btn.dataset.date = entry.date;
      btn.dataset.title = entry.title;

      itemDiv.appendChild(btn);
      itemsDiv.appendChild(itemDiv);
    });

    li.appendChild(itemsDiv);
    entriesList.appendChild(li);
  });

  // Навешиваем общий обработчик удаления
  document.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      const date = btn.dataset.date;
      const title = btn.dataset.title;

      if (window.auth && auth.currentUser && id) {
        // удаляем из Firestore (внутри removeReadingFirebase есть fallback)
        await removeReadingFirebase(id);
      } else {
        // локальный режим: фильтруем по дате+заголовку
        entries = entries.filter(
          (e) => !(e.date === date && e.title === title)
        );
        saveEntries();
      }

      // перерисовываем список
      renderEntries();
    });
  });
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const entryDate = dateInput.value || today;
  const entry = { 
    date: entryDate, 
    title: titleInput.value 
  };
  window.saveToLocal(entry);

  // если пользователь залогинен — пушим в Firestore
  if (auth.currentUser) {
    await addReadingFirebase(entry);
  } else {
    // иначе — в локал
    saveToLocal(entry);
  }

  // очистка формы
  titleInput.value = "";
});

renderEntries();

// Service Worker registration
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("service-worker.js")
      .catch((err) => console.warn("SW registration failed:", err));
  });
}

// 1) Подгрузить всё из localStorage и отрисовать
window.loadFromLocal = function () {
  entries = JSON.parse(localStorage.getItem("entries") || "[]");
  renderEntries();
};

// 2) Добавить одну запись в локал и отрисовать
window.saveToLocal = function (entry) {
  entries.push(entry);
  saveEntries();
  renderEntries();
};

// 3) Удалить одну запись в локал и отрисовать
//    Здесь мы удаляем по индексу;
//    можно заменить на фильтрацию по date/title, если нужно.
window.removeFromLocal = function (index) {
  entries.splice(index, 1);
  saveEntries();
  renderEntries();
};
