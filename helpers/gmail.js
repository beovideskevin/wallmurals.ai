var nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'kevinbcasas@gmail.com',
    pass: process.env.GMAIL_PASS
  }
});

module.exports = transporter;
