const CobrosModule = {
  list() {
    return AppDB.getAll("sales");
  }
};
