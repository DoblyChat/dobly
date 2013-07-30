exports.config = function(passport){
    var LocalStrategy = require('passport-local').Strategy,
        User = require('../models/user');

    passport.use(new LocalStrategy({
            usernameField: 'email'
        },
        function(email, password, done){
            email = email.toLowerCase();
            User.findOne({ email: email }, function(err, user){
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
      User.findById(id, '_id groupId email name', { lean: true }, function(err, user) {
        done(err, user);
      });
    });
};
