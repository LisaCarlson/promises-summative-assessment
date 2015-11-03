var express = require('express');
var router = express.Router();
var Helper = require('../lib/scripts.js');

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.post('/register', function(req, res, next) {
  var errors = [];
  if(!req.body.email) {
    errors.push('Email is required');
  }
  if(!req.body.password) {
    errors.push('Password is required');
  }
  if(req.body.password !== req.body.password_confirmation) {
    errors.push('Password and Password Confirmation must match');
  }
  if(errors.length) {
    res.render('register', {errors: errors});
  }
  else {
    Helper.addUser(req.body.email, req.body.password).then(function (data) {
      if(data.errors) {
        res.render('register', {errors: data.errors});
      }
      else {
        req.session.username = req.body.email;
        res.redirect('/galleries');
      }
    });
  }
});

router.get('/login', function(req, res, next) {
  res.render('login');
});

router.post('/login', function(req, res, next) {
  var errors = [];
  if(!req.body.email) {
    errors.push('Email is required');
  }
  if(!req.body.password) {
    errors.push('Password is required');
  }
  if(errors.length) {
    res.render('login', {errors: errors});
  }
  else {
    Helper.signin(req.body.email, req.body.password).then(function (data) {
      if(data.errors) {
        res.render('login', {errors: data.errors});
      }
      else {
        req.session.username = req.body.email;
        res.redirect('/galleries');
      }
    });
  }  
});

router.get('/logout', function(req, res, next) {
  req.session = null;
  res.redirect('/register');
});

module.exports = router;
