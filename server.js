const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
require("dotenv").config();
const pool = require("./database");
const { v2: cloudinary } = require("cloudinary");
const { CloudinaryStorage } = require("multer-storage-cloudinary");


const app = express();
const PORT = process.env.PORT || 3000;
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "https://challengerpremios.netlify.app");
  res.header("Access-Control-Allow-Methods", "GET, POST, DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  next();
});
// 🔧 Solución para Railway y "Invalid Host header"
app.set("trust proxy", true);
app.options("*", cors()); 
app.use(cors({
  origin: "https://challengerpremios.netlify.app", 
  methods: ["GET", "POST", "DELETE"],
  allowedHeaders: ["Content-Type"],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer Storage para Cloudinary
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "challenger_premios",
    allowed_formats: ["jpg", "png", "jpeg", "webp"],
    transformation: [{ width: 800, height: 800, crop: "limit" }],
  },
});
const upload = multer({ storage });

// Ruta de prueba
app.get("/", (req, res) => {
  res.json({ message: "✅ Servidor funcionando con Cloudinary y PostgreSQL" });
});

// Obtener publicaciones
app.get("/publicaciones", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM publicaciones");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Crear publicación con imagen
app.post("/publicaciones", upload.single("imagen"), async (req, res) => {
  const { titulo, descripcion, categoria } = req.body;
  const imagenUrl = req.file?.path;

  if (!titulo || !descripcion || !categoria || !imagenUrl) {
    return res.status(400).json({ error: "Todos los campos son obligatorios" });
  }

  try {
    const result = await pool.query(
      "INSERT INTO publicaciones (titulo, descripcion, categoria, imagen) VALUES ($1, $2, $3, $4) RETURNING id",
      [titulo, descripcion, categoria, imagenUrl]
    );
    res.json({ message: "✅ Publicación subida correctamente", id: result.rows[0].id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Eliminar publicación
app.delete("/publicaciones/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query("DELETE FROM publicaciones WHERE id = $1", [id]);
    res.json({ message: "✅ Publicación eliminada correctamente" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`🚀 Servidor corriendo en el puerto ${PORT}`));
