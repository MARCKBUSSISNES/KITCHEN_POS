const CategoriasModule = {
  list() {
    return AppDB.getAll("categories");
  }
};
