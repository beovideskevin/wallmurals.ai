var express = require('express');
var router = express.Router();
const {
  index,
  login,
  logout
} = require('../controllers/users');

/* POST login page. */
router.post('/login', login);

/* GET logout page. */
router.get('/logout', logout);

/* GET users listing. */
router.get('/:message?', index);

module.exports = router;
