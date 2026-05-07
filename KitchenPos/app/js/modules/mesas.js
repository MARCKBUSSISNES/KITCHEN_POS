const MesasModule = {
  list() {
    return AppDB.getAll("mesas");
  }
};
