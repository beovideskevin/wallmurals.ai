var express = require('express');
var router = express.Router();
const {
  index,
  home,
  contact,
  route,
} = require('../controllers/index')

/* GET mural by location */
router.get('/', index);

/* GET home page */
router.get('/home', home);

/* POST contact form */
router.post('/contact', contact);

module.exports = router;
