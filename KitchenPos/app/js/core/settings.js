const Settings = {
  load() {
    const saved = AppDB.find("appConfig", x => x.id === "main-config");
    if (saved) {
      AppState.settings = {
        ...AppState.settings,
        ...saved
      };
    }
    return AppState.settings;
  },

  save(config) {
    const exists = AppDB.find("appConfig", x => x.id === "main-config");

    if (exists) {
      AppDB.update("appConfig", "main-config", {
        ...exists,
        ...config
      });
    } else {
      AppDB.insert("appConfig", {
        id: "main-config",
        ...config
      });
    }

    this.load();
  },

  get() {
    return AppState.settings;
  }
};