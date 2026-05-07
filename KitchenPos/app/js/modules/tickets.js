const TicketsModule = {
  list() {
    return AppDB.getAll("tickets");
  }
};
