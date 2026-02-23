const books = [
  { id: 1, title: "Database Systems", author: "Ramakrishnan", total: 3 },
  { id: 2, title: "Operating Systems", author: "Silberschatz", total: 2 },
  { id: 3, title: "Computer Networks", author: "Tanenbaum", total: 4 },
  { id: 4, title: "Software Engineering", author: "Pressman", total: 5 }
];


const currentUser = {
  id: "U001",
  name: "Demo User",
  role: localStorage.getItem("role")
};

let logs = JSON.parse(localStorage.getItem("logs")) || [];
