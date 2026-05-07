const CierresModule = {
  list() {
    return AppDB.getAll("cashClosings");
  }
};
