const POS = {
  cart: [],
  currentCategory: 'Todas',
  searchQuery: '',

  getProducts() {
    return DB.getProducts();
  },

  getCategories() {
    const cats = [...new Set(DB.getProducts().map(p => p.category))];
    return ['Todas', '🏷️ Promociones', ...cats.sort()];
  },

  getFilteredProducts() {
    if (this.currentCategory === '🏷️ Promociones') {
      const result = [];
      const special = DB.getDailySpecial();
      if (special) {
        const p = DB.getProducts().find(pr => pr.id === special.productId);
        if (p) result.push({ ...p, _specialName: special.name, _specialPrice: special.price, _isDailySpecial: true });
      }
      const promos = this.getActivePromotions();
      const promoIds = new Set();
      promos.forEach(p => {
        if (p.type === 'product' && p.productId) promoIds.add(p.productId);
        if (p.type === 'combo' && p.productIds) p.productIds.forEach(pid => promoIds.add(pid));
      });
      const promoProducts = DB.getProducts().filter(p => promoIds.has(p.id));
      return [...result, ...promoProducts.filter(p => !result.some(r => r.id === p.id))];
    }
    let products = DB.getProducts();
    if (this.currentCategory !== 'Todas') {
      products = products.filter(p => p.category === this.currentCategory);
    }
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      products = products.filter(p => p.name.toLowerCase().includes(q));
    }
    return products;
  },

  getActivePromotions() {
    return DB.getPromotions().filter(p => p.active);
  },

  addToCart(productId) {
    const existing = this.cart.find(item => item.productId === productId);
    if (existing) {
      existing.quantity++;
    } else {
      const product = DB.getProducts().find(p => p.id === productId);
      if (product) {
        this.cart.push({ productId: product.id, name: product.name, price: product.price, emoji: product.emoji, quantity: 1 });
      }
    }
    this.renderCart();
  },

  updateQuantity(productId, delta) {
    const item = this.cart.find(i => i.productId === productId);
    if (!item) return;
    item.quantity += delta;
    if (item.quantity <= 0) {
      this.cart = this.cart.filter(i => i.productId !== productId);
    }
    this.renderCart();
  },

  getCartDiscount() {
    const promos = this.getActivePromotions();
    let discount = 0;
    for (const promo of promos) {
      if (promo.type === 'product' && promo.productId) {
        for (const item of this.cart) {
          if (item.productId === promo.productId) {
            discount += item.price * item.quantity * (promo.discountPercent / 100);
          }
        }
      }
      if (promo.type === 'combo' && promo.productIds) {
        const hasAll = promo.productIds.every(pid => this.cart.some(i => i.productId === pid));
        if (hasAll) {
          const comboTotal = this.cart
            .filter(i => promo.productIds.includes(i.productId))
            .reduce((s, i) => s + i.price * i.quantity, 0);
          discount += comboTotal * (promo.discountPercent / 100);
        }
      }
    }
    return Math.round(discount * 100) / 100;
  },

  getCartSubtotal() {
    return this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  },

  getCartTotal() {
    const subtotal = this.getCartSubtotal();
    const discount = this.getCartDiscount();
    return Math.round((subtotal - discount) * 100) / 100;
  },

  clearCart() {
    this.cart = [];
    this.renderCart();
  },

  completeSale(paidAmount) {
    const total = this.getCartTotal();
    if (total <= 0) return null;
    const iva = total * 0.16;
    const subtotal = total - iva;
    const change = paidAmount - total;
    const sale = {
      items: [...this.cart],
      discount: this.getCartDiscount(),
      subtotal: Math.round(subtotal * 100) / 100,
      iva: Math.round(iva * 100) / 100,
      total: Math.round(total * 100) / 100,
      paid: Math.round(paidAmount * 100) / 100,
      change: Math.round(change * 100) / 100,
      cashier: Auth.getUser()?.name || 'Desconocido',
      date: new Date().toISOString(),
    };
    const saved = DB.addSale(sale);
    this.cart = [];
    this.renderCart();
    return saved;
  },

  printTicket(sale) {
    const tmpl = document.getElementById('ticket-template');
    const ticket = tmpl.cloneNode(true);
    ticket.style.display = 'block';
    ticket.querySelector('.ticket-folio').textContent = String(sale.id).padStart(6, '0');
    ticket.querySelector('.ticket-cajero').textContent = sale.cashier;
    ticket.querySelector('.ticket-fecha').textContent = new Date(sale.date).toLocaleString('es-MX');
    ticket.querySelector('.ticket-subtotal').textContent = `$${sale.subtotal.toFixed(2)}`;
    ticket.querySelector('.ticket-iva').textContent = `$${sale.iva.toFixed(2)}`;
    ticket.querySelector('.ticket-total').textContent = `$${sale.total.toFixed(2)}`;
    ticket.querySelector('.ticket-efectivo').textContent = `$${sale.paid.toFixed(2)}`;
    ticket.querySelector('.ticket-cambio').textContent = `$${sale.change.toFixed(2)}`;
    const tbody = ticket.querySelector('.ticket-items tbody');
    sale.items.forEach(item => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${item.quantity}</td><td>${item.name}</td><td>$${(item.price * item.quantity).toFixed(2)}</td>`;
      tbody.appendChild(tr);
    });
    const printWin = window.open('', '_blank', 'width=300,height=600');
    printWin.document.write(`<html><head><title>Ticket</title><style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Courier New', monospace; font-size: 12px; padding: 0.5rem; }
      .ticket { max-width: 80mm; margin: 0 auto; }
      .ticket-header { text-align: center; margin-bottom: 0.25rem; }
      .ticket-header h2 { font-size: 16px; margin-bottom: 0.125rem; }
      table { width: 100%; border-collapse: collapse; }
      th { text-align: left; padding: 0.125rem 0; border-bottom: 1px dashed #000; font-size: 11px; }
      th:last-child, td:last-child { text-align: right; }
      td { padding: 0.125rem 0; font-size: 11px; }
      td:nth-child(2) { text-align: center; }
      .ticket-totales p { display: flex; justify-content: space-between; margin: 0.125rem 0; font-size: 11px; }
      .ticket-total-row { font-weight: 700; font-size: 13px !important; }
      .ticket-footer { text-align: center; font-size: 11px; margin-top: 0.25rem; }
      hr { border: none; border-top: 1px dashed #000; margin: 0.25rem 0; }
      .ticket p { margin: 0.125rem 0; font-size: 11px; }
    </style></head><body>`);
    printWin.document.write(ticket.innerHTML);
    printWin.document.write('</body></html>');
    printWin.document.close();
    setTimeout(() => {
      printWin.focus();
      printWin.print();
    }, 500);
  },

  showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) {
      const t = document.createElement('div');
      t.id = 'toast';
      t.className = 'toast';
      document.body.appendChild(t);
      setTimeout(() => {
        t.textContent = message;
        t.className = `toast ${type} show`;
        setTimeout(() => {
          t.className = 'toast';
        }, 3000);
      }, 50);
      return;
    }
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => { toast.className = 'toast'; }, 3000);
  },

  renderProducts() {
    const grid = document.getElementById('products-grid');
    if (!grid) return;
    const products = this.getFilteredProducts();
    if (products.length === 0) {
      grid.innerHTML = '<div class="cart-empty" style="grid-column:1/-1"><div class="empty-icon">🔍</div><p>No se encontraron productos</p></div>';
      return;
    }
    const html = products.map(p => {
      const promo = this.getActivePromotions().find(pr => pr.type === 'product' && pr.productId === p.id);
      const displayName = p._specialName || p.name;
      const displayPrice = p._specialPrice || p.price;
      return `
        <div class="product-card ${p._isDailySpecial ? 'daily-special' : ''}" data-id="${p.id}" onclick="POS.addToCart(${p.id})">
          ${p._isDailySpecial ? '<div class="special-label">☕ Café del Día</div>' : ''}
          ${promo && !p._isDailySpecial ? `<div class="promo-badge">-${promo.discountPercent}%</div>` : ''}
          <div class="product-emoji">${p.emoji}</div>
          <div class="product-name">${displayName}</div>
          <div class="product-price">$${displayPrice.toFixed(2)}</div>
        </div>
      `;
    }).join('');
    grid.innerHTML = html;
  },

  renderCategories() {
    const tabs = document.getElementById('category-tabs');
    if (!tabs) return;
    const categories = this.getCategories();
    tabs.innerHTML = categories.map(cat => `
      <button class="category-tab ${cat === this.currentCategory ? 'active' : ''}"
        onclick="POS.setCategory('${cat}')">${cat}</button>
    `).join('');
  },

  setCategory(cat) {
    this.currentCategory = cat;
    this.renderCategories();
    this.renderProducts();
  },

  setSearch(query) {
    this.searchQuery = query;
    this.renderProducts();
  },

  renderCart() {
    const container = document.getElementById('cart-items');
    const count = document.getElementById('cart-count');
    const subtotalEl = document.getElementById('cart-subtotal');
    const discountEl = document.getElementById('cart-discount');
    const ivaEl = document.getElementById('cart-iva');
    const totalEl = document.getElementById('cart-total');
    const payBtn = document.getElementById('btn-pay');
    if (!container) return;

    const rawTotal = this.getCartSubtotal();
    const discount = this.getCartDiscount();
    const total = this.getCartTotal();
    const iva = total * 0.16;
    const subtotal = total - iva;

    if (count) count.textContent = this.cart.reduce((s, i) => s + i.quantity, 0);
    if (subtotalEl) subtotalEl.textContent = `$${rawTotal.toFixed(2)}`;
    if (discountEl) {
      if (discount > 0) {
        discountEl.textContent = `-$${discount.toFixed(2)}`;
        discountEl.style.display = 'flex';
      } else {
        discountEl.style.display = 'none';
      }
    }
    if (ivaEl) ivaEl.textContent = `$${iva.toFixed(2)}`;
    if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;
    if (payBtn) payBtn.disabled = total <= 0;

    if (this.cart.length === 0) {
      container.innerHTML = `<div class="cart-empty"><div class="empty-icon">🛒</div><p>Agrega productos al carrito</p></div>`;
      return;
    }

    container.innerHTML = this.cart.map(item => {
      const promo = this.getActivePromotions().find(pr => pr.type === 'product' && pr.productId === item.productId);
      return `
        <div class="cart-item">
          <div class="cart-item-info">
            <div class="cart-item-name">${item.emoji} ${item.name}</div>
            <div class="cart-item-price">$${item.price.toFixed(2)} c/u${promo ? ` <span class="promo-tag">-${promo.discountPercent}%</span>` : ''}</div>
          </div>
          <div class="cart-item-qty">
            <button class="qty-btn remove" onclick="POS.updateQuantity(${item.productId}, -1)">−</button>
            <span>${item.quantity}</span>
            <button class="qty-btn" onclick="POS.updateQuantity(${item.productId}, 1)">+</button>
          </div>
          <div class="cart-item-total">$${(item.price * item.quantity).toFixed(2)}</div>
        </div>
      `;
    }).join('');
  },
};
