const express = require("express");
const router = express.Router();

const getDb = (req) => req.app.locals.db;

function get(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function all(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

router.get("/dashboard", async (req, res) => {
  try {
    const db = getDb(req);
    const [
      totalPodcasts,
      episodeStats,
      subscribers,
      totals,
      comments,
    ] = await Promise.all([
      get(db, "SELECT COUNT(*) AS count FROM podcasts"),
      get(
        db,
        `SELECT
           COUNT(*) AS total,
           SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) AS published,
           SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) AS draft,
           SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END) AS scheduled
         FROM episodes`,
      ),
      get(db, "SELECT COUNT(*) AS count FROM subscribers"),
      get(
        db,
        "SELECT COALESCE(SUM(views),0) AS views, COALESCE(SUM(downloads),0) AS downloads FROM episodes",
      ),
      get(db, "SELECT COUNT(*) AS count FROM comments"),
    ]);

    res.json({
      success: true,
      data: {
        totalPodcasts: totalPodcasts.count,
        totalEpisodes: episodeStats.total || 0,
        publishedEpisodes: episodeStats.published || 0,
        draftEpisodes: episodeStats.draft || 0,
        scheduledEpisodes: episodeStats.scheduled || 0,
        subscribers: subscribers.count,
        downloads: totals.downloads,
        views: totals.views,
        comments: comments.count,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/charts", async (req, res) => {
  try {
    const db = getDb(req);

    const monthly = await all(
      db,
      `SELECT strftime('%Y-%m', created_at) AS month, COUNT(*) AS count
       FROM episodes
       GROUP BY month
       ORDER BY month DESC
       LIMIT 6`,
    );

    const downloadsByMonth = await all(
      db,
      `SELECT strftime('%Y-%m', created_at) AS month, COALESCE(SUM(downloads),0) AS total
       FROM episodes
       GROUP BY month
       ORDER BY month DESC
       LIMIT 6`,
    );

    const publishedByMonth = await all(
      db,
      `SELECT strftime('%Y-%m', created_at) AS month, COUNT(*) AS count
       FROM episodes
       WHERE status = 'published'
       GROUP BY month
       ORDER BY month DESC
       LIMIT 6`,
    );

    const viewsByDay = await all(
      db,
      `SELECT strftime('%w', viewed_at) AS dow, COUNT(*) AS count
       FROM views
       GROUP BY dow`,
    );

    res.json({
      success: true,
      data: {
        monthlyUploads: monthly.reverse().map((r) => ({ month: r.month, count: r.count })),
        downloadsAnalytics: downloadsByMonth
          .reverse()
          .map((r) => ({ month: r.month, total: r.total })),
        publishingStats: publishedByMonth
          .reverse()
          .map((r) => ({ month: r.month, count: r.count })),
        weeklyListeners: viewsByDay,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/top-episodes", async (req, res) => {
  try {
    const db = getDb(req);
    const rows = await all(
      db,
      `SELECT e.id, e.title, e.views, e.downloads, p.title AS podcast_title,
              (SELECT AVG(rating) FROM ratings r WHERE r.episode_id = e.id) AS avg_rating
       FROM episodes e
       JOIN podcasts p ON p.id = e.podcast_id
       ORDER BY e.views DESC
       LIMIT 10`,
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
