const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const shortid = require('shortid');

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());

const db = mysql.createConnection({
  host: 'localhost',
  user: 'username',
  password: 'password',
  database: 'urlshorter'
});

db.connect((err) => {
  if (err) throw err;
  console.log('MySQL connected...');
});

db.query(`
  CREATE TABLE IF NOT EXISTS urls (
    id INT AUTO_INCREMENT PRIMARY KEY,
    short_url VARCHAR(255) NOT NULL,
    long_url TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`, (err) => {
  if (err) throw err;
  console.log('Table created...');
});

function addUrl(longUrl, callback) {
  const shortUrl = shortid.generate();
  db.query('INSERT INTO urls (short_url, long_url) VALUES (?, ?)', [shortUrl, longUrl], (err, result) => {
    if (err) return callback(err);
    callback(null, shortUrl);
  });
}

app.post('/shorten', (req, res) => {
  const { longUrl } = req.body;

  addUrl(longUrl, (err, shortUrl) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json({ shortUrl });
  });
});

app.get('/:shortUrl', (req, res) => {
  const { shortUrl } = req.params;

  db.query('SELECT long_url FROM urls WHERE short_url = ?', [shortUrl], (err, results) => {
    if (err) throw err;
    if (results.length > 0) {
      res.redirect(results[0].long_url);
    } else {
      res.status(404).send('URL not found');
    }
  });
});
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
