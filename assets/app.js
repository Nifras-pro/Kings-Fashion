// ============================================================
// SITE SETTINGS — edit these directly if your number changes
// ============================================================
const WHATSAPP_NUMBER = "94764176119"; // no + or spaces, country code first
const CURRENCY = "Rs.";

// ============================================================
// Category icon fallback (used when a product has no image yet)
// ============================================================
const CATEGORY_ICONS = {
  "T-Shirts & Shirts": `<path d="M8 4l4 2 4-2 2 3-2 1v12H6V8L4 7z"/>`,
  "Trousers & Denims": `<path d="M6 4h12l-1 16H7L6 4z"/><path d="M6 9h12"/>`,
  "Bike Jackets": `<path d="M7 4l3 2h4l3-2 3 4-2 2v10H6V10L4 8z"/><path d="M10 6v4M14 6v4"/>`,
  "Winter Jackets": `<path d="M12 3l7 4v6c0 4-3 7-7 8-4-1-7-4-7-8V7l7-4z"/>`,
  "Gents Collection": `<circle cx="12" cy="7" r="3"/><path d="M6 21v-4a6 6 0 0 1 12 0v4"/>`,
  "Kids Collection": `<circle cx="12" cy="6" r="2.4"/><path d="M8 20v-3a4 4 0 0 1 8 0v3"/>`
};
const DEFAULT_ICON = `<path d="M8 4l4 2 4-2 2 3-2 1v12H6V8L4 7z"/>`;

// ============================================================
// Cart (persisted to localStorage so it survives a page refresh)
// ============================================================
const Cart = {
  key: "kf_cart",
  read(){
    try{
      const raw = localStorage.getItem(this.key);
      return raw ? JSON.parse(raw) : {};
    }catch(e){ return {}; }
  },
  write(data){
    try{ localStorage.setItem(this.key, JSON.stringify(data)); }catch(e){}
  },
  add(productId){
    const data = this.read();
    data[productId] = (data[productId] || 0) + 1;
    this.write(data);
    renderCart();
  },
  setQty(productId, qty){
    const data = this.read();
    if(qty <= 0){ delete data[productId]; }
    else{ data[productId] = qty; }
    this.write(data);
    renderCart();
  },
  clear(){ this.write({}); renderCart(); },
  count(){
    const data = this.read();
    return Object.values(data).reduce((a,b) => a+b, 0);
  }
};

let ALL_PRODUCTS = [];

async function loadProducts(){
  try{
    const res = await fetch("products.json", {cache:"no-store"});
    ALL_PRODUCTS = await res.json();
  }catch(e){
    console.error("Could not load products.json", e);
    ALL_PRODUCTS = [];
  }
  renderProducts();
  renderCart();
}

function renderProducts(){
  const container = document.getElementById("shop-container");
  if(!container) return;
  const byCategory = {};
  ALL_PRODUCTS.forEach(p => {
    if(!byCategory[p.category]) byCategory[p.category] = [];
    byCategory[p.category].push(p);
  });
  container.innerHTML = "";
  Object.keys(byCategory).forEach(cat => {
    const block = document.createElement("div");
    block.className = "category-block";
    const iconPath = CATEGORY_ICONS[cat] || DEFAULT_ICON;
    block.innerHTML = `
      <h3>${cat}</h3>
      <div class="product-grid">
        ${byCategory[cat].map(p => productCardHTML(p, iconPath)).join("")}
      </div>
    `;
    container.appendChild(block);
  });
  // wire up add-to-cart buttons
  container.querySelectorAll("[data-add]").forEach(btn => {
    btn.addEventListener("click", () => Cart.add(btn.getAttribute("data-add")));
  });
}

function productCardHTML(p, iconPath){
  const img = p.image
    ? `<img src="${p.image}" alt="${escapeHTML(p.name)}">`
    : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4">${iconPath}</svg>`;
  return `
    <div class="product-card">
      <div class="product-thumb">${img}</div>
      <h4>${escapeHTML(p.name)}</h4>
      <p class="desc">${escapeHTML(p.description || "")}</p>
      <div class="price-row">
        <span class="price">${CURRENCY} ${Number(p.price).toLocaleString()}</span>
        <button class="add-btn" data-add="${p.id}">Add to cart</button>
      </div>
    </div>
  `;
}

