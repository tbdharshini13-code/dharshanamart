const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mysql = require("mysql2/promise");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;
const pool = mysql.createPool({ host: process.env.DB_HOST, port: Number(process.env.DB_PORT || 3306), user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME, waitForConnections: true, connectionLimit: 10 });
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json());

function tokenFor(user) { return jwt.sign({ id: user.id, role: user.role, email: user.email }, process.env.JWT_SECRET, { expiresIn: "7d" }); }
function auth(...roles) {
  return (req, res, next) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ message: "Authentication required." });
    try { req.user = jwt.verify(token, process.env.JWT_SECRET); if (roles.length && !roles.includes(req.user.role)) return res.status(403).json({ message: "You do not have permission for this action." }); next(); }
    catch { res.status(401).json({ message: "Invalid or expired token." }); }
  };
}
const asyncRoute = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);

app.get("/api/health", (req, res) => res.json({ status: "ok" }));
app.post("/api/auth/register", asyncRoute(async (req, res) => {
  const { name, email, password, role = "buyer" } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: "Name, email, and password are required." });
  if (password.length < 6) return res.status(400).json({ message: "Password must contain at least 6 characters." });
  if (!["buyer", "seller"].includes(role)) return res.status(400).json({ message: "Choose buyer or seller as your role." });
  const cleanEmail = email.toLowerCase().trim();
  const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [cleanEmail]);
  if (existing.length) return res.status(409).json({ message: "Email already registered." });
  const passwordHash = await bcrypt.hash(password, 12);
  const [result] = await pool.query("INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)", [name.trim(), cleanEmail, passwordHash, role]);
  const user = { id: result.insertId, name: name.trim(), email: cleanEmail, role };
  res.status(201).json({ token: tokenFor(user), user });
}));
app.post("/api/auth/login", asyncRoute(async (req, res) => {
  const [rows] = await pool.query("SELECT id, name, email, password_hash, role FROM users WHERE email = ?", [req.body.email?.toLowerCase().trim()]);
  const user = rows[0];
  if (!user || !(await bcrypt.compare(req.body.password || "", user.password_hash))) return res.status(401).json({ message: "Invalid email or password." });
  delete user.password_hash; res.json({ token: tokenFor(user), user });
}));

app.get("/api/dresses", asyncRoute(async (req, res) => { const search = `%${req.query.search || ""}%`; const [rows] = await pool.query("SELECT d.*, u.name AS seller_name FROM dresses d JOIN users u ON u.id = d.seller_id WHERE d.name LIKE ? OR d.category LIKE ? ORDER BY d.created_at DESC", [search, search]); res.json(rows); }));
app.get("/api/dresses/:id", asyncRoute(async (req, res) => { const [rows] = await pool.query("SELECT d.*, u.name AS seller_name FROM dresses d JOIN users u ON u.id = d.seller_id WHERE d.id = ?", [req.params.id]); if (!rows[0]) return res.status(404).json({ message: "Dress not found." }); res.json(rows[0]); }));
app.post("/api/dresses", auth("seller"), asyncRoute(async (req, res) => { const { name, description, price, category, image_url, stock } = req.body; if (!name || !description || Number(price) <= 0 || !category || Number(stock) < 0) return res.status(400).json({ message: "Complete every dress field with valid values." }); const [result] = await pool.query("INSERT INTO dresses (seller_id, name, description, price, category, image_url, stock) VALUES (?, ?, ?, ?, ?, ?, ?)", [req.user.id, name, description, price, category, image_url || "", stock]); res.status(201).json({ id: result.insertId, message: "Dress added successfully." }); }));
app.put("/api/dresses/:id", auth("seller"), asyncRoute(async (req, res) => { const fields = [req.body.name, req.body.description, req.body.price, req.body.category, req.body.image_url || "", req.body.stock, req.params.id, req.user.id]; const [result] = await pool.query("UPDATE dresses SET name=?, description=?, price=?, category=?, image_url=?, stock=? WHERE id=? AND seller_id=?", fields); if (!result.affectedRows) return res.status(404).json({ message: "Dress not found or it does not belong to you." }); res.json({ message: "Dress updated successfully." }); }));
app.delete("/api/dresses/:id", auth("seller", "admin"), asyncRoute(async (req, res) => { const condition = req.user.role === "admin" ? "id=?" : "id=? AND seller_id=?"; const values = req.user.role === "admin" ? [req.params.id] : [req.params.id, req.user.id]; const [result] = await pool.query(`DELETE FROM dresses WHERE ${condition}`, values); if (!result.affectedRows) return res.status(404).json({ message: "Dress not found or it does not belong to you." }); res.json({ message: "Dress deleted." }); }));

