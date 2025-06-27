// js/main.js
document.addEventListener("DOMContentLoaded", () => {
  const headerContainer = document.getElementById("header-container");
  if (headerContainer) {
    fetch("../components/header.html")
      .then(res => res.text())
      .then(data => {
        headerContainer.innerHTML = data;

        // After injecting header, highlight the active tab
        const currentPage = location.pathname.split("/").pop().replace(".html", "") || "index";
        const navLinks = document.querySelectorAll(".nav-link");

        navLinks.forEach(link => {
          if (link.dataset.page === currentPage) {
            link.classList.add("bg-blue-100", "font-semibold", "text-blue-800");
          }
        });
      })
      .catch(err => console.error("Error loading header:", err));
  }
});
