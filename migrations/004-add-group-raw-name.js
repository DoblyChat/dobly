exports.up = function(next){
    var Group = require('../models/group'),
        async = require('async'),
        helper = require('./helper');

    helper.connect(function(){
        helper.disconnect(next);
    });

    function execute() {
        Group.find({}, function(err, groups){
            helper.logError(err);

            async.each(groups, update, function(err){
                helper.logError(err);
                helper.disconnect(next);
            });

            function update(group, callback){
                group.rawName = group.name.charAt(0).toUpperCase() + group.name.substring(1).toLowerCase();
                group.save(callback);
            }
        });
    }
};

exports.down = function(next){
    next();
};
