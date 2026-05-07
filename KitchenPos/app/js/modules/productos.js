const ProductosModule = {
  list() {
    return AppDB.getAll("products");
  }
};
