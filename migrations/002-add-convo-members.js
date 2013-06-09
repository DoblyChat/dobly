var Conversation = require('../models/conversation'),
	User = require('../models/user'),
	async = require('async'),
	mongo = require('mongoose');

var databaseUri = process.env.MONGOLAB_URI || 'mongodb://localhost/proto';

exports.up = function(next){
	mongo.connect(databaseUri);
	
	Conversation.find({}, function(err, conversations){
		User.find({}, function(err, users){
			async.each(conversations, addMembers, function(err){
				if(err){
					console.error(err);
				}else{
					console.log('Default members for all conversations set to entire group. CreatedById attribute populated');
				}

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

				return user;
			}
		});
		
	});
};

exports.down = function(next){
  next();
};
