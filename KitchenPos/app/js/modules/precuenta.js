const PrecuentaModule = {
  list() {
    return AppDB.getAll("tickets");
  }
};
