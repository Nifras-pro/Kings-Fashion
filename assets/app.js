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
  // lineKey combines product id + size so each size is a separate cart line
  lineKey(productId, size){
    return size ? `${productId}::${size}` : productId;
  },
  add(productId, size){
    const data = this.read();
    const key = this.lineKey(productId, size);
    data[key] = (data[key] || 0) + 1;
    this.write(data);
    renderCart();
  },
  setQty(lineKey, qty){
    const data = this.read();
    if(qty <= 0){ delete data[lineKey]; }
    else{ data[lineKey] = qty; }
    this.write(data);
    renderCart();
  },
  clear(){ this.write({}); renderCart(); },
  count(){
    const data = this.read();
    return Object.values(data).reduce((a,b) => a+b, 0);
  }
};

// splits a cart line key back into { id, size }
function parseLineKey(lineKey){
  const idx = lineKey.indexOf("::");
  if(idx === -1) return { id: lineKey, size: null };
  return { id: lineKey.slice(0, idx), size: lineKey.slice(idx + 2) };
}

// returns the price to actually charge: salePrice if a valid sale is set, else normal price
function effectivePrice(p){
  return (typeof p.salePrice === "number" && p.salePrice < p.price) ? p.salePrice : p.price;
}
function isOnSale(p){
  return typeof p.salePrice === "number" && p.salePrice < p.price;
}

