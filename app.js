const dotenv = require('dotenv').config();
const createError = require('http-errors');
const express = require('express');
const session = require('express-session');
const path = require('path');
const cookieParser = require('cookie-parser');
const minifyHTML = require('express-minify-html-2');
const compression = require('compression');
const logger = require('morgan');
const colors = require('colors');
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const arRouter = require('./routes/ar');
const dashboardRouter = require('./routes/dashboard');
const metricsRouter = require('./routes/metrics');
const connectDB = require('./db');

connectDB();

const app = express();

// @TODO I NEED TO SECURE THE SESSION WITH HTTPS
// var sess = {
//   secret: process.env.SESSION_KEY,
//   resave: false,
//   saveUninitialized: true,
//   cookie: {
//     maxAge: 60000
//   }
// }
// if (process.env.NODE_ENV != 'development') {
//   app.set('trust proxy', 1) // trust first proxy
//   sess.cookie.secure = true // serve secure cookies
// }
// app.use(session(sess))

app.use(session({
  secret: process.env.SESSION_KEY,
  resave: false,
  saveUninitialized: true,
  cookie: { 
    maxAge: 60000, 
    secure: false // process.env.NODE_ENV === 'development' ? false : true
  } 
}));

app.locals.site = process.env.SITE;
app.locals.title = process.env.TITLE;
app.locals.keywords = process.env.KEYWORDS;
app.locals.description = process.env.DESCRIPTION;
app.locals.author = process.env.AUTHOR;

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// more middleware
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(minifyHTML({
  override: true,
  exception_url: false,
  htmlMinifier: {
      removeComments: true,
      collapseWhitespace: true,
      collapseBooleanAttributes: true,
      removeAttributeQuotes: true,
      removeEmptyAttributes: true,
      minifyJS: true,
      minifyCSS: true,
  }
}));
app.use(compression());
app.use(express.static('public'));

// routes
app.use('/ar', arRouter);
app.use('/users', usersRouter);
app.use('/dashboard', dashboardRouter);
app.use('/metrics', metricsRouter);
app.use('/', indexRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  if (req.app.get('env') === 'development') {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = err;

    // render the error page
    res.status(err.status || 500);
    res.render('error');
  }
  else {
    res.redirect('/');
  }
});

module.exports = app;
