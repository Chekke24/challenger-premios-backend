const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
require("dotenv").config(); // Para cargar variables de entorno
const pool = require("./database"); // Importamos la conexión de PostgreSQL

const app = express();
const PORT = process.env.PORT || 3000;

// 📂 Crear carpetas de almacenamiento si no existen
const uploadsPath = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsPath)) fs.mkdirSync(uploadsPath);

// 🌍 Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));

// Middleware para evitar caché en todas las respuestas
app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
});

// 📸 Configuración de almacenamiento de imágenes
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage: storage });

// 🏠 Ruta principal
app.get("/", (req, res) => {
  res.json({ message: "✅ Servidor funcionando correctamente" });
});

// 🔍 Obtener todas las publicaciones
app.get("/publicaciones", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM publicaciones");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ➕ Agregar una nueva publicación
app.post("/publicaciones", upload.single("imagen"), async (req, res) => {
  const { titulo, descripcion, categoria } = req.body;
  const imagen = req.file ? req.file.filename : null;

  if (!titulo || !descripcion || !categoria || !imagen) {
    return res.status(400).json({ error: "Todos los campos son obligatorios" });
  }

  try {
    const result = await pool.query(
      "INSERT INTO publicaciones (titulo, descripcion, categoria, imagen) VALUES ($1, $2, $3, $4) RETURNING id",
      [titulo, descripcion, categoria, imagen]
    );
    res.json({ message: "✅ Publicación subida correctamente", id: result.rows[0].id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ❌ Eliminar una publicación (y su imagen)
app.delete("/publicaciones/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // Obtener la imagen antes de eliminar
    const imgResult = await pool.query("SELECT imagen FROM publicaciones WHERE id = $1", [id]);
    if (imgResult.rows.length === 0) {
      return res.status(404).json({ error: "Publicación no encontrada" });
    }

    // Eliminar la imagen del servidor
    const imagePath = path.join(__dirname, "uploads", imgResult.rows[0].imagen);
    fs.unlink(imagePath, (err) => {
      if (err && err.code !== "ENOENT") {
        console.error("❌ Error al eliminar la imagen:", err);
      }
    });

    // Eliminar la publicación de la base de datos
    await pool.query("DELETE FROM publicaciones WHERE id = $1", [id]);

    res.json({ message: "✅ Publicación eliminada correctamente" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🚀 Iniciar el servidor
app.listen(PORT, () => console.log(`🚀 Servidor corriendo en el puerto ${PORT}`));