app.get("/api/cart", auth("buyer"), asyncRoute(async (req, res) => { const [rows] = await pool.query("SELECT c.dress_id, c.quantity, d.name, d.price, d.image_url, d.stock FROM cart_items c JOIN dresses d ON d.id=c.dress_id WHERE c.user_id=?", [req.user.id]); res.json(rows); }));
app.post("/api/cart", auth("buyer"), asyncRoute(async (req, res) => {
  const dressId = Number(req.body.dress_id);
  const quantity = Math.max(1, Number(req.body.quantity || 1));
  if (!Number.isInteger(dressId) || !Number.isInteger(quantity)) return res.status(400).json({ message: "Choose a valid dress and quantity." });
  const [dresses] = await pool.query("SELECT stock FROM dresses WHERE id=?", [dressId]);
  if (!dresses[0]) return res.status(404).json({ message: "Dress not found." });
  const [cartItems] = await pool.query("SELECT quantity FROM cart_items WHERE user_id=? AND dress_id=?", [req.user.id, dressId]);
  const nextQuantity = (cartItems[0]?.quantity || 0) + quantity;
  if (nextQuantity > dresses[0].stock) return res.status(400).json({ message: "Not enough stock available." });
  await pool.query("INSERT INTO cart_items (user_id, dress_id, quantity) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE quantity=quantity+VALUES(quantity)", [req.user.id, dressId, quantity]);
  res.status(201).json({ message: "Added to cart." });
}));
app.put("/api/cart/:dressId", auth("buyer"), asyncRoute(async (req, res) => {
  const dressId = Number(req.params.dressId);
  const quantity = Number(req.body.quantity);
  if (!Number.isInteger(dressId) || !Number.isInteger(quantity) || quantity < 1) return res.status(400).json({ message: "Quantity must be a positive whole number." });
  const [dresses] = await pool.query("SELECT stock FROM dresses WHERE id=?", [dressId]);
  if (!dresses[0]) return res.status(404).json({ message: "Dress not found." });
  if (quantity > dresses[0].stock) return res.status(400).json({ message: "Not enough stock available." });
  const [result] = await pool.query("UPDATE cart_items SET quantity=? WHERE user_id=? AND dress_id=?", [quantity, req.user.id, dressId]);
  if (!result.affectedRows) return res.status(404).json({ message: "That dress is not in your cart." });
  res.json({ message: "Cart updated." });
}));
app.delete("/api/cart/:dressId", auth("buyer"), asyncRoute(async (req, res) => { await pool.query("DELETE FROM cart_items WHERE user_id=? AND dress_id=?", [req.user.id, req.params.dressId]); res.json({ message: "Removed from cart." }); }));
app.get("/api/wishlist", auth("buyer"), asyncRoute(async (req, res) => { const [rows] = await pool.query("SELECT d.* FROM wishlist_items w JOIN dresses d ON d.id=w.dress_id WHERE w.user_id=?", [req.user.id]); res.json(rows); }));
app.post("/api/wishlist/:dressId", auth("buyer"), asyncRoute(async (req, res) => { await pool.query("INSERT IGNORE INTO wishlist_items (user_id, dress_id) VALUES (?, ?)", [req.user.id, req.params.dressId]); res.json({ message: "Added to wishlist." }); }));
app.delete("/api/wishlist/:dressId", auth("buyer"), asyncRoute(async (req, res) => { await pool.query("DELETE FROM wishlist_items WHERE user_id=? AND dress_id=?", [req.user.id, req.params.dressId]); res.json({ message: "Removed from wishlist." }); }));

