require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const fs = require('fs');
const bodyParser = require('body-parser');

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

//
app.use(bodyParser.urlencoded({ extended: false }))

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

// 
app.use('/api/shorturl/:short_url?', (req, res, next) => {
  const shortUrlFilepath = __dirname + '/storage/shorturl.json';
  req.shortUrlFilepath = shortUrlFilepath;
  try {
    // { throwIfNoEntry: false } not working due to replit.com node version.
    const fileStat = fs.statSync(shortUrlFilepath)
    req.shortUrlData = JSON.parse(fs.readFileSync(shortUrlFilepath));
  } catch (error) {
    // console.log(`error from fs.statSync`, error); // DEBUG
    if (error.code === 'ENOENT') {
      req.shortUrlData = [];
      fs.writeFileSync(shortUrlFilepath, '[]');
    }
  }
  next();
});

// Helper for validating URL
const isValidHttpUrl = urlString => {
  let url;
  
  try {
    url = new URL(urlString);
  } catch (error) {
    return false;  
  }

  return url.protocol === 'http:' || url.protocol === 'https:';
}

//
app.post('/api/shorturl', (req, res) => {
  //  console.log(`req`, req); // DEBUG
  //  console.log(`req.body`, req.body); // DEBUG
  if (req.body.url) {
    if (isValidHttpUrl(req.body.url)) {
      const shortUrlData = [...req.shortUrlData];
      if (!shortUrlData.includes(req.body.url)) {
        shortUrlData.push(req.body.url);
      }
      fs.writeFileSync(req.shortUrlFilepath, JSON.stringify(shortUrlData));
      res.json({
        original_url: req.body.url,
        short_url: shortUrlData.indexOf(req.body.url)
      })
    } else {
      res.json({
        error: 'invalid url'
      })
    }
  }
})
   
app.get('/api/shorturl/:short_url', (req, res) => {
  // console.log(`req`, req); // DEBUG
  if (req.shortUrlData[req.param('short_url')]) {
    res.redirect(req.shortUrlData[req.param('short_url')]);
  } else {
    res.redirect('/');
  }
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
