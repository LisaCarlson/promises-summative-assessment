var express = require('express');
var router = express.Router();
var Helper = require('../lib/scripts.js');

router.get('/new', function(req, res, next) {
  res.render('galleries/new', {errors: req.session.errorList, username: req.session.username});
});

router.post('/', function(req, res, next) {
  var errors = [];
  if (!req.body.title) {
    errors.push('Title is required');
  }
  if (!req.body.description) {
    errors.push('description is required');
  }
  if (!req.body.url) {
    errors.push('URL is required');
  }
  if (errors.length) {
    res.render('galleries/new', {errors: errors});
  }
  else {
    Helper.addGallery(req.body.title, req.body.description, req.body.url, req.session.username).then(function () {
      req.session.errorList = null;
      res.redirect('/galleries');
    });
  }  
});

router.get('/:id/gallery-delete', function(req, res, next) {
  Helper.removeGallery(req.params.id, req.session.username).then(function() {
    res.redirect('/galleries');
  });
});
  
router.get('/', function(req, res, next) {
  if (!req.session.username) {
    res.redirect('/register');
  }
  else {
    Helper.findUser(req.session.username).then(function (data) {
      res.render('galleries/gallery', {galleries: data.galleries, otherGalleries: data.otherGalleries, username: req.session.username});
    });
  }
});

router.get('/:id/photos', function(req, res, next) {
  Helper.showPhotos(req.params.id).then(function (data) {
    res.render('photos/show', {gallery: data.gallery, photos: data.photos, username: req.session.username});
  });      
});

router.get('/:id/photos/new', function(req, res, next) {
  Helper.renderNew(req.params.id).then(function (data) {
    res.render('photos/new', {gallery: data, errors: req.session.errorList, username: req.session.username});
  });
});

router.post('/:id/photos', function(req, res, next) {
  var errors = [];
  if (!req.body.name) {
    errors.push('Name is required');
  }
  if (!req.body.url) {
    errors.push('URL is required');
  }
  if (errors.length) {
    req.session.errorList = errors;
    res.redirect('/galleries/' + req.params.id + '/photos/new');
  }
  else {
    Helper.addPhoto(req.params.id, req.body.url, req.body.name).then(function (data) {
      req.session.errorList = null;
      res.redirect('/galleries/'+ req.params.id +'/photos');
    });
  }  
});

router.get('/:id/photos/:photoId/edit', function(req, res, next) {
  Helper.editPhoto(req.params.id, req.params.photoId).then(function (data) {
    res.render('photos/edit', {photo: data[1], gallery: data[0], errors: req.session.errorList, username: req.session.username});
  });
});

router.post('/:id/photos/:photoId', function(req, res, next) {
  Helper.updatePhoto(req.params.photoId, req.body.name, req.body.url).then(function (data) {
    res.redirect('/galleries/'+ req.params.id +'/photos');
  });
});

router.post('/:id/photos/:photoId/delete', function(req, res, next) {
  Helper.removePhoto(req.params.photoId).then(function (data) {
    res.redirect('/galleries/'+ req.params.id +'/photos');
  });
});


module.exports = router;
