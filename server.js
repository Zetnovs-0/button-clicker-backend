const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

// Connects to Neon PostgreSQL using Render Environment Variable
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Record a click from the website
app.post('/api/click', async (req, res) => {
  const { button } = req.body; // 'left' or 'right'
  if (button !== 'left' && button !== 'right') {
    return res.status(400).json({ error: 'Invalid button side' });
  }

  try {
    await pool.query('INSERT INTO button_clicks (click_type) VALUES ($1)', [button]);
    res.json({ success: true });
  } catch (err) {
    console.error('Database Error:', err);
    res.status(500).json({ error: 'Failed to record click' });
  }
});

// Get total counts for both buttons
app.get('/api/stats', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE click_type = 'left') AS left,
        COUNT(*) FILTER (WHERE click_type = 'right') AS right
      FROM button_clicks;
    `);

    res.json({
      left: parseInt(result.rows[0].left || 0),
      right: parseInt(result.rows[0].right || 0)
    });
  } catch (err) {
    console.error('Database Error:', err);
    res.status(500).json({ error: 'Failed to load stats' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
