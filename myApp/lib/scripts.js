var db = require('monk')('mongodb://heroku_4x9wvl5s:rpa80nemv6pbc9sk3fu2jd3j3p@ds049094.mongolab.com:49094/heroku_4x9wvl5s');
var Galleries = db.get('galleries');
var Photos = db.get('photos');
var Users = db.get('users');
var bcrypt = require('bcrypt');
 // || 'localhost/galleries-demo'
// mongodb://heroku_4x9wvl5s:rpa80nemv6pbc9sk3fu2jd3j3p@ds049094.mongolab.com:49094/heroku_4x9wvl5s
var Helper = {
  signin : function(email, password) {
  var errors = [];
  var result = {};
  return Users.findOne({email: email.toLowerCase()}).then(function (data) {
    if (data) {
      if (bcrypt.compareSync(password, data.passwordDigest)) {
        return result;
      }
      else {
        errors.push("Invalid email / password");
        result['errors'] = errors;
        return result;
      }
    }
    else {
      errors.push('Invalid email / password');
      result['errors'] = errors;
      return result;
    }
  });
},

  addUser : function(email, password) {
    var hash = bcrypt.hashSync(password, 12);
    var result = {};
    var errors = [];
    return Users.findOne({email: email.toLowerCase()}).then(function (data) {
      if (data) {
        errors.push('Email already exists. Try signing in!');
        result['errors'] = errors;
        return result;
      }
      else {
        return Users.insert({email: email, passwordDigest: hash, galleries: [] }).then(function (user) {
          result['user'] = user;
          return result;
        });
      }
    });
  },

  findUser : function(email) {
    var joinUserGallery = function (users, galleries) {
      var indexed = galleries.reduce(function (result, gallery) {
        result[gallery._id.toString()] = gallery;
          return result;
      }, {});
      users.forEach(function (user) {
        user.specificGalleries = user.galleries.map(function (_id) {
          return indexed[_id.toString()];
        });
      });
      return users;
    };
    var data = {};
    return Users.findOne({email: email.toLowerCase()}).then(function (user) {
      return user.galleries;
    }).then(function (galleryIds) {
      return Galleries.find({_id: {$in: galleryIds}}).then(function (galleries) {
        data['galleries'] = galleries;
        data['otherGalleries'] = [];
        return data;
      });
    }).then(function (data) {
      return Users.find({}).then(function (users) {
        return users.filter(function (user) {
          return user.email !== email;
        })
      })
    }).then(function (users) {
      var galleryIds = users.reduce(function (result, user) {
        return result.concat(user.galleries);
      }, []);
      return Galleries.find({_id: {$in: galleryIds}}).then(function (gallery) {
        joinUserGallery(users, gallery);
        data.otherGalleries = users;
        return data;
      });

    });

  },

  addGallery : function(title, description, url, email) {
      return Galleries.insert({img: url, title: title, description: description, photoId: []}).then(function (gallery) {
        return gallery._id;
      }).then(function (galleryId) {
        return Users.findOne({email: email.toLowerCase()}).then(function (user) {
          user.galleries.push(galleryId);
          return user.galleries;     
        }).then(function (updatedGalleries) {
          return Users.update({email: email}, {$set: {galleries: updatedGalleries}});
        });
      });
  },

  removeGallery : function(id, email) {
    return Users.findOne({email: email.toLowerCase()}).then(function (user) {
      var trashIndex = user.galleries.indexOf(id);
      user.galleries.splice(trashIndex, 1);
      return user.galleries;
    }).then(function (updatedGalleries) {
        return Users.update({email: email}, {$set: {galleries: updatedGalleries}});
      });
  },

  showPhotos : function(id) {
    return Galleries.findOne({_id: id}).then(function (gallery) {
      return gallery;
    }).then(function (gallery) {
      return Photos.find({_id: {$in: gallery.photoId} }).then(function (photos) {
        var result = {};
        result['gallery'] = gallery;
        result['photos'] = photos;
        return result;
      });
    });
  },

  renderNew : function(id) {
    return Galleries.findOne({_id: id}).then(function (gallery) {     
      return gallery;
    });
  },

  addPhoto : function(id, url, name) {
    return Photos.insert({name: name, img: url}).then(function (photo) {
      return photo;
    }).then(function (photo) {   
      return Galleries.findOne({_id: id}).then(function (gallery) {    
        gallery.photoId.push(photo._id);
        return gallery;
      }).then(function (gallery) {
        return Galleries.updateById(id, {$set: {photoId: gallery.photoId}});
      });
    });
  },

  editPhoto : function(galleryId, photoId) {
    return Galleries.findOne({_id: galleryId}).then(function (gallery) {
      return gallery;
    }).then(function (gallery) {
      return Photos.findOne({_id: photoId}).then(function (photo) {
        return [gallery, photo];
      });
    });    
  },

  updatePhoto : function(photoId, name, url) {
    return Photos.updateById(photoId, {name: name, img: url});
  },

  removePhoto : function(photoId) {
    return Photos.remove({_id: photoId});
  }
}

module.exports = Helper;
