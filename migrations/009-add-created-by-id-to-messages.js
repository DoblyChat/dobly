
exports.up = function(next){

	var Message = require('../lib/models/message'),
		CollaborationObject = require('../lib/models/collaboration_object'),
		User = require('../lib/models/user'),
		async = require('async'),
		helper = require('./helper');

	helper.connect(function() {
		execute();
	});

	function execute() {
		Message.find({}, function(err, messages) {
			helper.logError(err);

			async.each(messages, update, function(err) {
				helper.logError(err);
				helper.disconnect(next);
			});

			function update(message, callback) {
				if (message._doc.createdBy) {
					CollaborationObject.findById(message.collaborationObjectId, function(err, collaborationObject) {
						helper.logError(err);
						if(collaborationObject){
							User.findOne({ groupId: collaborationObject.groupId, firstName: message._doc.createdBy }, function(err, user) {
								helper.logError(err);
								message.createdById = user._id;
								message.save(callback);
							});
						}
					});
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