// returns stock status info, or null if the product doesn't track stock at all
const LOW_STOCK_THRESHOLD = 5;
function stockInfo(p){
  if(typeof p.stock !== "number") return null;
  if(p.stock <= 0) return { label: "Out of Stock", cls: "stock-out", disabled: true };
  if(p.stock <= LOW_STOCK_THRESHOLD) return { label: `Only ${p.stock} left`, cls: "stock-low", disabled: false };
  return { label: "In Stock", cls: "stock-in", disabled: false };
}

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

  const specials = ALL_PRODUCTS.filter(isOnSale);
  const byCategory = {};
  ALL_PRODUCTS.forEach(p => {
    if(!byCategory[p.category]) byCategory[p.category] = [];
    byCategory[p.category].push(p);
  });

  let html = "";
  if(specials.length > 0){
    html += `
      <div class="category-block specials-block">
        <h3 class="specials-heading">✦ This Week's Specials</h3>
        <div class="product-grid">
          ${specials.map(p => productCardHTML(p, CATEGORY_ICONS[p.category] || DEFAULT_ICON)).join("")}
        </div>
      </div>
    `;
  }
  Object.keys(byCategory).forEach(cat => {
    const iconPath = CATEGORY_ICONS[cat] || DEFAULT_ICON;
    html += `
      <div class="category-block">
        <h3>${cat}</h3>
        <div class="product-grid">
          ${byCategory[cat].map(p => productCardHTML(p, iconPath)).join("")}
        </div>
      </div>
    `;
  });
  container.innerHTML = html;

  // wire up add-to-cart buttons
  container.querySelectorAll("[data-add]").forEach(btn => {
    btn.addEventListener("click", () => {
      const pid = btn.getAttribute("data-add");
      const card = btn.closest(".product-card");
      const sizeSelect = card ? card.querySelector(".size-select") : null;
      const size = sizeSelect ? sizeSelect.value : null;
      Cart.add(pid, size);
    });
  });
  // wire up thumbnail image swapping
  container.querySelectorAll("[data-thumb]").forEach(btn => {
    btn.addEventListener("click", () => {
      const pid = btn.getAttribute("data-thumb");
      const src = btn.getAttribute("data-src");
      container.querySelectorAll(`.main-img[data-main="${pid}"]`).forEach(img => img.src = src);
      btn.closest(".product-card").querySelectorAll(".thumb-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });
}

function productCardHTML(p, iconPath){
  const imgs = (p.images && p.images.length) ? p.images : (p.image ? [p.image] : []);
  const hasImgs = imgs.length > 0;
  const mediaHTML = hasImgs
    ? `<img src="${imgs[0]}" alt="${escapeHTML(p.name)}" class="main-img" data-main="${p.id}">`
    : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4">${iconPath}</svg>`;
  const thumbsHTML = imgs.length > 1
    ? `<div class="thumb-row">${imgs.map((src, i) => `
        <button class="thumb-btn${i === 0 ? ' active' : ''}" data-thumb="${p.id}" data-src="${src}">
          <img src="${src}" alt="">
        </button>`).join("")}</div>`
    : "";
  const hasSizes = Array.isArray(p.sizes) && p.sizes.length > 0;
  const sizeHTML = hasSizes
    ? `<div class="size-row"><label>Size</label>
        <select class="size-select" data-product="${p.id}">
          ${p.sizes.map(s => `<option value="${escapeHTML(s)}">${escapeHTML(s)}</option>`).join("")}
        </select>
      </div>`
    : "";

  const sale = isOnSale(p);
  const price = effectivePrice(p);
  const priceHTML = sale
    ? `<span class="price-old">${CURRENCY} ${Number(p.price).toLocaleString()}</span> <span class="price">${CURRENCY} ${Number(price).toLocaleString()}</span>`
    : `<span class="price">${CURRENCY} ${Number(price).toLocaleString()}</span>`;
  const saleRibbon = sale ? `<span class="sale-ribbon">Sale</span>` : "";

  const stock = stockInfo(p);
  const stockBadge = stock ? `<span class="stock-badge ${stock.cls}">${stock.label}</span>` : "";
  const outOfStock = stock && stock.disabled;

  return `
    <div class="product-card">
      <div class="product-thumb">${mediaHTML}${saleRibbon}</div>
      ${thumbsHTML}
      <h4>${escapeHTML(p.name)}</h4>
      <p class="desc">${escapeHTML(p.description || "")}</p>
      ${stockBadge}
      ${hasSizes ? sizeHTML : ""}
      <div class="price-row">
        ${priceHTML}
        <button class="add-btn" data-add="${p.id}" ${outOfStock ? "disabled" : ""}>${outOfStock ? "Sold Out" : "Add to cart"}</button>
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
  body.innerHTML = ids.map(lineKey => {
    const { id, size } = parseLineKey(lineKey);
    const p = findProduct(id);
    if(!p) return "";
    const qty = data[lineKey];
    const price = effectivePrice(p);
    const lineTotal = price * qty;
    total += lineTotal;
    return `
      <div class="cart-item">
        <div class="cart-item-info">
          <h5>${escapeHTML(p.name)}${size ? ` <span class="size-tag">(${escapeHTML(size)})</span>` : ""}</h5>
          <div class="sub">${CURRENCY} ${Number(price).toLocaleString()} each</div>
          <div class="qty-row">
            <button class="qty-btn" data-dec="${lineKey}">−</button>
            <span>${qty}</span>
            <button class="qty-btn" data-inc="${lineKey}">+</button>
          </div>
          <a class="remove-link" data-remove="${lineKey}">Remove</a>
        </div>
        <div class="item-price">${CURRENCY} ${lineTotal.toLocaleString()}</div>
      </div>
    `;
  }).join("");

  const totalAmountEl = document.getElementById("cart-total-amount");
  if(totalAmountEl) totalAmountEl.textContent = `${CURRENCY} ${total.toLocaleString()}`;

  body.querySelectorAll("[data-inc]").forEach(b => b.addEventListener("click", () => {
    const key = b.getAttribute("data-inc");
    Cart.setQty(key, (data[key]||0) + 1);
  }));
  body.querySelectorAll("[data-dec]").forEach(b => b.addEventListener("click", () => {
    const key = b.getAttribute("data-dec");
    Cart.setQty(key, (data[key]||0) - 1);
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

  const items = ids.map(lineKey => {
    const { id, size } = parseLineKey(lineKey);
    const p = findProduct(id);
    const imgs = (p.images && p.images.length) ? p.images : (p.image ? [p.image] : []);
    const photoUrl = imgs.length ? new URL(imgs[0], window.location.href).href : null;
    return { id, name: p.name, size, qty: data[lineKey], price: effectivePrice(p), photoUrl };
  });
  const total = items.reduce((sum, it) => sum + it.price * it.qty, 0);

  const lines = items.map(it => {
    const sizeTag = it.size ? ` (Size: ${it.size})` : "";
    const photoLine = it.photoUrl ? `\n  Photo: ${it.photoUrl}` : "";
    return `- ${it.name}${sizeTag} x${it.qty} — ${CURRENCY} ${(it.price*it.qty).toLocaleString()}${photoLine}`;
  });
  const message =
    `Hi, I'd like to order the following from Kings Fashion:\n\n` +
    lines.join("\n\n") +
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
