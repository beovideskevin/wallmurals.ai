var nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'beovideskevin',
    pass: process.env.GMAIL_PASS
  }
});

module.exports = transporter;
