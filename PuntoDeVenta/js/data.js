const DB = {
  _prefix: 'pos_',

  get(key) {
    try {
      return JSON.parse(localStorage.getItem(this._prefix + key));
    } catch { return null; }
  },

  set(key, val) {
    localStorage.setItem(this._prefix + key, JSON.stringify(val));
  },

  seed() {
    if (!this.get('seeded') || this.get('version') !== '3') {
      this.set('users', [
        { id: 1, username: 'admin', password: 'admin', name: 'Administrador', role: 'admin' },
        { id: 2, username: 'cajero', password: 'caja', name: 'Carlos López', role: 'cashier' },
        { id: 3, username: 'caja2', password: 'caja2', name: 'María García', role: 'cashier' },
      ]);
      this.set('products', [
        { id: 1, name: 'Espresso', price: 28.00, category: 'Cafés', emoji: '☕' },
        { id: 2, name: 'Americano', price: 32.00, category: 'Cafés', emoji: '☕' },
        { id: 3, name: 'Cappuccino', price: 42.00, category: 'Cafés', emoji: '☕' },
        { id: 4, name: 'Latte', price: 42.00, category: 'Cafés', emoji: '☕' },
        { id: 5, name: 'Mocha', price: 48.00, category: 'Cafés', emoji: '☕' },
        { id: 6, name: 'Macchiato', price: 38.00, category: 'Cafés', emoji: '☕' },
        { id: 7, name: 'Café de Olla', price: 35.00, category: 'Cafés', emoji: '🫘' },
        { id: 8, name: 'Frappé', price: 55.00, category: 'Cafés', emoji: '🧊' },
        { id: 9, name: 'Cold Brew', price: 45.00, category: 'Cafés', emoji: '🧊' },
        { id: 10, name: 'Té Negro', price: 25.00, category: 'Tés', emoji: '🍵' },
        { id: 11, name: 'Té Verde', price: 25.00, category: 'Tés', emoji: '🍵' },
        { id: 12, name: 'Té Manzanilla', price: 25.00, category: 'Tés', emoji: '🍵' },
        { id: 13, name: 'Té Chai', price: 35.00, category: 'Tés', emoji: '🍵' },
        { id: 14, name: 'Té Menta', price: 25.00, category: 'Tés', emoji: '🍵' },
        { id: 15, name: 'Chocolate Caliente', price: 38.00, category: 'Tés', emoji: '🫕' },
        { id: 16, name: 'Agua Natural', price: 15.00, category: 'Bebidas Frías', emoji: '💧' },
        { id: 17, name: 'Agua Mineral', price: 18.00, category: 'Bebidas Frías', emoji: '🫧' },
        { id: 18, name: 'Jugo de Naranja', price: 28.00, category: 'Bebidas Frías', emoji: '🍊' },
        { id: 19, name: 'Limonada', price: 25.00, category: 'Bebidas Frías', emoji: '🍋' },
        { id: 20, name: 'Smoothie', price: 48.00, category: 'Bebidas Frías', emoji: '🥤' },
        { id: 21, name: 'Coca-Cola Lata', price: 18.00, category: 'Bebidas Frías', emoji: '🥤' },
        { id: 22, name: 'Sprite Lata', price: 18.00, category: 'Bebidas Frías', emoji: '🥤' },
        { id: 23, name: 'Agua de Sabor', price: 22.00, category: 'Bebidas Frías', emoji: '🫗' },
        { id: 24, name: 'Croissant', price: 28.00, category: 'Repostería', emoji: '🥐' },
        { id: 25, name: 'Muffin Arándano', price: 32.00, category: 'Repostería', emoji: '🧁' },
        { id: 26, name: 'Muffin Chocolate', price: 32.00, category: 'Repostería', emoji: '🧁' },
        { id: 27, name: 'Galleta Chips', price: 18.00, category: 'Repostería', emoji: '🍪' },
        { id: 28, name: 'Brownie', price: 35.00, category: 'Repostería', emoji: '🍫' },
        { id: 29, name: 'Pay de Queso', price: 42.00, category: 'Repostería', emoji: '🍰' },
        { id: 30, name: 'Panqué', price: 28.00, category: 'Repostería', emoji: '🍞' },
        { id: 31, name: 'Dona Azúcar', price: 20.00, category: 'Repostería', emoji: '🍩' },
        { id: 32, name: 'Churro', price: 15.00, category: 'Repostería', emoji: '🥨' },
        { id: 33, name: 'Sandwich Jamón', price: 55.00, category: 'Comida', emoji: '🥪' },
        { id: 34, name: 'Bagel Queso Crema', price: 48.00, category: 'Comida', emoji: '🥯' },
        { id: 35, name: 'Wrap Pollo', price: 62.00, category: 'Comida', emoji: '🌯' },
        { id: 36, name: 'Ensalada Caesar', price: 58.00, category: 'Comida', emoji: '🥗' },
        { id: 37, name: 'Yogurt con Granola', price: 42.00, category: 'Comida', emoji: '🫐' },
        { id: 38, name: 'Crema Batida', price: 10.00, category: 'Extras', emoji: '🧁' },
        { id: 39, name: 'Leche Vegetal', price: 8.00, category: 'Extras', emoji: '🥛' },
        { id: 40, name: 'Jarabe Vainilla', price: 8.00, category: 'Extras', emoji: '🌿' },
        { id: 41, name: 'Jarabe Caramelo', price: 8.00, category: 'Extras', emoji: '🍯' },
        { id: 42, name: 'Hielo Extra', price: 5.00, category: 'Extras', emoji: '🧊' },
      ]);
      this.set('promotions', [
        { id: 1, name: '2x1 en Cappuccino', type: 'product', discountPercent: 50, productId: 3, active: true },
        { id: 2, name: 'Pay de Queso + Americano $65', type: 'combo', discountPercent: 12, productIds: [29, 2], active: true },
      ]);
      this.set('sales', []);
      this.set('saleCounter', 1);
      this.set('nextProductId', 43);
      this.set('nextPromoId', 3);
      this.set('seeded', true);
      this.set('version', '3');
    }
  },

  getUsers() { return this.get('users') || []; },
  getProducts() { return this.get('products') || []; },
  getSales() { return this.get('sales') || []; },
  getPromotions() { return this.get('promotions') || []; },

  saveProduct(product) {
    const products = this.getProducts();
    if (product.id) {
      const idx = products.findIndex(p => p.id === product.id);
      if (idx >= 0) products[idx] = product;
    } else {
      product.id = this.get('nextProductId') || 1;
      this.set('nextProductId', product.id + 1);
      products.push(product);
    }
    this.set('products', products);
    return product;
  },

  deleteProduct(id) {
    const products = this.getProducts().filter(p => p.id !== id);
    this.set('products', products);
  },

  savePromotion(promo) {
    const promos = this.getPromotions();
    if (promo.id) {
      const idx = promos.findIndex(p => p.id === promo.id);
      if (idx >= 0) promos[idx] = promo;
    } else {
      promo.id = this.get('nextPromoId') || 1;
      this.set('nextPromoId', promo.id + 1);
      promos.push(promo);
    }
    this.set('promotions', promos);
    return promo;
  },

  deletePromotion(id) {
    const promos = this.getPromotions().filter(p => p.id !== id);
    this.set('promotions', promos);
  },

  getDailySpecial() {
    return this.get('dailySpecial') || null;
  },

  setDailySpecial(special) {
    this.set('dailySpecial', special);
  },

  addSale(sale) {
    const sales = this.getSales();
    sale.id = this.get('saleCounter') || 1;
    this.set('saleCounter', sale.id + 1);
    sales.unshift(sale);
    this.set('sales', sales);
    return sale;
  },
};
