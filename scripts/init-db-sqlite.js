const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcrypt");

const dbPath = path.join(__dirname, "..", "podcast.db");

// Delete existing database if it exists
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
}

const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  // Create tables
  db.run(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'listener',
      bio TEXT,
      avatar_url VARCHAR(500),
      social_links TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME,
      is_active BOOLEAN DEFAULT 1,
      email_verified BOOLEAN DEFAULT 0
    )
  `);

  db.run(`
    CREATE TABLE podcasts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      category VARCHAR(100),
      host VARCHAR(255) NOT NULL,
      cover_image VARCHAR(500),
      status VARCHAR(50) DEFAULT 'draft',
      is_featured BOOLEAN DEFAULT 0,
      is_trending BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      user_id INTEGER REFERENCES users(id)
    )
  `);

  db.run(`
    CREATE TABLE episodes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      podcast_id INTEGER REFERENCES podcasts(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      duration VARCHAR(50),
      audio_url VARCHAR(500),
      video_url VARCHAR(500),
      thumbnail VARCHAR(500),
      status VARCHAR(50) DEFAULT 'draft',
      visibility VARCHAR(50) DEFAULT 'public',
      views INTEGER DEFAULT 0,
      downloads INTEGER DEFAULT 0,
      scheduled_at DATETIME,
      published_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      seo_title VARCHAR(255),
      seo_description TEXT,
      seo_keywords TEXT
    )
  `);

  db.run(`
    CREATE TABLE categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(100) UNIQUE NOT NULL,
      description TEXT,
      icon VARCHAR(50),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(50) UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE podcast_tags (
      podcast_id INTEGER REFERENCES podcasts(id) ON DELETE CASCADE,
      tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
      PRIMARY KEY (podcast_id, tag_id)
    )
  `);

  db.run(`
    CREATE TABLE subscribers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      podcast_id INTEGER REFERENCES podcasts(id) ON DELETE CASCADE,
      subscribed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, podcast_id)
    )
  `);

  db.run(`
    CREATE TABLE comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      episode_id INTEGER REFERENCES episodes(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      parent_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
      is_pinned BOOLEAN DEFAULT 0,
      is_reported BOOLEAN DEFAULT 0,
      likes INTEGER DEFAULT 0,
      dislikes INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE ratings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      episode_id INTEGER REFERENCES episodes(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      rating INTEGER CHECK (rating >= 1 AND rating <= 5),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(episode_id, user_id)
    )
  `);

  db.run(`
    CREATE TABLE views (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      episode_id INTEGER REFERENCES episodes(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      ip_address VARCHAR(45),
      viewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      watch_time INTEGER DEFAULT 0
    )
  `);

  db.run(`
    CREATE TABLE downloads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      episode_id INTEGER REFERENCES episodes(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      ip_address VARCHAR(45),
      downloaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE media_files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      episode_id INTEGER REFERENCES episodes(id) ON DELETE CASCADE,
      file_type VARCHAR(50),
      file_path VARCHAR(500) NOT NULL,
      file_size BIGINT,
      mime_type VARCHAR(100),
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      type VARCHAR(50) NOT NULL,
      title VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      is_read BOOLEAN DEFAULT 0,
      link VARCHAR(500),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE analytics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      episode_id INTEGER REFERENCES episodes(id) ON DELETE CASCADE,
      date DATE NOT NULL,
      views INTEGER DEFAULT 0,
      downloads INTEGER DEFAULT 0,
      listens INTEGER DEFAULT 0,
      watch_time INTEGER DEFAULT 0,
      UNIQUE(episode_id, date)
    )
  `);

  db.run(`
    CREATE TABLE recording_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(255),
      description TEXT,
      duration INTEGER,
      file_path VARCHAR(500),
      quality VARCHAR(50),
      status VARCHAR(50) DEFAULT 'draft',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE playlists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      is_public BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE playlist_episodes (
      playlist_id INTEGER REFERENCES playlists(id) ON DELETE CASCADE,
      episode_id INTEGER REFERENCES episodes(id) ON DELETE CASCADE,
      position INTEGER DEFAULT 0,
      added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (playlist_id, episode_id)
    )
  `);

  db.run(`
    CREATE TABLE bookmarks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      episode_id INTEGER REFERENCES episodes(id) ON DELETE CASCADE,
      note TEXT,
      timestamp INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, episode_id)
    )
  `);

  db.run(`
    CREATE TABLE settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      key VARCHAR(100) NOT NULL,
      value TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, key)
    )
  `);

  db.run(`
    CREATE TABLE audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      action VARCHAR(100) NOT NULL,
      details TEXT,
      ip_address VARCHAR(45),
      user_agent TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Insert sample categories
  db.run(`
    INSERT OR IGNORE INTO categories (name, description, icon) VALUES
      ('Technology', 'Latest in tech and innovation', 'fa-microchip'),
      ('Education', 'Learn and grow with knowledge', 'fa-graduation-cap'),
      ('Business', 'Business strategies and insights', 'fa-chart-line'),
      ('Entertainment', 'Fun and engaging content', 'fa-film'),
      ('Health', 'Wellness and healthy living', 'fa-heartbeat'),
      ('Music', 'All about music and rhythm', 'fa-music'),
      ('Sports', 'Sports news and analysis', 'fa-futbol'),
      ('News', 'Current events and updates', 'fa-newspaper'),
      ('Comedy', 'Laugh and enjoy', 'fa-laugh'),
      ('Lifestyle', 'Everyday life and tips', 'fa-leaf')
  `);

  const hashedPassword = bcrypt.hashSync("Admin@12345", 10);
  db.run(
    `INSERT OR IGNORE INTO users (email, password, name, role, bio, avatar_url, social_links)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      "group1@podcast.com",
      hashedPassword,
      "Group1 Producer",
      "producer",
      "Experienced podcast producer for the Podcast Production System.",
      "https://loremflickr.com/320/320/avatar",
      JSON.stringify({
        twitter: "@group1podcast",
        linkedin: "group1-producer",
      }),
    ],
  );

  db.run(
    `INSERT INTO podcasts (title, description, category, host, cover_image, status, is_featured, is_trending, user_id)
     VALUES
       ('Tech Talk Daily', 'Daily news and deep dives into technology.', 'Technology', 'Munyampeta Fiston', 'https://loremflickr.com/320/240/technology', 'published', 1, 1, 1),
       ('Business Insights', 'Actionable business tips and interviews.', 'Business', 'Dukundane Belyse', 'https://loremflickr.com/320/240/business', 'published', 0, 1, 1),
       ('Health & Wellness', 'Stories and advice for a healthier life.', 'Health', 'Dushime Divine', 'https://loremflickr.com/320/240/health', 'published', 0, 0, 1)`,
  );

  // Sample listener accounts (used to seed demo subscribers/comments)
  const listenerPassword = bcrypt.hashSync("Listener@123", 10);
  db.run(
    `INSERT OR IGNORE INTO users (email, password, name, role) VALUES
       ('sarah@email.com', ?, 'Sarah Johnson', 'listener'),
       ('michael@email.com', ?, 'Michael Chen', 'listener'),
       ('emily@email.com', ?, 'Emily White', 'listener')`,
    [listenerPassword, listenerPassword, listenerPassword],
  );

  // Sample episodes for each seeded podcast
  db.run(
    `INSERT INTO episodes (podcast_id, title, description, duration, status, visibility, views, downloads) VALUES
       (1, 'AI Revolution', 'Exploring the latest breakthroughs in artificial intelligence.', '45:30', 'published', 'public', 5234, 1890),
       (1, 'The Future of Web Development', 'A look at what''s next for developers.', '38:12', 'published', 'public', 3120, 980),
       (1, 'Quantum Computing Explained', 'Breaking down a complex topic.', '41:05', 'draft', 'public', 0, 0),
       (2, 'Investment Strategies', 'Smart approaches to growing your portfolio.', '32:15', 'published', 'public', 4567, 1234),
       (2, 'Startup Lessons Learned', 'Founders share what they wish they knew.', '29:47', 'scheduled', 'public', 0, 0),
       (3, 'Mindfulness Meditation', 'A guided introduction to daily mindfulness.', '28:40', 'published', 'public', 2890, 760),
       (3, 'Nutrition Myths Debunked', 'Separating fact from fiction.', '35:22', 'draft', 'public', 0, 0)`,
  );

  // Sample subscribers linking listeners to podcasts
  db.run(
    `INSERT OR IGNORE INTO subscribers (user_id, podcast_id) VALUES
       (2, 1), (3, 1), (4, 1),
       (2, 2), (4, 2),
       (3, 3)`,
  );

  // Sample comments on episodes
  db.run(
    `INSERT INTO comments (episode_id, user_id, content, likes, is_pinned) VALUES
       (1, 2, 'Great episode! Very informative and well-produced.', 15, 1),
       (1, 3, 'Loved the discussion about AI. Looking forward to more episodes!', 8, 0),
       (4, 4, 'Solid advice, already applying it to my portfolio.', 6, 0),
       (6, 2, 'This helped me start a daily meditation habit, thank you!', 12, 0)`,
  );

  // Sample view events (used for the weekly listeners chart)
  db.run(
    `INSERT INTO views (episode_id, user_id, watch_time) VALUES
       (1, 2, 2700), (1, 3, 1800), (1, 4, 2400),
       (4, 2, 1900), (4, 4, 1500),
       (6, 3, 1700), (6, 2, 1600)`,
  );

  console.log("✅ SQLite database created successfully!");
  console.log("📁 Database file: podcast.db");
});

db.close();
