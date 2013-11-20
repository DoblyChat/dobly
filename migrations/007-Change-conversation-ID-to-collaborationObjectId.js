
exports.up = function(next){
    var Message = require('../lib/models/message'),
  		UnreadMarker = require('../lib/models/unread_marker')
        async = require('async'),
        helper = require('./helper'),
        mongo = require('mongoose');

    var dummyCreatedById = new mongo.Types.ObjectId();

    helper.connect(function(){
        console.log('dummy created by id for messages: ' + dummyCreatedById);
        execute();
    });

    function execute() {
    	Message.find({}, function(err, messages) {
    		async.each(messages, changeMessageConversationId, function(err) {
    			helper.logError(err);
    			UnreadMarker.find({}, function(err, unreadMarkers) {
    				async.each(unreadMarkers, changeUnreadMarkerConversationId, function(err) {
    					helper.logError(err);
    					helper.disconnect(next);
    				});
    			});
    		});

            function changeMessageConversationId(item, callback) {
                item.collaborationObjectId = item._doc.conversationId;
                item.createdById = dummyCreatedById;
                item.save(callback);
            }

            function changeUnreadMarkerConversationId(item, callback) {
                item.collaborationObjectId = item._doc.conversationId;
                item.save(callback);
            }
    	});
    }
};

exports.down = function(next){
  next();
};
