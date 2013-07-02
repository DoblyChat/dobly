exports.up = function(next){
	var Conversation = require('../models/conversation'),
		User = require('../models/user'),
		async = require('async'),
		helper = require('./helper');

	helper.connect();
	
	Conversation.find({}, function(err, conversations){
		console.log('conversations', conversation);
		User.find({}, function(err, users){
			console.log('Users', users);
			async.each(conversations, addMembers, function(err){
				helper.logError(err);
				console.log('Default members for all conversations set to entire group. CreatedById attribute populated');
				helper.disconnect();
				next();
			});

			function addMembers(conversation, callback){
				var user = findUser(conversation._doc.createdBy);
				conversation.createdById = user._id;

				conversation.members.entireGroup = true;
				conversation.members.users = [];
				conversation.save(callback);
			}

			function findUser(username){
				var user;

				for(var i = 0; i < users.length; i++){
					if(users[i].username === username){
						user = users[i];
						break;
					}
				}

				if (typeof user === 'undefined') {
					helper.logError('Could not find user for: [' + username + ']');
				}

				return user;
			}
		});
		
	});
};

exports.down = function(next){
  next();
};
