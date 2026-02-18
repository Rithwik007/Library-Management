const role = localStorage.getItem("role");
document.getElementById("welcome").innerText = `Welcome, ${role}`;

const bookList = document.getElementById("bookList");
const logsSection = document.getElementById("logsSection");

function renderBooks(list) {
  bookList.innerHTML = "";

  list.forEach(book => {

    const readingCount = logs.filter(
      l => l.bookTitle === book.title && l.action === "READING"
    ).length;

    const takenCount = logs.filter(
      l => l.bookTitle === book.title && l.action === "BORROWED"
    ).length;

    const available = book.total - takenCount;

    let buttons = "";

    if (currentUser.role === "STUDENT") {
      buttons = `
        <button class="btn btn-warning btn-sm"
          onclick="stayRead('${book.title}')">
          Stay & Read
        </button>`;
    }

    if (currentUser.role === "PROFESSOR" && available > 0) {
      buttons = `
        <button class="btn btn-warning btn-sm me-2"
          onclick="stayRead('${book.title}')">
          Stay & Read
        </button>
        <button class="btn btn-success btn-sm"
          onclick="borrowBook('${book.title}')">
          Take Book
        </button>`;
    }

    bookList.innerHTML += `
      <div class="col-md-4 mb-3">
        <div class="role-card">
          <h5>${book.title}</h5>
          <p class="text-muted">${book.author}</p>

          <p>
            📚 Total: <b>${book.total}</b><br>
            👁 Reading: <b>${readingCount}</b><br>
            📦 Taken: <b>${takenCount}</b><br>
            ✅ Available: <b>${available}</b>
          </p>

          ${buttons}
        </div>
      </div>`;
  });
}

function stayRead(bookTitle) {
  logs.push({
    userId: currentUser.id,
    userName: currentUser.name,
    role: currentUser.role,
    bookTitle,
    action: "READING",
    date: new Date().toLocaleString()
  });

  localStorage.setItem("logs", JSON.stringify(logs));
  renderBooks(books);
  showMyStatus();
}

function borrowBook(bookTitle) {
  logs.push({
    userId: currentUser.id,
    userName: currentUser.name,
    role: currentUser.role,
    bookTitle,
    action: "BORROWED",
    date: new Date().toLocaleString()
  });

  localStorage.setItem("logs", JSON.stringify(logs));
  renderBooks(books);
  showMyStatus();
}



renderBooks(books);

/* SEARCH */
function searchBooks() {
  const query = document.getElementById("searchBox").value.toLowerCase();
  const filtered = books.filter(b =>
    b.title.toLowerCase().includes(query)
  );
  renderBooks(filtered);
}

/* STUDENT STAY & READ */
function stayAndRead(bookTitle) {
  studentLogs.push({
    student: "Student User",
    book: bookTitle,
    status: "Reading"
  });
  localStorage.setItem("studentLogs", JSON.stringify(studentLogs));
  alert("Logged as Reading");
}

/* ADMIN: VIEW STUDENT LOGS */
if (currentUser.role === "ADMIN") {
  logsSection.classList.remove("d-none");
  const logList = document.getElementById("logList");

  logs.forEach(l => {
    logList.innerHTML += `
      <li class="list-group-item">
        👤 ${l.userName} (${l.role}) <br>
        📘 ${l.bookTitle} <br>
        🔖 ${l.action} | 🕒 ${l.date}
      </li>`;
  });
}


function logout() {
  localStorage.clear();
  window.location.href = "index.html";
}
function showMyStatus() {
  if (currentUser.role === "ADMIN") return;

  const myLogs = logs.filter(l => l.userId === currentUser.id);

  let html = `<h4>📘 My Activity</h4>
              <ul class="list-group mt-2">`;

  myLogs.forEach(l => {
    html += `
      <li class="list-group-item">
        <b>${l.bookTitle}</b> – ${l.action} <br>
        <small>${l.date}</small>
      </li>`;
  });

  html += `</ul>`;
  document.getElementById("myStatus").innerHTML = html;
}

showMyStatus();

