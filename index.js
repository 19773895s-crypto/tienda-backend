require('dotenv').config();

const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors()); // habilitar CORS

// ---------------------------------------------
// Conexión a MySQL (Aiven) con variables de entorno y SSL
// ---------------------------------------------
const conexion = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  ssl: { rejectUnauthorized: false }, // conexión cifrada que exige Aiven
  waitForConnections: true,
  connectionLimit: 10
});

// Prueba de conexión al arrancar (solo para ver el mensaje en consola)
conexion.getConnection((err, con) => {
  if (err) {
    console.error('Error de conexión: ', err.message);
    return;
  }
  console.log('Conectado a MySQL');
  con.release();
});

// ---------------------------------------------
// CRUD Vendedores
// ---------------------------------------------
app.get('/vendedores', (req, res) => {
  conexion.query('SELECT * FROM vendedores', (err, resultados) => {
    if (err) return res.status(500).send(err.message);
    res.json(resultados);
  });
});

app.post('/vendedores', (req, res) => {
  const { nombre, sucursal } = req.body;
  conexion.query(
    'INSERT INTO vendedores (nombre, sucursal) VALUES (?, ?)',
    [nombre, sucursal],
    err => {
      if (err) return res.status(500).send(err.message);
      res.send(`Vendedor agregado: ${nombre}`);
    }
  );
});

app.put('/vendedores/:id', (req, res) => {
  const id = req.params.id;
  const { nombre, sucursal } = req.body;
  conexion.query(
    'UPDATE vendedores SET nombre=?, sucursal=? WHERE id=?',
    [nombre, sucursal, id],
    err => {
      if (err) return res.status(500).send(err.message);
      res.send(`Vendedor con ID ${id} actualizado`);
    }
  );
});

app.delete('/vendedores/:id', (req, res) => {
  const id = req.params.id;
  conexion.query('DELETE FROM vendedores WHERE id=?', [id], err => {
    if (err) return res.status(500).send(err.message);
    res.send(`Vendedor con ID ${id} eliminado`);
  });
});

// ---------------------------------------------
// CRUD Productos
// ---------------------------------------------
app.get('/productos', (req, res) => {
  conexion.query('SELECT * FROM productos', (err, resultados) => {
    if (err) return res.status(500).send(err.message);
    res.json(resultados);
  });
});

app.post('/productos', (req, res) => {
  const { nombre, precio } = req.body;
  conexion.query(
    'INSERT INTO productos (nombre, precio) VALUES (?, ?)',
    [nombre, precio],
    err => {
      if (err) return res.status(500).send(err.message);
      res.send(`Producto agregado: ${nombre}`);
    }
  );
});

app.put('/productos/:id', (req, res) => {
  const id = req.params.id;
  const { nombre, precio } = req.body;
  conexion.query(
    'UPDATE productos SET nombre=?, precio=? WHERE id=?',
    [nombre, precio, id],
    err => {
      if (err) return res.status(500).send(err.message);
      res.send(`Producto con ID ${id} actualizado`);
    }
  );
});

app.delete('/productos/:id', (req, res) => {
  const id = req.params.id;
  conexion.query('DELETE FROM productos WHERE id=?', [id], err => {
    if (err) return res.status(500).send(err.message);
    res.send(`Producto con ID ${id} eliminado`);
  });
});

// ---------------------------------------------
// CRUD Ventas con JOIN
// ---------------------------------------------
app.get('/ventas', (req, res) => {
  const sql = `
    SELECT v.id, v.vendedor_id, v.producto_id,
           ve.nombre AS vendedor, p.nombre AS producto,
           v.cantidad, DATE_FORMAT(v.fecha, '%Y-%m-%d') AS fecha,
           p.precio, (v.cantidad * p.precio) AS total
    FROM ventas v
    INNER JOIN vendedores ve ON v.vendedor_id = ve.id
    INNER JOIN productos p ON v.producto_id = p.id
  `;
  conexion.query(sql, (err, resultados) => {
    if (err) return res.status(500).send(err.message);
    res.json(resultados);
  });
});

app.post('/ventas', (req, res) => {
  const { vendedor_id, producto_id, cantidad, fecha } = req.body;
  conexion.query(
    'INSERT INTO ventas (vendedor_id, producto_id, cantidad, fecha) VALUES (?, ?, ?, ?)',
    [vendedor_id, producto_id, cantidad, fecha],
    err => {
      if (err) return res.status(500).send(err.message);
      res.send({ message: 'Venta registrada correctamente' });
    }
  );
});

app.put('/ventas/:id', (req, res) => {
  const id = req.params.id;
  const { vendedor_id, producto_id, cantidad, fecha } = req.body;
  conexion.query(
    'UPDATE ventas SET vendedor_id=?, producto_id=?, cantidad=?, fecha=? WHERE id=?',
    [vendedor_id, producto_id, cantidad, fecha, id],
    err => {
      if (err) return res.status(500).send(err.message);
      res.send({ message: `Venta con ID ${id} actualizada` });
    }
  );
});

app.delete('/ventas/:id', (req, res) => {
  const id = req.params.id;
  conexion.query('DELETE FROM ventas WHERE id=?', [id], err => {
    if (err) return res.status(500).send(err.message);
    res.send({ message: `Venta con ID ${id} eliminada` });
  });
});

// ---------------------------------------------
// Iniciar servidor
// ---------------------------------------------
app.listen(PORT, () => {
  console.log(`Servidor Express corriendo en puerto ${PORT}`);
});