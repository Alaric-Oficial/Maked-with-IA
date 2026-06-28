const App = {
  init() {
    DB.seed();
    Auth.init();
    this.render();
  },

  render() {
    if (Auth.isLoggedIn()) {
      this.renderPOS();
    } else {
      this.renderLogin();
    }
  },

  renderLogin() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="login-screen">
        <div class="login-card">
          <div class="logo">🏪</div>
          <h1>Punto de Venta</h1>
          <p>Inicia sesión para continuar</p>
          <div id="login-error" class="login-error"></div>
          <div class="form-group">
            <label for="username">Usuario</label>
            <input type="text" id="username" placeholder="Ingresa tu usuario" autocomplete="off" />
          </div>
          <div class="form-group">
            <label for="password">Contraseña</label>
            <input type="password" id="password" placeholder="Ingresa tu contraseña" />
          </div>
          <button class="btn btn-primary" onclick="App.handleLogin()">Iniciar Sesión</button>
          <div style="margin-top:1rem;font-size:0.75rem;color:var(--gray-400);text-align:left;background:var(--gray-50);padding:0.75rem;border-radius:8px;">
            <strong>Usuarios de prueba:</strong><br/>
            admin / admin (admin)<br/>
            cajero / caja (cajero)<br/>
            caja2 / caja2 (cajero)
          </div>
        </div>
      </div>
    `;
    document.getElementById('username').addEventListener('keydown', e => {
      if (e.key === 'Enter') document.getElementById('password').focus();
    });
    document.getElementById('password').addEventListener('keydown', e => {
      if (e.key === 'Enter') App.handleLogin();
    });
    document.getElementById('username').focus();
  },

  handleLogin() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const errorEl = document.getElementById('login-error');
    if (!username || !password) {
      errorEl.textContent = 'Ingresa usuario y contraseña';
      errorEl.classList.add('show');
      return;
    }
    const result = Auth.login(username, password);
    if (result.success) {
      this.renderPOS();
    } else {
      errorEl.textContent = result.message;
      errorEl.classList.add('show');
    }
  },

  renderPOS() {
    const user = Auth.getUser();
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="pos-screen">
        <div class="pos-header">
          <div class="pos-header-left">
            <h1>🏪 Punto de Venta</h1>
            <div class="pos-header-user">
              <div class="avatar">${user.name.charAt(0)}</div>
              <span>${user.name}</span>
            </div>
          </div>
          <div class="pos-header-actions">
            ${Auth.isAdmin() ? '<button class="btn-icon" onclick="App.showAdmin()" title="Administrar">⚙️</button>' : ''}
            <button class="btn-icon" onclick="App.showHistory()" title="Historial">📋</button>
            <button class="btn-icon" onclick="App.handleLogout()" title="Cerrar sesión">🚪</button>
          </div>
        </div>
        <div class="pos-body" id="pos-body">
          <div class="pos-products">
            <div class="pos-products-header">
              <div class="product-search">
                <span class="search-icon">🔍</span>
                <input type="text" id="product-search-input" placeholder="Buscar producto..." oninput="POS.setSearch(this.value)" />
              </div>
              <div class="category-tabs" id="category-tabs"></div>
            </div>
            <div class="products-grid" id="products-grid"></div>
          </div>
          <div class="pos-cart" id="pos-cart">
            <div class="pos-cart-header">
              <h2>🛒 Venta</h2>
              <div style="display:flex;align-items:center;gap:0.5rem;">
                <span class="cart-count" id="cart-count">0</span>
                <button class="btn-icon" style="width:32px;height:32px;font-size:0.875rem;background:var(--gray-200);color:var(--gray-600);" onclick="POS.clearCart()" title="Limpiar carrito">🗑️</button>
              </div>
            </div>
            <div class="cart-items" id="cart-items">
              <div class="cart-empty"><div class="empty-icon">🛒</div><p>Agrega productos al carrito</p></div>
            </div>
            <div class="cart-footer">
              <div class="cart-summary">
                <div class="summary-row"><span>Subtotal</span><span id="cart-subtotal">$0.00</span></div>
                <div class="summary-row" id="cart-discount-row" style="display:none;color:var(--success);"><span>Descuento</span><span id="cart-discount">-$0.00</span></div>
                <div class="summary-row"><span>IVA (16%)</span><span id="cart-iva">$0.00</span></div>
                <div class="summary-row total"><span>Total</span><span id="cart-total">$0.00</span></div>
              </div>
              <button class="btn-pay" id="btn-pay" onclick="App.showPaymentModal()" disabled>💵 Cobrar</button>
            </div>
          </div>
        </div>
      </div>
      <div class="modal-overlay" id="payment-modal">
        <div class="modal">
          <div class="modal-header">
            <h2>💵 Cobrar</h2>
            <button class="modal-close" onclick="App.closePaymentModal()">✕</button>
          </div>
          <div class="modal-body">
            <div class="payment-total-display">
              <div class="label">Total a cobrar</div>
              <div class="amount"><span class="currency">$</span><span id="modal-total">0.00</span></div>
            </div>
            <div class="payment-divider"><span>Monto recibido</span></div>
            <div class="calculator-display">
              <div class="calc-label">Efectivo recibido</div>
              <div class="calc-value"><span class="currency">$</span><span id="calc-display">0.00</span></div>
            </div>
            <div class="change-display" id="change-display">
              <div class="change-label" id="change-label">Cambio</div>
              <div class="change-amount" id="change-amount">$0.00</div>
            </div>
            <div class="calc-keypad" id="calc-keypad"></div>
          </div>
        </div>
      </div>
    `;
    POS.renderCategories();
    POS.renderProducts();
    POS.renderCart();

    document.getElementById('payment-modal').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) App.closePaymentModal();
    });
  },

  showPaymentModal() {
    const total = POS.getCartTotal();
    if (total <= 0) return;
    document.getElementById('modal-total').textContent = total.toFixed(2);
    document.getElementById('calc-display').textContent = '0.00';
    document.getElementById('change-display').classList.remove('show');
    document.getElementById('change-display').classList.remove('positive', 'negative');
    POS._calcValue = '';
    this.renderKeypad();
    document.getElementById('payment-modal').classList.add('open');
  },

  renderKeypad() {
    const pad = document.getElementById('calc-keypad');
    pad.innerHTML = `
      <button class="calc-key clear" data-action="clear">C</button>
      <button class="calc-key op" data-action="back">⌫</button>
      <button class="calc-key op" data-action="empty"></button>
      <button class="calc-key confirm" data-action="confirm">✓</button>
      <button class="calc-key num" data-value="7">7</button>
      <button class="calc-key num" data-value="8">8</button>
      <button class="calc-key num" data-value="9">9</button>
      <button class="calc-key op" data-action="empty"></button>
      <button class="calc-key num" data-value="4">4</button>
      <button class="calc-key num" data-value="5">5</button>
      <button class="calc-key num" data-value="6">6</button>
      <button class="calc-key op" data-action="empty"></button>
      <button class="calc-key num" data-value="1">1</button>
      <button class="calc-key num" data-value="2">2</button>
      <button class="calc-key num" data-value="3">3</button>
      <button class="calc-key op" data-value=".">.</button>
      <button class="calc-key num" data-value="0">0</button>
      <button class="calc-key num" data-value="00">00</button>
      <button class="calc-key pay-action" onclick="App.quickPay()">💰 Exacto</button>
    `;
    pad.querySelectorAll('.calc-key[data-value], .calc-key[data-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const val = btn.dataset.value;
        const action = btn.dataset.action;
        if (val !== undefined) this.calcInput(val);
        else if (action === 'clear') this.calcClear();
        else if (action === 'back') this.calcBack();
        else if (action === 'confirm') this.confirmPayment();
      });
    });
  },

  calcInput(val) {
    if (POS._calcValue === undefined) POS._calcValue = '';
    const current = POS._calcValue;
    if (val === '.' && current.includes('.')) return;
    const next = current + val;
    if (next.length > 10) return;
    POS._calcValue = next;
    this.updateCalcDisplay();
  },

  calcClear() {
    POS._calcValue = '';
    document.getElementById('change-display').classList.remove('show');
    this.updateCalcDisplay();
  },

  calcBack() {
    if (POS._calcValue === undefined) POS._calcValue = '';
    POS._calcValue = POS._calcValue.slice(0, -1);
    if (!POS._calcValue) document.getElementById('change-display').classList.remove('show');
    this.updateCalcDisplay();
  },

  updateCalcDisplay() {
    const val = POS._calcValue || '';
    const num = parseFloat(val) || 0;
    document.getElementById('calc-display').textContent = num.toFixed(2);
    const total = POS.getCartTotal();
    if (val.length > 0) {
      this.showChange(num, total);
    }
  },

  showChange(paid, total) {
    const change = paid - total;
    const el = document.getElementById('change-display');
    const label = document.getElementById('change-label');
    const amount = document.getElementById('change-amount');
    el.classList.add('show');
    if (change < 0) {
      el.classList.remove('positive');
      el.classList.add('negative');
      label.textContent = 'Faltan';
      amount.textContent = `$${Math.abs(change).toFixed(2)}`;
    } else {
      el.classList.remove('negative');
      el.classList.add('positive');
      label.textContent = 'Cambio';
      amount.textContent = `$${change.toFixed(2)}`;
    }
  },

  quickPay() {
    const total = POS.getCartTotal();
    POS._calcValue = total.toString();
    this.updateCalcDisplay();
  },

  confirmPayment() {
    const val = parseFloat(POS._calcValue) || 0;
    const total = POS.getCartTotal();
    if (val < total) {
      POS.showToast('El monto es insuficiente', 'error');
      return;
    }
    const sale = POS.completeSale(val);
    if (sale) {
      this.closePaymentModal();
      POS.showToast(`Venta completada — Cambio: $${sale.change.toFixed(2)}`, 'success');
      POS.printTicket(sale);
    }
  },

  closePaymentModal() {
    document.getElementById('payment-modal').classList.remove('open');
  },

  showHistory() {
    const sales = DB.getSales();
    if (sales.length === 0) {
      POS.showToast('No hay ventas registradas', 'info');
      return;
    }
    const app = document.getElementById('app');
    const user = Auth.getUser();
    const totalVentas = sales.reduce((s, v) => s + v.total, 0);
    app.innerHTML = `
      <div class="pos-screen">
        <div class="pos-header">
          <div class="pos-header-left">
            <h1>📋 Historial de Ventas</h1>
            <div class="pos-header-user">
              <div class="avatar">${user.name.charAt(0)}</div>
              <span>${user.name}</span>
            </div>
          </div>
          <div class="pos-header-actions">
            <button class="btn-icon" onclick="App.render()" title="Volver">⬅️</button>
            <button class="btn-icon" onclick="App.handleLogout()" title="Cerrar sesión">🚪</button>
          </div>
        </div>
        <div class="pos-body" style="flex-direction:column;overflow:auto;padding:1.25rem;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
            <h2 style="font-size:1.25rem;">Últimas ${sales.length} ventas</h2>
            <div style="background:var(--primary);color:white;padding:0.5rem 1rem;border-radius:8px;font-weight:700;">
              Total: $${totalVentas.toFixed(2)}
            </div>
          </div>
          <div style="display:grid;gap:0.75rem;">
            ${sales.map(s => `
              <div style="background:white;border-radius:12px;padding:1rem 1.25rem;box-shadow:var(--shadow);display:flex;justify-content:space-between;align-items:center;">
                <div>
                  <div style="font-weight:700;">Folio #${String(s.id).padStart(6, '0')}</div>
                  <div style="font-size:0.8125rem;color:var(--gray-500);">
                    ${new Date(s.date).toLocaleString('es-MX')} — ${s.cashier}
                    <span style="margin:0 0.5rem;">·</span>
                    ${s.items.length} producto(s)
                  </div>
                </div>
                <div style="text-align:right;">
                  <div style="font-weight:700;color:var(--success-dark);font-size:1.125rem;">$${s.total.toFixed(2)}</div>
                  <div style="font-size:0.75rem;color:var(--gray-500);">Pagó: $${s.paid.toFixed(2)} · Cambio: $${s.change.toFixed(2)}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  },

  showAdmin() {
    const user = Auth.getUser();
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="pos-screen">
        <div class="pos-header">
          <div class="pos-header-left">
            <h1>⚙️ Administración</h1>
            <div class="pos-header-user">
              <div class="avatar">${user.name.charAt(0)}</div>
              <span>${user.name}</span>
            </div>
          </div>
          <div class="pos-header-actions">
            <button class="btn-icon" onclick="App.render()" title="Volver a ventas">⬅️</button>
            <button class="btn-icon" onclick="App.handleLogout()" title="Cerrar sesión">🚪</button>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;flex:1;overflow:hidden;">
          <div style="display:flex;gap:0;background:var(--gray-100);border-bottom:2px solid var(--gray-200);padding:0 1.25rem;flex-shrink:0;">
            <button class="admin-tab active" data-tab="products" onclick="App.switchAdminTab('products')">📦 Productos</button>
            <button class="admin-tab" data-tab="promotions" onclick="App.switchAdminTab('promotions')">🏷️ Promociones</button>
          </div>
          <div id="admin-content" style="flex:1;overflow:auto;padding:1.25rem;"></div>
        </div>
      </div>
    `;
    this._currentAdminTab = 'products';
    this.renderAdminProducts();
  },

  switchAdminTab(tab) {
    this._currentAdminTab = tab;
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
    if (tab === 'products') this.renderAdminProducts();
    else if (tab === 'promotions') this.renderAdminPromotions();
  },

  renderAdminProducts() {
    const el = document.getElementById('admin-content');
    const products = DB.getProducts();
    el.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
        <h2 style="font-size:1.125rem;">${products.length} producto(s)</h2>
        <button class="btn btn-success btn-sm" onclick="App.showProductForm()">+ Nuevo</button>
      </div>
      <div style="display:grid;gap:0.5rem;">
        ${products.map(p => `
          <div style="background:white;border-radius:10px;padding:0.75rem 1rem;box-shadow:var(--shadow);display:flex;align-items:center;gap:0.75rem;">
            <span style="font-size:1.5rem;">${p.emoji}</span>
            <div style="flex:1;min-width:0;">
              <div style="font-weight:600;font-size:0.9375rem;">${p.name}</div>
              <div style="font-size:0.8125rem;color:var(--gray-500);">${p.category} — $${p.price.toFixed(2)}</div>
            </div>
            <button class="btn btn-sm btn-outline" onclick="App.showProductForm(${p.id})">✏️</button>
            <button class="btn btn-sm btn-outline" style="color:var(--danger);border-color:var(--danger);" onclick="App.deleteProduct(${p.id})">🗑️</button>
          </div>
        `).join('')}
      </div>
    `;
  },

  showProductForm(id) {
    const product = id ? DB.getProducts().find(p => p.id === id) : null;
    const categories = [...new Set(DB.getProducts().map(p => p.category))].sort();
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay open';
    overlay.id = 'product-form-overlay';
    overlay.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h2>${product ? '✏️ Editar' : '➕ Nuevo'} Producto</h2>
          <button class="modal-close" onclick="App.closeProductForm()">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Nombre</label>
            <input type="text" id="pf-name" value="${product ? product.name : ''}" placeholder="Nombre del producto" />
          </div>
          <div class="form-group">
            <label>Precio ($)</label>
            <input type="number" id="pf-price" value="${product ? product.price : ''}" step="0.5" min="0" placeholder="0.00" />
          </div>
          <div class="form-group">
            <label>Categoría</label>
            <select id="pf-category">
              ${categories.map(c => `<option value="${c}" ${product?.category === c ? 'selected' : ''}>${c}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Emoji</label>
            <input type="text" id="pf-emoji" value="${product ? product.emoji : '☕'}" placeholder="☕" maxlength="4" />
          </div>
          <div style="display:flex;gap:0.5rem;margin-top:1rem;">
            <button class="btn btn-primary" onclick="App.saveProduct(${product ? product.id : 'null'})">💾 Guardar</button>
            <button class="btn btn-outline" onclick="App.closeProductForm()">Cancelar</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', (e) => { if (e.target === e.currentTarget) App.closeProductForm(); });
  },

  closeProductForm() {
    const el = document.getElementById('product-form-overlay');
    if (el) el.remove();
  },

  saveProduct(id) {
    const name = document.getElementById('pf-name').value.trim();
    const price = parseFloat(document.getElementById('pf-price').value);
    const category = document.getElementById('pf-category').value;
    const emoji = document.getElementById('pf-emoji').value.trim() || '☕';
    if (!name || isNaN(price) || price <= 0) {
      POS.showToast('Completa todos los campos', 'error');
      return;
    }
    const product = id ? DB.getProducts().find(p => p.id === id) : {};
    product.name = name;
    product.price = Math.round(price * 100) / 100;
    product.category = category;
    product.emoji = emoji;
    if (!id) product.id = undefined;
    DB.saveProduct(product);
    this.closeProductForm();
    this.renderAdminProducts();
    POS.showToast('Producto guardado', 'success');
  },

  deleteProduct(id) {
    if (!confirm('¿Eliminar este producto?')) return;
    DB.deleteProduct(id);
    this.renderAdminProducts();
    POS.showToast('Producto eliminado', 'info');
  },

  renderAdminPromotions() {
    const el = document.getElementById('admin-content');
    const promos = DB.getPromotions();
    const products = DB.getProducts();
    const special = DB.getDailySpecial();
    el.innerHTML = `
      <div style="margin-bottom:1.5rem;background:white;border-radius:12px;padding:1rem 1.25rem;box-shadow:var(--shadow);">
        <h3 style="font-size:0.9375rem;font-weight:700;margin-bottom:0.75rem;">☕ Café del Día</h3>
        <div style="display:flex;gap:0.75rem;flex-wrap:wrap;align-items:end;">
          <div style="flex:1;min-width:140px;">
            <label style="display:block;font-size:0.75rem;font-weight:600;color:var(--gray-500);margin-bottom:0.25rem;">Producto</label>
            <select id="ds-product" style="width:100%;padding:0.5rem 0.75rem;border:2px solid var(--gray-200);border-radius:8px;font-size:0.875rem;">
              <option value="">— Sin especial —</option>
              ${products.map(p => `
                <option value="${p.id}" ${special?.productId === p.id ? 'selected' : ''}>${p.emoji} ${p.name}</option>
              `).join('')}
            </select>
          </div>
          <div style="flex:1;min-width:120px;">
            <label style="display:block;font-size:0.75rem;font-weight:600;color:var(--gray-500);margin-bottom:0.25rem;">Nombre (opcional)</label>
            <input type="text" id="ds-name" value="${special?.name || ''}" placeholder="Ej: Café Especial" style="width:100%;padding:0.5rem 0.75rem;border:2px solid var(--gray-200);border-radius:8px;font-size:0.875rem;" />
          </div>
          <div style="flex:1;min-width:100px;">
            <label style="display:block;font-size:0.75rem;font-weight:600;color:var(--gray-500);margin-bottom:0.25rem;">Precio</label>
            <input type="number" id="ds-price" value="${special?.price || ''}" step="0.5" min="0" placeholder="Original" style="width:100%;padding:0.5rem 0.75rem;border:2px solid var(--gray-200);border-radius:8px;font-size:0.875rem;" />
          </div>
          <button class="btn btn-primary btn-sm" onclick="App.saveDailySpecial()" style="margin-bottom:0;">💾 Guardar</button>
          ${special ? `<button class="btn btn-sm btn-outline" style="color:var(--danger);border-color:var(--danger);margin-bottom:0;" onclick="App.removeDailySpecial()">🗑️</button>` : ''}
        </div>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
        <h2 style="font-size:1.125rem;">${promos.length} promoción(es)</h2>
        <button class="btn btn-success btn-sm" onclick="App.showPromoForm()">+ Nueva</button>
      </div>
      <div style="display:grid;gap:0.5rem;">
        ${promos.map(p => {
          const target = p.type === 'product'
            ? products.find(pr => pr.id === p.productId)?.name || `ID ${p.productId}`
            : p.productIds?.map(pid => products.find(pr => pr.id === pid)?.name || `ID ${pid}`).join(', ');
          return `
            <div style="background:white;border-radius:10px;padding:0.75rem 1rem;box-shadow:var(--shadow);display:flex;align-items:center;gap:0.75rem;${p.active ? '' : 'opacity:0.5;'}>
              <span style="font-size:1.25rem;">🏷️</span>
              <div style="flex:1;min-width:0;">
                <div style="font-weight:600;font-size:0.9375rem;">${p.name}</div>
                <div style="font-size:0.8125rem;color:var(--gray-500);">
                  -${p.discountPercent}% · ${target} · ${p.active ? 'Activa' : 'Inactiva'}
                </div>
              </div>
              <button class="btn btn-sm btn-outline" onclick="App.showPromoForm(${p.id})">✏️</button>
              <button class="btn btn-sm btn-outline" style="color:var(--danger);border-color:var(--danger);" onclick="App.deletePromotion(${p.id})">🗑️</button>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  showPromoForm(id) {
    const promo = id ? DB.getPromotions().find(p => p.id === id) : null;
    const products = DB.getProducts();
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay open';
    overlay.id = 'promo-form-overlay';
    overlay.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h2>${promo ? '✏️ Editar' : '➕ Nueva'} Promoción</h2>
          <button class="modal-close" onclick="App.closePromoForm()">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Nombre</label>
            <input type="text" id="pr-name" value="${promo ? promo.name : ''}" placeholder="Ej: 2x1 Cappuccino" />
          </div>
          <div class="form-group">
            <label>Tipo</label>
            <select id="pr-type" onchange="App.togglePromoType()">
              <option value="product" ${promo?.type === 'product' ? 'selected' : ''}>Producto específico</option>
              <option value="combo" ${promo?.type === 'combo' ? 'selected' : ''}>Combo (varios productos)</option>
            </select>
          </div>
          <div class="form-group" id="pr-product-group">
            <label>Producto</label>
            <select id="pr-product">
              ${products.map(p => `<option value="${p.id}" ${promo?.type === 'product' && promo.productId === p.id ? 'selected' : ''}>${p.emoji} ${p.name}</option>`).join('')}
            </select>
          </div>
          <div class="form-group" id="pr-products-group" style="display:${promo?.type === 'combo' ? 'block' : 'none'}">
            <label>Productos en combo</label>
            <div style="display:grid;gap:0.375rem;max-height:150px;overflow-y:auto;">
              ${products.map(p => `
                <label style="display:flex;align-items:center;gap:0.5rem;font-size:0.875rem;cursor:pointer;">
                  <input type="checkbox" value="${p.id}" ${promo?.type === 'combo' && promo.productIds?.includes(p.id) ? 'checked' : ''} />
                  ${p.emoji} ${p.name}
                </label>
              `).join('')}
            </div>
          </div>
          <div class="form-group">
            <label>Descuento (%)</label>
            <input type="number" id="pr-discount" value="${promo ? promo.discountPercent : '50'}" min="1" max="100" placeholder="50" />
          </div>
          <div class="form-group">
            <label>Estado</label>
            <select id="pr-active">
              <option value="true" ${promo?.active !== false ? 'selected' : ''}>Activa</option>
              <option value="false" ${promo?.active === false ? 'selected' : ''}>Inactiva</option>
            </select>
          </div>
          <div style="display:flex;gap:0.5rem;margin-top:1rem;">
            <button class="btn btn-primary" onclick="App.savePromotion(${promo ? promo.id : 'null'})">💾 Guardar</button>
            <button class="btn btn-outline" onclick="App.closePromoForm()">Cancelar</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', (e) => { if (e.target === e.currentTarget) App.closePromoForm(); });
  },

  togglePromoType() {
    const type = document.getElementById('pr-type').value;
    document.getElementById('pr-product-group').style.display = type === 'product' ? 'block' : 'none';
    document.getElementById('pr-products-group').style.display = type === 'combo' ? 'block' : 'none';
  },

  closePromoForm() {
    const el = document.getElementById('promo-form-overlay');
    if (el) el.remove();
  },

  savePromotion(id) {
    const name = document.getElementById('pr-name').value.trim();
    const type = document.getElementById('pr-type').value;
    const discountPercent = parseInt(document.getElementById('pr-discount').value);
    const active = document.getElementById('pr-active').value === 'true';
    if (!name || isNaN(discountPercent) || discountPercent <= 0 || discountPercent > 100) {
      POS.showToast('Completa todos los campos', 'error');
      return;
    }
    const promo = id ? DB.getPromotions().find(p => p.id === id) : {};
    promo.name = name;
    promo.type = type;
    promo.discountPercent = discountPercent;
    promo.active = active;
    if (type === 'product') {
      promo.productId = parseInt(document.getElementById('pr-product').value);
      delete promo.productIds;
    } else {
      const checks = document.querySelectorAll('#pr-products-group input[type="checkbox"]:checked');
      promo.productIds = [...checks].map(c => parseInt(c.value));
      delete promo.productId;
      if (promo.productIds.length < 2) {
        POS.showToast('Selecciona al menos 2 productos para el combo', 'error');
        return;
      }
    }
    if (!id) promo.id = undefined;
    DB.savePromotion(promo);
    this.closePromoForm();
    this.renderAdminPromotions();
    POS.showToast('Promoción guardada', 'success');
  },

  deletePromotion(id) {
    if (!confirm('¿Eliminar esta promoción?')) return;
    DB.deletePromotion(id);
    this.renderAdminPromotions();
    POS.showToast('Promoción eliminada', 'info');
  },

  saveDailySpecial() {
    const productId = parseInt(document.getElementById('ds-product').value);
    if (!productId) {
      this.removeDailySpecial();
      return;
    }
    const name = document.getElementById('ds-name').value.trim() || null;
    const price = parseFloat(document.getElementById('ds-price').value) || null;
    const product = DB.getProducts().find(p => p.id === productId);
    DB.setDailySpecial({ productId, name: name || product.name, price, category: product.category });
    POS.showToast('Café del día actualizado', 'success');
    this.renderAdminPromotions();
  },

  removeDailySpecial() {
    DB.setDailySpecial(null);
    POS.showToast('Café del día eliminado', 'info');
    this.renderAdminPromotions();
  },

  handleLogout() {
    Auth.logout();
    this.renderLogin();
  },
};

document.addEventListener('DOMContentLoaded', () => App.init());
