const Utils = {
  currency(value = 0) {
    return `Q ${Number(value).toFixed(2)}`;
  },
  now() {
    return new Date().toLocaleString("es-GT");
  },
  uid(prefix = "ID") {
    return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }
};
