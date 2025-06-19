const express = require('express');
const path = require('path');
const ejsMate = require('ejs-mate');
const db = require('./db');

const app = express();
app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', async (req, res) => {
  const posts = await db.all('SELECT * FROM posts ORDER BY created_at DESC');
  res.render('index', { posts, title: 'Home' });
});

app.get('/posts/new', (req, res) => {
  res.render('newPost', { title: 'New Post' });
});

app.post('/posts', async (req, res) => {
  const { title, content } = req.body;
  await db.run('INSERT INTO posts(title, content, likes, created_at) VALUES(?, ?, 0, datetime(\'now\'))', [title, content]);
  res.redirect('/');
});

app.get('/posts/:id', async (req, res) => {
  const post = await db.get('SELECT * FROM posts WHERE id = ?', [req.params.id]);
  const comments = await db.all('SELECT * FROM comments WHERE post_id = ? ORDER BY created_at ASC', [req.params.id]);
  res.render('post', { post, comments, title: post.title });
});

app.post('/posts/:id/comments', async (req, res) => {
  const { name, content } = req.body;
  await db.run('INSERT INTO comments(post_id, name, content, created_at) VALUES(?, ?, ?, datetime(\'now\'))', [req.params.id, name, content]);
  res.redirect(`/posts/${req.params.id}`);
});

app.post('/posts/:id/like', async (req, res) => {
  await db.run('UPDATE posts SET likes = likes + 1 WHERE id = ?', [req.params.id]);
  const post = await db.get('SELECT likes FROM posts WHERE id = ?', [req.params.id]);
  res.json({ likes: post.likes });
});

app.post('/subscribe', async (req, res) => {
  const { email } = req.body;
  await db.run('INSERT INTO newsletters(email, created_at) VALUES(?, datetime(\'now\'))', [email]);
  res.redirect('/');
});

(async () => {
  await db.init();
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`Server running on port ${port}`));
})();
