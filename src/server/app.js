import path from 'path';
import express from 'express';
import favicon from 'serve-favicon';

const port = 3000;
const app = express();

app.use(favicon(path.join(__dirname, '../../assets/favicon.ico')));

app.use(express.static(path.join(__dirname, '../../dist/client')));

app.get('/', (req, res) => {
  res.send('index');
});

app.get('/game', (req, res) => {
  res.redirect('/');
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('something broke');
});

app.listen(port, () => {
  console.log(`listening on port ${port}`);
});
