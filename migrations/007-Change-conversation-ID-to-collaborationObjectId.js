
exports.up = function(next){
    var Message = require('../lib/models/message'),
  		UnreadMarker = require('../lib/models/unread_marker')
        async = require('async'),
        helper = require('./helper');

    helper.connect(function(){
        execute();
    });

    function execute() {
    	Message.find({}, function(err, messages) {
    		async.each(messages, changeConversationId, function(err) {
    			helper.logError(err);
    			UnreadMarker.find({}, function(err, unreadMarkers) {
    				async.each(unreadMarkers, changeConversationId, function(err) {
    					helper.logError(err);
    					helper.disconnect(next);
    				});
    			});
    		});

            function changeConversationId(item, callback) {
                item.collaborationObjectId = item._doc.conversationId;
                item.save(callback);
            }
    	});
    }
};

exports.down = function(next){
  next();
};
