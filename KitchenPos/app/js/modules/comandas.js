const ComandasModule = {
  list() {
    return AppDB.getAll("tickets");
  }
};
