'use strict';

exports.up = function(next){
  var helper = require('./helper');

  helper.native.connect(helper.databaseUri, function(err, db){
  	var collection = db.collection('conversations');
  	collection.rename('collaborationObjects', null, function(err){
  		next();
  	});
  });

};

exports.down = function(next){
  next();
};
