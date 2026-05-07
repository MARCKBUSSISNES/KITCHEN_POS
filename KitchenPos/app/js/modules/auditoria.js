const AuditoriaModule = {
  list() {
    return AppDB.getAll("audit");
  }
};
