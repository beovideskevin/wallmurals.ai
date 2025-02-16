var express = require('express');
var cloudFlare = require('../helpers/cloudflare');
var gmail = require('../helpers/gmail');

var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { 
    site: process.env.SITE,
    title: process.env.TITLE,
    keywords: process.env.KEYWORDS,
    description: process.env.DESCRIPTION,
    author: process.env.AUTHOR,
  });
});

/* POST contact form */
router.post('/contact', async function(req, res, next) {
  turnstile = await cloudFlare(req)
  if (!turnstile) {
    res.status(200);
    res.json({success: false});
    return;
  }

  let body = req.body;
  if (body.firstName == "" || 
      body.lastName == "" || 
      body.email == "" || 
      body.phone == "" || 
      body.message == "" ||
      body.nothing != "" ||
      body['cf-turnstile-response'] == "") 
  {
      res.status(200);
      res.json({success: false});
      return;
  }

  let text = `name: ${body.firstName} ${body.lastName} -- email: ${body.email} -- phone: ${body.phone}\n\n\n${body.message}`; 
  let mailOptions = {
    from: 'info@wallmurals.ai',
    to: 'thisisupperwestsidemurals@gmail.com',
    cc: 'kevinbcasas@gmail.com',
    subject: "Contact Email From WallMurals.ai",
    text: text
  };
  
  gmail.sendMail(mailOptions, function(error, info){
    if (error) {
      console.log(error);
      res.status(200);
      res.json({success: false});
      return;
    } 
    else {
      console.log('CONTACT EMAIL SENT: ' + info.response + ' TEXT: ' + text);
    }
  });  
  
  res.status(200);
  res.json({success: true});
});

module.exports = router;

