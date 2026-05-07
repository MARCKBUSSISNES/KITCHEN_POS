const AppDB = {
  key: "kitchenos_demo_db_v6",
  data: {
    deliveryOrders: [],
    customers: [],
    users: [],
    mesas: [],
    tableAreas: [],
    products: [],
    categories: [],
    kitchens: [],
    printers: [],
    sales: [],
    cashClosings: [],
    cashSessions: [],
    cashMovements: [],
    tickets: [],
    audit: [],
    takeawayOrders: [],
    orders: [],
    orderItems: [],
    appConfig: []
  },

  async init() {
    this.reload();
  },

  reload() {
    const raw = localStorage.getItem(this.key);

    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        this.data = {
          ...this.data,
          ...parsed
        };
        this.ensureTables();
      } catch (error) {
        console.error("No se pudo leer la base local:", error);
        this.ensureTables();
        this.save();
      }
    } else {
      this.ensureTables();
      this.save();
    }

    return this.data;
  },

  ensureTables() {
    const defaults = {
      deliveryOrders: [],
      customers: [],
      users: [],
      mesas: [],
      tableAreas: [],
      products: [],
      categories: [],
      kitchens: [],
      printers: [],
      sales: [],
      cashClosings: [],
      cashSessions: [],
      cashMovements: [],
      tickets: [],
      audit: [],
      takeawayOrders: [],
      orders: [],
      orderItems: [],
      appConfig: []
    };

    Object.keys(defaults).forEach(name => {
      if (!Array.isArray(this.data[name])) this.data[name] = [];
    });
  },

  save() {
    this.ensureTables();
    localStorage.setItem(this.key, JSON.stringify(this.data));
  },

  table(name) {
    this.ensureTables();
    if (!this.data[name]) this.data[name] = [];
    return this.data[name];
  },

  insert(name, row) {
    // IMPORTANTE: recarga antes de escribir para no pisar cambios hechos desde otra pestaña/visor.
    this.reload();
    this.table(name).push(row);
    this.save();
    return row;
  },

  update(name, id, patch) {
    // IMPORTANTE: recarga antes de escribir para no revivir datos viejos del visor/KDS.
    this.reload();
    const rows = this.table(name);
    const index = rows.findIndex(x => x.id === id);

    if (index >= 0) {
      rows[index] = { ...rows[index], ...patch };
      this.save();
      return rows[index];
    }

    return null;
  },

  delete(name, id) {
    // IMPORTANTE: recarga antes de escribir para respetar cambios recientes de otras ventanas.
    this.reload();
    this.data[name] = this.table(name).filter(x => x.id !== id);
    this.save();
  },

  getAll(name) {
    this.ensureTables();
    return [...this.table(name)];
  },

  find(name, predicate) {
    this.ensureTables();
    return this.table(name).find(predicate);
  },

  filter(name, predicate) {
    this.ensureTables();
    return this.table(name).filter(predicate);
  }
};
