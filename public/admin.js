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

async function checkLogin() {
  const r = await fetch("/api/auth");
  const data = await r.json();

  if (data.ok) {
    showPanel();
  }
}

function showPanel() {
  $("#login").hidden = true;
  $("#panel").hidden = false;
  load();
}

$("#loginBtn").onclick = async () => {
  const r = await fetch("/api/auth", {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({
      password: $("#password").value
    })
  });

  if (r.ok) {
    showPanel();
  } else {
    $("#msg").textContent = "رمز اشتباه است.";
  }
};

async function load() {
  const [productsRes, categoriesRes] = await Promise.all([
    fetch("/api/products"),
    fetch("/api/categories")
  ]);

  const products = await productsRes.json();
  const categories = await categoriesRes.json();

  $("#category").innerHTML =
    categories.map(c =>
      `<option value="${c.id}">${esc(c.name)}</option>`
    ).join("");

  $("#items").innerHTML =
    products.map(p => `
      <div class="card">
        <b>${esc(p.name)}</b>
        <p>${money(p.price)} تومان</p>

        <button
          class="btn ghost"
          onclick="deleteProduct('${p.id}')">
          حذف
        </button>
      </div>
    `).join("");
}

$("#add").onclick = async () => {
  await fetch("/api/products", {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({
      name: $("#name").value,
      price: Number($("#price").value),
      old_price: Number($("#old").value),
      discount: Number($("#discount").value),
      image: $("#image").value,
      description: $("#desc").value,
      category_id: $("#category").value
    })
  });

  $("#name").value = "";
  $("#price").value = "";
  $("#old").value = "";
  $("#discount").value = "";
  $("#image").value = "";
  $("#desc").value = "";

  load();
};

async function deleteProduct(id) {
  if (!confirm("این محصول حذف شود؟")) return;

  await fetch("/api/products/" + id, {
    method: "DELETE"
  });

  load();
}

checkLogin();
