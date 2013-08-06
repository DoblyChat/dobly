'use strict';

var mongo = require('mongoose'),
	User = require('./user');

var schema = new mongo.Schema({
	name: { type: String, required: true, lowercase: true },
	rawName: { type: String, required: true }
});

schema.pre('remove', function(next){
	var group = this;
	User.remove({ groupId: group._id }, function(err){
		if(!err) {
			next();
		}
	});
});

module.exports = mongo.model('Group', schema);