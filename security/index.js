var LocalStrategy = require('passport-local').Strategy
  , User = require('../models/user');

exports.config = function(passport){
	passport.use(new LocalStrategy(
		function(username, password, done){
			User.findOne({ username: username }, function(err, user){
				if(err) { done(err); }

				if(!user){
					return done(null, false);
				}

				if(user.password !== password){
					return done(null, false);	
				}

				return done(null, user);
			});
		})
	);

	passport.serializeUser(function(user, done) {
	  	done(null, user._id);
	});

	passport.deserializeUser(function(id, done) {
	  User.findById(id, function(err, user) {
	    done(err, user);
	  });
	});
};
