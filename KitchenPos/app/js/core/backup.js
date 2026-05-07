const Backup = {
  exportJson() {
    const data = JSON.stringify(AppDB.data, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `kitchenos_backup_${Date.now()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1500);
  },

  importJson(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        AppDB.data = JSON.parse(reader.result);
        AppDB.save();
        alert("Backup importado correctamente.");
        location.reload();
      } catch {
        alert("El archivo no es válido.");
      }
    };
    reader.readAsText(file);
  }
};
