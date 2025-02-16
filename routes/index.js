var express = require('express');
var nodemailer = require('nodemailer');
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
  console.log(req.body);
  console.log(req.headers);
  console.log(await cloudFlare(req));
  res.status(200);
  res.json(
    {
      success: true
    }
  );

  // //
  // let text = `${req.params.name} ${req.params.email} ${req.params.phone} ${req.params.message}`; 
  // let mailOptions = {
  //   from: 'info@wallmurals.ai',
  //   to: 'thisisupperwestsidemurals@gmail.com',
  //   cc: 'beovideskevin@gmail.com',
  //   subject: req.params.subject,
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

