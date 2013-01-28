var LocalStrategy = require('passport-local').Strategy
  , User = require('../models/user');

exports.config = function(passport){
	passport.use(new LocalStrategy(
		function(username, password, done){
			username = username.toLowerCase();
			User.findOne({ username: username }, function(err, user){
				if(err) { done(err); }

				if(!user){
					return done(null, false);
				}

				user.comparePassword(password, function(err, isMatch) {
					if(err) { done(err); }

					if(isMatch) {
						done(null, user);
					}else {
						done(null, false);
					}
				});
			});
		})
	);

	passport.serializeUser(function(user, done) {
	  	done(null, user._id);
	});

	passport.deserializeUser(function(id, done) {
	  User.findById(id).lean().exec(function(err, user) {
	    done(err, user);
	  });
	});
};
