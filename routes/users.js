var express = require('express');
const bcrypt = require('bcrypt');
var sanitize = require('mongo-sanitize');
var User = require('../models/user');

var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

/* GET login page. */
router.get('/login', function(req, res, next) {
  res.render('login', { 
    error: false
  });
});

/* POST login page. */
router.post('/login', function(req, res, next) {
  let body = req.body;

  if (body.email != "" || body.password != "") {
    let email = sanitize(body.email);
    let password = sanitize(body.password);

    User.find({email: email})
      .then(function (user) {
        if (!user.length) {
          console.log("Wrong email");
          res.render('login', { 
            error: true
          });
        }
        else {
          user = user[0];
          bcrypt.compare(password, user.password, function(err, result) {
            if (!result) {
              console.log("Wrong password");
              res.render('login', { 
                error: true
              });
            }
            else {
              req.session.user = { id: user.id, email: user.email };
              console.log(req.session.user);
              res.render('dashboard', {});
            }
          });
        }
      });
  }
  else {
    res.render('login', { 
      error: true
    });
  }
});

/* GET logout page. */
router.get('/logout', function(req, res, next) {
  req.session.destroy((err) => {
    res.redirect('/');
  });
});

module.exports = router;
