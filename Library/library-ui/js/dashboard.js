const API = 'http://localhost:5000/api';
const token = localStorage.getItem('token');
const user  = JSON.parse(localStorage.getItem('user') || '{}');

// Redirect to login if not logged in
if (!token) window.location.href = 'index.html';

// Show welcome message
document.getElementById('welcome').innerText = `Welcome, ${user.name} (${user.role})`;

const bookList   = document.getElementById('bookList');
const logsSection = document.getElementById('logsSection');

// Helper: authenticated fetch
async function apiFetch(url, options = {}) {
  return fetch(`${API}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers
    }
  });
}

// Load and render books
async function loadBooks(search = '') {
  try {
    const url = search ? `/books?search=${encodeURIComponent(search)}` : '/books';
    const res  = await apiFetch(url);
    const books = await res.json();
    renderBooks(books);
  } catch (err) {
    bookList.innerHTML = '<p class="text-danger">Failed to load books.</p>';
  }
}

function renderBooks(books) {
  bookList.innerHTML = '';
  if (!books.length) {
    bookList.innerHTML = '<p class="text-muted">No books found.</p>';
    return;
  }

  books.forEach(book => {
    let buttons = '';

    if (user.role === 'student') {
      buttons = `
        <button class="btn btn-warning btn-sm"
          onclick="stayRead('${book._id}', '${book.title}')">
          Stay & Read
        </button>`;
    }

    if ((user.role === 'faculty' || user.role === 'admin') && book.availableCopies > 0) {
      buttons = `
        <button class="btn btn-warning btn-sm me-2"
          onclick="stayRead('${book._id}', '${book.title}')">
          Stay & Read
        </button>
        <button class="btn btn-success btn-sm"
          onclick="borrowBook('${book._id}', '${book.title}')">
          Take Book
        </button>`;
    } else if ((user.role === 'faculty' || user.role === 'admin') && book.availableCopies === 0) {
      buttons = `<span class="badge bg-danger">No copies available</span>`;
    }

    bookList.innerHTML += `
      <div class="col-md-4 mb-3">
        <div class="role-card">
          <h5>${book.title}</h5>
          <p class="text-muted">${book.author || ''}</p>
          <p class="text-muted small">${book.bookNumber || ''}</p>
          <p>
            📚 Total: <b>${book.totalCopies}</b><br>
            ✅ Available: <b>${book.availableCopies}</b>
          </p>
          ${buttons}
        </div>
      </div>`;
  });
}

// Borrow a book (faculty/admin only)
async function borrowBook(bookId, bookTitle) {
  if (!confirm(`Borrow "${bookTitle}"? Due in 14 days.`)) return;
  try {
    const res  = await apiFetch('/transactions/borrow', {
      method: 'POST',
      body: JSON.stringify({ bookId })
    });
    const data = await res.json();
    if (!res.ok) { alert(data.message); return; }
    alert(`✅ Borrowed successfully! Due: ${new Date(data.dueDate).toDateString()}`);
    loadBooks();
    loadLogs();
  } catch (err) {
    alert('Error borrowing book.');
  }
}

// Stay and Read (all roles)
async function stayRead(bookId, bookTitle) {
  try {
    const res  = await apiFetch('/transactions/reading', {
      method: 'POST',
      body: JSON.stringify({ bookId })
    });
    const data = await res.json();
    if (!res.ok) { alert(data.message); return; }
    alert(`📖 Reading session logged for "${bookTitle}"`);
    loadLogs();
  } catch (err) {
    alert('Error logging reading session.');
  }
}

// Search books
function searchBooks() {
  const query = document.getElementById('searchBox').value;
  loadBooks(query);
}

// Load activity logs
async function loadLogs() {
  try {
    const res  = await apiFetch('/logs');
    const logs = await res.json();

    if (user.role === 'admin') {
      logsSection.classList.remove('d-none');
      const logList = document.getElementById('logList');
      logList.innerHTML = '';
      logs.forEach(l => {
        logList.innerHTML += `
          <li class="list-group-item">
            👤 ${l.userName} (${l.userRole})<br>
            📘 ${l.bookTitle}<br>
            🔖 ${l.action} | 🕒 ${new Date(l.timestamp).toLocaleString()}
          </li>`;
      });
    }

    // Show my activity
    if (user.role !== 'admin') {
      let html = `<h4>📘 My Activity</h4><ul class="list-group mt-2">`;
      logs.forEach(l => {
        html += `
          <li class="list-group-item">
            <b>${l.bookTitle}</b> – ${l.action}<br>
            <small>${new Date(l.timestamp).toLocaleString()}</small>
          </li>`;
      });
      html += '</ul>';
      const myStatus = document.getElementById('myStatus');
      if (myStatus) myStatus.innerHTML = html;
    }
  } catch (err) {
    console.error('Failed to load logs', err);
  }
}

function logout() {
  localStorage.clear();
  window.location.href = 'index.html';
}

// Init
loadBooks();
loadLogs();
