const ReportesModule = {
  list() {
    return AppDB.getAll("sales");
  }
};
