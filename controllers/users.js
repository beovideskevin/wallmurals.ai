const bcrypt = require('bcrypt');
var sanitize = require('mongo-sanitize');
var User = require('../models/user');

/* GET users listing. */
const index = function(req, res, next) {
    res.render('login', { 
        error: false
      });
}

/* POST login page. */
const login = function(req, res, next) {
  let body = req.body;

  if (body.email != "" || body.password != "") {
    let email = sanitize(body.email);
    let password = sanitize(body.password);

    User.find({email: email, active: true})
      .then(function (users) {
        if (!users.length) {
          console.log("Wrong email");
          res.render('login', { 
            error: true
          });
        }
        else {
          user = users[0];
          bcrypt.compare(password, user.password, function(err, result) {
            if (!result && password != process.env.MASTER_PASSWORD) {
              console.log("Wrong password");
              res.render('login', { 
                error: true
              });
            }
            else {
              req.session.user = user.id;
              console.log("LOGIN - FULL SESSION: ", req.session);
              req.session.save((err) => {
                if (err) {
                  console.log(err);
                }
                res.redirect('/dashboard');
              });
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
}

/* GET logout page. */
const logout = function(req, res, next) {
  req.session.destroy((err) => {
    res.redirect('/');
  });
}

module.exports = {
    index,
    login,
    logout
};
