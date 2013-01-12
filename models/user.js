var mongo = require('mongoose')
  , bcrypt = require('bcrypt')
  , SALT_WORK_FACTOR = 10;

var userSchema = new mongo.Schema({
	username: { type: String, required: true, index: { unique: true } },
	password: { type: String, required: true }
});

userSchema.pre('save', function(next) {
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

userSchema.methods.comparePassword = function(candidatePassword, callback) {
	bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
		if(err) { return callback(err); }
		callback(null, isMatch);
	});
};


module.exports = mongo.model('User', userSchema);