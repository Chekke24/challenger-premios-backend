const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./gestion_archivos.db", (err) => {
  if (err) {
    console.error("❌ Error al conectar a SQLite:", err.message);
  } else {
    console.log("✅ Conectado a SQLite");
  }
});

// Crear la tabla si no existe
db.run(
  `CREATE TABLE IF NOT EXISTS publicaciones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    imagen TEXT NOT NULL,
    categoria TEXT NOT NULL
  )`
);

// Verificar si la columna "categoria" ya existe
db.get("PRAGMA table_info(publicaciones)", (err, rows) => {
  if (err) {
    console.error("❌ Error al verificar la estructura de la tabla:", err);
  } else {
    const columnas = rows.map((row) => row.name);
    if (!columnas.includes("categoria")) {
      db.run("ALTER TABLE publicaciones ADD COLUMN categoria TEXT", (alterErr) => {
        if (alterErr) {
          console.error("❌ Error al agregar la columna 'categoria':", alterErr);
        } else {
          console.log("✅ Columna 'categoria' añadida correctamente.");
        }
      });
    }
  }
});

module.exports = db;