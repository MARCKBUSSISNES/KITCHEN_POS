const HistorialModule = {
  list() {
    return AppDB.getAll("sales");
  }
};
