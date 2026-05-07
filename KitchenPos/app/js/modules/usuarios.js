const UsuariosModule = {
  list() {
    return AppDB.getAll("users");
  }
};
