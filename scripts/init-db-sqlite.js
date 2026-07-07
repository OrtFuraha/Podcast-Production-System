const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '..', 'podcast.db');

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

  console.log('✅ SQLite database created successfully!');
  console.log('📁 Database file: podcast.db');
});

db.close();
