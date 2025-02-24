const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const fs = require("fs");

// Verificar y crear carpetas necesarias
const uploadsPath = path.join(__dirname, "uploads");
const bannersPath = path.join(__dirname, "uploads/banners");

if (!fs.existsSync(uploadsPath)) fs.mkdirSync(uploadsPath);
if (!fs.existsSync(bannersPath)) fs.mkdirSync(bannersPath);

const app = express();
const db = new sqlite3.Database("./gestion_archivos.db", (err) => {
  if (err) console.error("❌ Error al conectar con la base de datos:", err.message);
  else console.log("✅ Conectado a SQLite");
});

// Crear tablas si no existen
db.run(
  `CREATE TABLE IF NOT EXISTS publicaciones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    imagen TEXT NOT NULL,
    categoria TEXT NOT NULL
  )`
);

db.run(
  `CREATE TABLE IF NOT EXISTS banners (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    imagen TEXT NOT NULL
  )`
);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));

// Configuración de almacenamiento de imágenes
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage: storage });

const bannerStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/banners/"),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const uploadBanner = multer({ storage: bannerStorage });

// Rutas
app.get("/", (req, res) => res.send("✅ Servidor funcionando correctamente"));

app.get("/publicaciones", (req, res) => {
  db.all("SELECT * FROM publicaciones", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post("/publicaciones", upload.single("imagen"), (req, res) => {
  const { titulo, descripcion, categoria } = req.body;
  const imagen = req.file ? req.file.filename : null;

  if (!titulo || !descripcion || !categoria || !imagen) {
    return res.status(400).json({ error: "Todos los campos son obligatorios" });
  }

  db.run(
    "INSERT INTO publicaciones (titulo, descripcion, categoria, imagen) VALUES (?, ?, ?, ?)",
    [titulo, descripcion, categoria, imagen],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "✅ Publicación subida correctamente", id: this.lastID });
    }
  );
});

app.delete("/publicaciones/:id", (req, res) => {
  db.run("DELETE FROM publicaciones WHERE id = ?", [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "✅ Publicación eliminada correctamente" });
  });
});

// Banners
app.get("/banners", (req, res) => {
  db.all("SELECT * FROM banners", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post("/banners", uploadBanner.single("imagen"), (req, res) => {
  const imagen = req.file ? req.file.filename : null;
  if (!imagen) return res.status(400).json({ error: "La imagen del banner es obligatoria" });

  db.run("INSERT INTO banners (imagen) VALUES (?)", [imagen], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "✅ Banner subido correctamente", id: this.lastID });
  });
});

app.delete("/banners/:id", (req, res) => {
  db.run("DELETE FROM banners WHERE id = ?", [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "✅ Banner eliminado correctamente" });
  });
});

// Iniciar servidor
app.listen(5000, () => console.log("🚀 Servidor corriendo en http://localhost:5000"));
