var express = require('express');
var router = express.Router();
const {
  index,
  contact,
  route,
} = require('../controllers/index')

/* GET home page. */
router.get('/', index);

/* POST contact form */
router.post('/contact', contact);

/* GET named route to mural */
router.get('/:route', route);

module.exports = router;
