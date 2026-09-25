let products = [];
let selectedCategory = "all";

const $ = (s) => document.querySelector(s);

const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[m]));

const money = (n) =>
  Number(n || 0).toLocaleString("fa-IR");

async function load() {
  const [p, c] = await Promise.all([
    fetch("/api/products"),
    fetch("/api/categories")
  ]);

  products = await p.json();
  const categories = await c.json();

  $("#categories").innerHTML =
    '<button class="chip active" data-id="all">همه</button>' +
    categories.map(c =>
      `<button class="chip" data-id="${esc(c.id)}">${esc(c.name)}</button>`
    ).join("");

  $("#categories").onclick = (e) => {
    const button = e.target.closest(".chip");
    if (!button) return;

    selectedCategory = button.dataset.id;

    document.querySelectorAll(".chip")
      .forEach(x => x.classList.remove("active"));

    button.classList.add("active");

    render();
  };

  render();
}

function render() {
  const list =
    selectedCategory === "all"
      ? products
      : products.filter(p => p.category_id === selectedCategory);

  $("#productGrid").innerHTML = list.length
    ? list.map(p => `
      <article class="product">
        ${
          p.image
            ? `<img src="${esc(p.image)}" alt="${esc(p.name)}">`
            : ""
        }

        <div class="body">
          <h3>${esc(p.name)}</h3>

          <span class="price">
            ${money(p.price)} تومان
          </span>

          ${
            p.old_price
              ? `<span class="old">${money(p.old_price)}</span>`
              : ""
          }

          <p>${esc(p.description || "")}</p>
        </div>
      </article>
    `).join("")
    : "محصولی برای نمایش نیست.";
}

load().catch(() => {
  $("#productGrid").textContent =
    "خطا در دریافت محصولات.";
});
