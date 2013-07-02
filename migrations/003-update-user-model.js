exports.up = function(next){
	var User = require('../models/user'),
		async = require('async'),
		helper = require('./helper');

	helper.connect();

	User.find({}, function(err, users){
		helper.logError(err);

		async.each(users, update, function(err){
			helper.logError(err);

			next();
		});

		function update(user, callback){
			user.email = user._doc.username + '@dobly.com';
			user.name = user._doc.username;
			user.save(callback);
		}
	});
};

exports.down = function(next){
  next();
};
