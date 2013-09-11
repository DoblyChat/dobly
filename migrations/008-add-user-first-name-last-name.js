
exports.up = function(next){

    var User = require('../lib/models/user'),
        async = require('async'),
        helper = require('./helper');


    helper.connect(function() {
        execute();
    });

    function execute(){
        User.find({}, function(err, users) {
            helper.logError(err);

            async.each(users, update, function(err) {
                helper.logError(err);
                helper.disconnect(next);
            });

            function update(user, callback){
                if (user._doc.name) {
                    user.firstName = user._doc.name;
                    user.lastName = 'Doe';
                    user.save(callback);
                } else {
                    callback();
                }
            }
       });
    }
};

exports.down = function(next){
    next();
};
