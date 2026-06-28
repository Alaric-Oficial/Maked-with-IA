const Auth = {
  currentUser: null,
  sessionKey: 'pos_session',

  init() {
    const saved = sessionStorage.getItem(this.sessionKey);
    if (saved) {
      try {
        this.currentUser = JSON.parse(saved);
      } catch { this.logout(); }
    }
  },

  login(username, password) {
    const users = DB.getUsers();
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      this.currentUser = { ...user };
      delete this.currentUser.password;
      sessionStorage.setItem(this.sessionKey, JSON.stringify(this.currentUser));
      return { success: true };
    }
    return { success: false, message: 'Usuario o contraseña incorrectos' };
  },

  logout() {
    this.currentUser = null;
    sessionStorage.removeItem(this.sessionKey);
  },

  isLoggedIn() {
    return !!this.currentUser;
  },

  isAdmin() {
    return this.currentUser?.role === 'admin';
  },

  getUser() {
    return this.currentUser;
  },
};
