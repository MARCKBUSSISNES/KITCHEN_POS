const CocinasModule = {
  list() {
    return AppDB.getAll("kitchens");
  }
};
