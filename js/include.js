async function includeComponent(selector, path) {
  const target = document.querySelector(selector);
  if (!target) return;

  try {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`${path} 불러오기 실패`);
    target.innerHTML = await response.text();
  } catch (error) {
    console.error(error);
  }
}

async function initializeLayout() {
  await Promise.all([
    includeComponent("#site-header", "/components/header.html"),
    includeComponent("#site-footer", "/components/footer.html")
  ]);

  const toggle = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".main-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const isOpen = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    });
  }

  const currentPath = location.pathname.replace(/\/$/, "/index.html");
  document.querySelectorAll(".main-nav a[href^='/']").forEach(link => {
    if (link.getAttribute("href") === currentPath) link.classList.add("active");
  });

  const year = document.querySelector("#current-year");
  if (year) year.textContent = new Date().getFullYear();
}

document.addEventListener("DOMContentLoaded", initializeLayout);