app.post("/api/orders", auth("buyer"), asyncRoute(async (req, res) => {
  const connection = await pool.getConnection();
  try { await connection.beginTransaction(); const [items] = await connection.query("SELECT c.dress_id, c.quantity, d.price, d.stock FROM cart_items c JOIN dresses d ON d.id=c.dress_id WHERE c.user_id=? FOR UPDATE", [req.user.id]); if (!items.length) { await connection.rollback(); return res.status(400).json({ message: "Your cart is empty." }); } if (items.some((item) => item.quantity > item.stock)) { await connection.rollback(); return res.status(400).json({ message: "One or more dresses do not have enough stock." }); } const total = items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0); const [order] = await connection.query("INSERT INTO orders (buyer_id, total_amount, status) VALUES (?, ?, 'pending')", [req.user.id, total]); for (const item of items) { await connection.query("INSERT INTO order_items (order_id, dress_id, quantity, price) VALUES (?, ?, ?, ?)", [order.insertId, item.dress_id, item.quantity, item.price]); await connection.query("UPDATE dresses SET stock=stock-? WHERE id=?", [item.quantity, item.dress_id]); } await connection.query("DELETE FROM cart_items WHERE user_id=?", [req.user.id]); await connection.commit(); res.status(201).json({ message: "Order placed successfully.", orderId: order.insertId }); }
  catch (error) { await connection.rollback(); throw error; } finally { connection.release(); }
}));
app.get("/api/orders", auth("buyer", "seller", "admin"), asyncRoute(async (req, res) => { let query = "SELECT o.*, u.name AS buyer_name FROM orders o JOIN users u ON u.id=o.buyer_id"; const values = []; if (req.user.role === "buyer") { query += " WHERE o.buyer_id=?"; values.push(req.user.id); } if (req.user.role === "seller") { query += " JOIN order_items oi ON oi.order_id=o.id JOIN dresses d ON d.id=oi.dress_id WHERE d.seller_id=?"; values.push(req.user.id); } query += " GROUP BY o.id ORDER BY o.created_at DESC"; const [rows] = await pool.query(query, values); res.json(rows); }));
app.put("/api/orders/:id/status", auth("seller", "admin"), asyncRoute(async (req, res) => {
  const allowed = ["pending", "confirmed", "shipped", "delivered"];
  if (!allowed.includes(req.body.status)) return res.status(400).json({ message: "Choose a valid order status." });
  const values = [req.body.status, req.params.id];
  let query = "UPDATE orders SET status=? WHERE id=?";
  if (req.user.role === "seller") { query += " AND EXISTS (SELECT 1 FROM order_items oi JOIN dresses d ON d.id=oi.dress_id WHERE oi.order_id=orders.id AND d.seller_id=?)"; values.push(req.user.id); }
  const [result] = await pool.query(query, values);
  if (!result.affectedRows) return res.status(404).json({ message: "Order not found or unavailable." });
  res.json({ message: "Order status updated." });
}));
app.get("/api/admin/overview", auth("admin"), asyncRoute(async (req, res) => { const [users] = await pool.query("SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC"); const [dresses] = await pool.query("SELECT d.*, u.name AS seller_name FROM dresses d JOIN users u ON u.id=d.seller_id ORDER BY d.created_at DESC"); const [orders] = await pool.query("SELECT o.*, u.name AS buyer_name FROM orders o JOIN users u ON u.id=o.buyer_id ORDER BY o.created_at DESC"); res.json({ users, dresses, orders }); }));
app.use((error, req, res, next) => { console.error(error.message); res.status(500).json({ message: "Something went wrong on the server." }); });
app.listen(port, () => console.log(`DharshanaMart API running at http://localhost:${port}`));