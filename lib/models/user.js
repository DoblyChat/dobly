'use strict';

var mongo = require('mongoose'),
	bcrypt = require('bcrypt'), 
	SALT_WORK_FACTOR = 10, 
	emailValidator = require('../common/email_validator');
	

var schema = new mongo.Schema({
	email: { type: String, required: true, lowercase: true, index: { unique: true } },
	firstName: { type: String, required: true },
	lastName: { type: String, required: true },
	password: { type: String, required: true },
	groupId: { type: mongo.Schema.Types.ObjectId, required: true }
});

schema.pre('save', function(next) {
	var user = this;
	
	if(!user.isModified('password')) { return next(); }

	bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {

		if(err) { return next(err); }

		bcrypt.hash(user.password, salt, function(err, hash) {
			if(err) { return next(err); }

			user.password = hash;
			next();
		});
	});
});

schema.path('email').validate(emailValidator.isValid, 'Invalid email');

schema.methods.comparePassword = function(candidatePassword, callback) {
	bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
		if(err) { return callback(err); }
		callback(null, isMatch);
	});
};

schema.statics.findExcept = function(exceptUserIds, groupId, callback){
	this.find({ _id: { $nin: exceptUserIds }, groupId: groupId }, function(err, users){
        callback(err, users);
    });
};

schema.methods.getFullName = function() {
	return this.firstName + ' ' + this.lastName;
};

module.exports = mongo.model('User', schema);