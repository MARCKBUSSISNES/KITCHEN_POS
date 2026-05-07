const Printers = {
  list() {
    return AppDB.getAll("printers");
  },

  getByKitchen(kitchenId) {
    const kitchen = AppDB.find("kitchens", k => k.id === kitchenId);
    if (!kitchen) return null;
    return AppDB.find("printers", p => p.id === kitchen.printerId) || null;
  }
};
