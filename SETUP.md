# Kings Fashion — Setup Guide

Your site is a fully free, static website — no backend, no accounts, no monthly cost. Customers browse, add to cart, and checkout opens WhatsApp with their order pre-filled as a message to you.

---

## PART 1 — Put the site on GitHub

1. Go to https://github.com and create a free account if you don't have one.
2. Click the **+** icon (top right) → **New repository**. Name it `kings-fashion` → make it **Public** → click **Create repository**.
3. On the new repository page, click **uploading an existing file**.
4. Drag in **all the files and folders** from this project (`index.html`, `products.json`, `SETUP.md`, and the whole `assets` folder — GitHub's uploader accepts folders when dragged in, keeping their structure).
5. Scroll down and click **Commit changes**.

---

## PART 2 — Turn on GitHub Pages (make it live)

1. In your repository, click **Settings** (top menu).
2. In the left sidebar, click **Pages**.
3. Under **Build and deployment > Source**, choose **Deploy from a branch**.
4. Under **Branch**, choose `main` and folder `/ (root)` → click **Save**.
5. Wait about a minute, then refresh the page — GitHub will show your live URL, something like:
   `https://yourusername.github.io/kings-fashion/`

That's your website — share this link anywhere (Instagram bio, WhatsApp status, business cards).

---

## How to add or edit products (no coding needed)

1. In your GitHub repository, click on `products.json`.
2. Click the **pencil (edit) icon**.
3. Copy an existing product block and change the details, following this pattern:

```json
{
  "id": "unique-short-id",
  "name": "Product Name",
  "category": "Bike Jackets",
  "price": 3000,
  "description": "A short description of the product.",
  "image": "",
  "featured": false
}
```

   - `id` must be unique and have no spaces (use hyphens).
   - `category` should match one of your existing categories exactly (e.g. `T-Shirts & Shirts`, `Trousers & Denims`, `Bike Jackets`, `Winter Jackets`, `Kids Collection`) so it groups correctly — or use a brand-new category name to create a new section.
   - Leave `image` as `""` to use the default icon, or paste a direct image URL if you have product photos hosted somewhere.
   - Make sure every product block is separated by a comma, and the whole file stays inside the outer `[ ]` brackets.

4. Scroll down and click **Commit changes directly to the main branch**.
5. Your live site updates automatically within a minute or two.

---

## How ordering works for customers

1. Customer browses the shop and adds items to their cart (top-right cart icon).
2. They open the cart drawer and click **Place order via WhatsApp**.
3. This opens WhatsApp (web or app) to your business number, with a message pre-filled listing every item, quantity, and the total.
4. The customer just hits send — the order lands directly in your WhatsApp as a normal chat, where you can confirm availability, arrange payment, and delivery.

No customer account, login, or password is required at any point.

---

## If you ever want order history back

If later on you want to track orders in a proper system (so you and customers can see order status, past orders, etc.), that requires adding a small free backend (like Firebase). Just let me know and I can build that layer back in without changing anything else about the site.

---

## Costs

GitHub Pages is free with no limits relevant to a small business site. There is nothing else to pay for with this setup.
