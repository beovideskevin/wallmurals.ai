const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const dotenv = require('dotenv').config();
var fs = require('fs');
var db = JSON.parse(fs.readFileSync('db.json', 'utf8'));

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
// const arRouter = require('./routes/ar');
var router = express.Router();
const arRouter = router.get('/:id', function(req, res, next) {
  let id = req.params.id;
  res.render('ar', { 
    title: process.env.title,
    keywords: process.env.keywords,
    description: process.env.description,
    author: process.env.author,
    artwork: db['artworks'][id]
  });
});

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static('public'));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/ar', arRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