function escapeHTML(str){
  const div = document.createElement("div");
  div.textContent = str || "";
  return div.innerHTML;
}

function findProduct(id){
  return ALL_PRODUCTS.find(p => p.id === id);
}

// ============================================================
// Cart drawer rendering
// ============================================================
function renderCart(){
  const badge = document.getElementById("cart-badge");
  if(badge){
    const count = Cart.count();
    badge.textContent = count;
    badge.style.display = count > 0 ? "flex" : "none";
  }
  const body = document.getElementById("cart-body");
  const footer = document.getElementById("cart-footer");
  if(!body) return;

  const data = Cart.read();
  const ids = Object.keys(data);
  if(ids.length === 0){
    body.innerHTML = `<div class="cart-empty">Your cart is empty. Browse the shop and add something you like.</div>`;
    if(footer) footer.style.display = "none";
    return;
  }
  if(footer) footer.style.display = "block";

  let total = 0;
  body.innerHTML = ids.map(id => {
    const p = findProduct(id);
    if(!p) return "";
    const qty = data[id];
    const lineTotal = p.price * qty;
    total += lineTotal;
    return `
      <div class="cart-item">
        <div class="cart-item-info">
          <h5>${escapeHTML(p.name)}</h5>
          <div class="sub">${CURRENCY} ${Number(p.price).toLocaleString()} each</div>
          <div class="qty-row">
            <button class="qty-btn" data-dec="${id}">−</button>
            <span>${qty}</span>
            <button class="qty-btn" data-inc="${id}">+</button>
          </div>
          <a class="remove-link" data-remove="${id}">Remove</a>
        </div>
        <div class="item-price">${CURRENCY} ${lineTotal.toLocaleString()}</div>
      </div>
    `;
  }).join("");

  const totalAmountEl = document.getElementById("cart-total-amount");
  if(totalAmountEl) totalAmountEl.textContent = `${CURRENCY} ${total.toLocaleString()}`;

  body.querySelectorAll("[data-inc]").forEach(b => b.addEventListener("click", () => {
    const id = b.getAttribute("data-inc");
    Cart.setQty(id, (data[id]||0) + 1);
  }));
  body.querySelectorAll("[data-dec]").forEach(b => b.addEventListener("click", () => {
    const id = b.getAttribute("data-dec");
    Cart.setQty(id, (data[id]||0) - 1);
  }));
  body.querySelectorAll("[data-remove]").forEach(b => b.addEventListener("click", () => {
    Cart.setQty(b.getAttribute("data-remove"), 0);
  }));
}

// ============================================================
// Drawer + modal open/close plumbing
// ============================================================
function openDrawer(){
  document.getElementById("cart-overlay").classList.add("open");
  document.getElementById("cart-drawer").classList.add("open");
}
function closeDrawer(){
  document.getElementById("cart-overlay").classList.remove("open");
  document.getElementById("cart-drawer").classList.remove("open");
}
// ============================================================
// Checkout: build a WhatsApp message from the cart, no login needed
// ============================================================
function doCheckout(){
  const data = Cart.read();
  const ids = Object.keys(data);
  if(ids.length === 0) return;

  const items = ids.map(id => {
    const p = findProduct(id);
    return { id, name: p.name, qty: data[id], price: p.price };
  });
  const total = items.reduce((sum, it) => sum + it.price * it.qty, 0);

  const lines = items.map(it => `- ${it.name} x${it.qty} — ${CURRENCY} ${(it.price*it.qty).toLocaleString()}`);
  const message =
    `Hi, I'd like to order the following from Kings Fashion:\n\n` +
    lines.join("\n") +
    `\n\nTotal: ${CURRENCY} ${total.toLocaleString()}`;

  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank");

  Cart.clear();
  closeDrawer();
}

// ============================================================
// Wire up global UI once DOM is ready
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
  loadProducts();

  document.getElementById("cart-btn")?.addEventListener("click", openDrawer);
  document.getElementById("cart-close")?.addEventListener("click", closeDrawer);
  document.getElementById("cart-overlay")?.addEventListener("click", closeDrawer);
  document.getElementById("checkout-btn")?.addEventListener("click", doCheckout);
});
