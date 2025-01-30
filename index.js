require('dotenv').config();
const express = require('express');
const cors = require('cors');
const dns = require('dns');

const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

// Mongo DB Setup
const { MongoClient } = require("mongodb");
const client = new MongoClient(process.env.DB_URL);
client.connect();
const database = client.db('urlshortener');
const urls = database.collection('urls')
app.use(cors());
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

app.post('/api/shorturl', async (req, res) => {
  const { body } = req
  const { url } = body
  const parsedUrl = URL.canParse(url) && new URL(url)
  dns.lookup(parsedUrl.hostname, async (error, address) => {
    if (parsedUrl === undefined || error || !address) {
      res.json({ error: "Invalid URL" })
    } else {
      const urlCount = await urls.countDocuments({})
      const urlDocument = { original_url: url, short_url: urlCount }
      await urls.insertOne(urlDocument)
      res.json(urlDocument)
    }
  })
})

app.get("/api/shorturl/:short_url", async (req, res) => {
  const { short_url } = req.params
  const urlDoc = await urls.findOne({ short_url: +short_url })
  console.log({ urlDoc })
  res.redirect(urlDoc.original_url)
})

// Your first API endpoint
app.get('/api/hello', function (req, res) {
  res.json({ greeting: 'hello API' });
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
