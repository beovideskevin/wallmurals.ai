var express = require('express');
var cloudFlare = require('../helpers/cloudflare');
var gmail = require('../helpers/gmail');

var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { 
    title: process.env.TITLE,
    keywords: process.env.KEYWORDS,
    description: process.env.DESCRIPTION,
    author: process.env.AUTHOR,
  });
});

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

  let text = `name: ${body.firstName} ${body.lastName} -- email: ${body.email} -- phone: ${body.phone} -- ${body.message}`; 

  console.log(text);

  res.status(200);
  res.json({success: true});


  // 
  // let mailOptions = {
  //   from: 'info@wallmurals.ai',
  //   to: 'thisisupperwestsidemurals@gmail.com',
  //   cc: 'beovideskevin@gmail.com',
  //   subject: "Contact Email From WallMurals.ai",
  //   text: text
  // };
  
  // gmail.sendMail(mailOptions, function(error, info){
  //   if (error) {
  //     console.log(error);
  //   } else {
  //     console.log('Email sent: ' + info.response);
  //   }
  // });
});

module.exports = router;

