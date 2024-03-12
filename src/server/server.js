import path from 'path';
import express from 'express';
import favicon from 'serve-favicon';

const port = 3000;
const app = express();

app.use(favicon(path.join(__dirname, '../../assets/favicon.ico')));

app.use(express.static(path.join(__dirname, '../../dist/client')));
app.use('/assets', express.static(path.join(__dirname, '../../assets')));

app.get('/', (req, res) => {
  res.send('index');
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('something broke');
});

app.listen(port, () => {
  console.log(`listening on port ${port}`);
})
