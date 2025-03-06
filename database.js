const { Pool } = require("pg");
require("dotenv").config(); // Para cargar la URL de la DB desde .env

// Conexión a la base de datos PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // Usa la URL de PostgreSQL desde el archivo .env
  ssl: { rejectUnauthorized: false }, // Requerido para conexiones seguras en Render
});

// Crear la tabla si no existe
pool.query(
  `CREATE TABLE IF NOT EXISTS publicaciones (
    id SERIAL PRIMARY KEY,
    titulo TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    imagen TEXT NOT NULL,
    categoria TEXT NOT NULL
  );`,
  (err) => {
    if (err) {
      console.error("❌ Error al crear la tabla en PostgreSQL:", err.message);
    } else {
      console.log("✅ Tabla 'publicaciones' verificada en PostgreSQL.");
    }
  }
);

module.exports = pool;
