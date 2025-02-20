var express = require('express');
var router = express.Router();
const {
  index,
  login,
  logout
} = require('../controllers/users');

/* GET users listing. */
router.get('/', index);

/* POST login page. */
router.post('/login', login);

/* GET logout page. */
router.get('/logout', logout);

module.exports = router;
