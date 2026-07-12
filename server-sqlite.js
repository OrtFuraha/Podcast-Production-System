const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const session = require("express-session");
const path = require("path");
const fs = require("fs");
const sqlite3 = require("sqlite3").verbose();
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3333;

// If the app runs behind a reverse proxy in production, trust it for secure cookies.
app.set("trust proxy", 1);

// Database setup
const dbPath = path.join(__dirname, process.env.DB_PATH || "podcast.db");
const db = new sqlite3.Database(dbPath);

// Make db available to routes
app.locals.db = db;

// Seed default users if the database is empty.
db.serialize(() => {
  db.get("SELECT COUNT(*) AS count FROM users", (err, row) => {
    if (err || !row || row.count > 0) return;

    const adminPassword = bcrypt.hashSync("Admin@12345", 10);
    const listenerPassword = bcrypt.hashSync("Listener@123", 10);

    db.run(
      "INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)",
      ["group1@podcast.com", adminPassword, "Group1 Producer", "producer"],
    );
    db.run(
      "INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)",
      ["sarah@email.com", listenerPassword, "Sarah Johnson", "listener"],
    );
    db.run(
      "INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)",
      ["michael@email.com", listenerPassword, "Michael Chen", "listener"],
    );
    db.run(
      "INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)",
      ["emily@email.com", listenerPassword, "Emily White", "listener"],
    );
  });
});

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: false,
  }),
);

// CORS
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3333",
    credentials: true,
  }),
);

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 900000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
});
app.use("/api/", limiter);

// Body parser
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Session
app.use(
  session({
    secret: process.env.SESSION_SECRET || "secret",
    resave: false,
    saveUninitialized: false,
    proxy: process.env.NODE_ENV === "production",
    cookie: {
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    },
  }),
);

// Static files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.static(path.join(__dirname, "public")));

// Import routes
const authRoutes = require("./routes/auth-sqlite");
const podcastRoutes = require("./routes/podcasts-sqlite");
const episodeRoutes = require("./routes/episodes-sqlite");
const userRoutes = require("./routes/users");
const categoriesRoutes = require("./routes/categories-sqlite");
const analyticsRoutes = require("./routes/analytics");
const recordingRoutes = require("./routes/recording");
const streamingRoutes = require("./routes/streaming");
const commentRoutes = require("./routes/comments");
const subscriptionRoutes = require("./routes/subscriptions");
const uploadRoutes = require("./routes/uploads");

// Use routes
app.use("/api/auth", authRoutes);
app.use("/api/podcasts", podcastRoutes);
app.use("/api/episodes", episodeRoutes);
app.use("/api/users", userRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/recording", recordingRoutes);
app.use("/api/streaming", streamingRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/uploads", uploadRoutes);

// Auth guard for pages that require a logged-in user
function requireAuth(req, res, next) {
  if (req.session && req.session.userId) {
    return next();
  }
  return res.redirect("/login");
}

// Main route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

app.get("/studio", requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "studio.html"));
});

app.get("/podcasts", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "podcasts.html"));
});

app.get("/categories", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "categories.html"));
});

app.get("/about", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "about.html"));
});

app.get("/contact", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "contact.html"));
});

app.get("/privacy", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "privacy.html"));
});

app.get("/terms", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "terms.html"));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Create uploads directory
const uploadDirs = [
  "uploads/audio",
  "uploads/video",
  "uploads/images",
  "uploads/thumbnails",
];
uploadDirs.forEach((dir) => {
  const fullPath = path.join(__dirname, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════════╗
  ║   Podcast Production System               ║
  ║   Server running on port: ${PORT}         ║
  ║   Visit: http://localhost:${PORT}         ║
  ║   Database: SQLite (${dbPath})            ║
  ╚═══════════════════════════════════════════╝
  `);
});

// Socket.io setup
const io = require("socket.io")(server);
io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  socket.on("recording:start", (data) => {
    io.emit("recording:status", { status: "recording", ...data });
  });

  socket.on("recording:stop", (data) => {
    io.emit("recording:status", { status: "stopped", ...data });
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

module.exports = { app, server, io, db };
