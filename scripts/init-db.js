const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: 'postgres'
});

async function initDatabase() {
  try {
    await client.connect();
    console.log('Connected to PostgreSQL');
    
    // Create database if it doesn't exist
    await client.query(`SELECT 1 FROM pg_database WHERE datname = '${process.env.DB_NAME || 'podcast_db'}'`);
    const result = await client.query(`SELECT 1 FROM pg_database WHERE datname = '${process.env.DB_NAME || 'podcast_db'}'`);
    
    if (result.rows.length === 0) {
      await client.query(`CREATE DATABASE ${process.env.DB_NAME || 'podcast_db'}`);
      console.log(`Database ${process.env.DB_NAME || 'podcast_db'} created`);
    } else {
      console.log(`Database ${process.env.DB_NAME || 'podcast_db'} already exists`);
    }
    
    // Connect to the new database
    await client.end();
    
    const dbClient = new Client({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'podcast_db'
    });
    
    await dbClient.connect();
    console.log('Connected to podcast database');
    
    // Create tables
    await dbClient.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'listener',
        bio TEXT,
        avatar_url VARCHAR(500),
        social_links JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP,
        is_active BOOLEAN DEFAULT true,
        email_verified BOOLEAN DEFAULT false
      );
      
      CREATE TABLE IF NOT EXISTS podcasts (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(100),
        host VARCHAR(255) NOT NULL,
        cover_image VARCHAR(500),
        status VARCHAR(50) DEFAULT 'draft',
        is_featured BOOLEAN DEFAULT false,
        is_trending BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        user_id INTEGER REFERENCES users(id)
      );
      
      CREATE TABLE IF NOT EXISTS episodes (
        id SERIAL PRIMARY KEY,
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
        scheduled_at TIMESTAMP,
        published_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        seo_title VARCHAR(255),
        seo_description TEXT,
        seo_keywords TEXT
      );
      
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        icon VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS tags (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS podcast_tags (
        podcast_id INTEGER REFERENCES podcasts(id) ON DELETE CASCADE,
        tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
        PRIMARY KEY (podcast_id, tag_id)
      );
      
      CREATE TABLE IF NOT EXISTS subscribers (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        podcast_id INTEGER REFERENCES podcasts(id) ON DELETE CASCADE,
        subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, podcast_id)
      );
      
      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        episode_id INTEGER REFERENCES episodes(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        parent_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
        is_pinned BOOLEAN DEFAULT false,
        is_reported BOOLEAN DEFAULT false,
        likes INTEGER DEFAULT 0,
        dislikes INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS ratings (
        id SERIAL PRIMARY KEY,
        episode_id INTEGER REFERENCES episodes(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(episode_id, user_id)
      );
      
      CREATE TABLE IF NOT EXISTS views (
        id SERIAL PRIMARY KEY,
        episode_id INTEGER REFERENCES episodes(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        ip_address VARCHAR(45),
        viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        watch_time INTEGER DEFAULT 0
      );
      
      CREATE TABLE IF NOT EXISTS downloads (
        id SERIAL PRIMARY KEY,
        episode_id INTEGER REFERENCES episodes(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        ip_address VARCHAR(45),
        downloaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS media_files (
        id SERIAL PRIMARY KEY,
        episode_id INTEGER REFERENCES episodes(id) ON DELETE CASCADE,
        file_type VARCHAR(50),
        file_path VARCHAR(500) NOT NULL,
        file_size BIGINT,
        mime_type VARCHAR(100),
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        is_read BOOLEAN DEFAULT false,
        link VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS analytics (
        id SERIAL PRIMARY KEY,
        episode_id INTEGER REFERENCES episodes(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        views INTEGER DEFAULT 0,
        downloads INTEGER DEFAULT 0,
        listens INTEGER DEFAULT 0,
        watch_time INTEGER DEFAULT 0,
        UNIQUE(episode_id, date)
      );
      
      CREATE TABLE IF NOT EXISTS recording_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255),
        description TEXT,
        duration INTEGER,
        file_path VARCHAR(500),
        quality VARCHAR(50),
        status VARCHAR(50) DEFAULT 'draft',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS playlists (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        is_public BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS playlist_episodes (
        playlist_id INTEGER REFERENCES playlists(id) ON DELETE CASCADE,
        episode_id INTEGER REFERENCES episodes(id) ON DELETE CASCADE,
        position INTEGER DEFAULT 0,
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (playlist_id, episode_id)
      );
      
      CREATE TABLE IF NOT EXISTS bookmarks (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        episode_id INTEGER REFERENCES episodes(id) ON DELETE CASCADE,
        note TEXT,
        timestamp INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, episode_id)
      );
      
      CREATE TABLE IF NOT EXISTS settings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        key VARCHAR(100) NOT NULL,
        value TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, key)
      );
      
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        action VARCHAR(100) NOT NULL,
        details JSONB,
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_episodes_podcast ON episodes(podcast_id);
      CREATE INDEX IF NOT EXISTS idx_episodes_status ON episodes(status);
      CREATE INDEX IF NOT EXISTS idx_comments_episode ON comments(episode_id);
      CREATE INDEX IF NOT EXISTS idx_views_episode ON views(episode_id);
      CREATE INDEX IF NOT EXISTS idx_downloads_episode ON downloads(episode_id);
      CREATE INDEX IF NOT EXISTS idx_analytics_episode ON analytics(episode_id);
      CREATE INDEX IF NOT EXISTS idx_subscribers_user ON subscribers(user_id);
      CREATE INDEX IF NOT EXISTS idx_subscribers_podcast ON subscribers(podcast_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
      CREATE INDEX IF NOT EXISTS idx_playlist_episode ON playlist_episodes(episode_id);
    `);
    
    console.log('Tables created successfully');
    
    // Insert sample categories
    await dbClient.query(`
      INSERT INTO categories (name, description, icon) VALUES
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
      ON CONFLICT (name) DO NOTHING;
    `);
    
    console.log('Sample data inserted');
    await dbClient.end();
    console.log('Database initialization completed!');
    
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

initDatabase();
