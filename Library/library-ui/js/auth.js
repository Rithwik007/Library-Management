function login() {
  const role = document.getElementById("role").value;
  localStorage.setItem("role", role);
  window.location.href = "dashboard.html";
}
