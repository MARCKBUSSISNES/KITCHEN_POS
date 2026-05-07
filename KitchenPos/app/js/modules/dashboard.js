const DashboardModule = {
  list() {
    return AppDB.getAll("sales");
  }
};
