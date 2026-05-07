const CajaModule = {
  list() {
    return AppDB.getAll("cashClosings");
  }
};
