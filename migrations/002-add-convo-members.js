var Conversation = require('../models/conversation'),
	async = require('async'),
	mongo = require('mongoose');

var databaseUri = process.env.MONGOLAB_URI || 'mongodb://localhost/proto';

exports.up = function(next){
	mongo.connect(databaseUri);
	
	Conversation.find({}, function(err, conversations){
		async.each(conversations, addMembers, function(err){
			if(err){
				console.error(err);
			}else{
				console.log('Default members for all conversations set to entire group');
			}

			next();
		});

		function addMembers(conversation, callback){
			if(!conversation.members.entireGroup 
				&& (!conversation.members.users || conversation.members.users.length === 0))
			{
				conversation.members.entireGroup = true;
				conversation.members.users = [];

				conversation.save(callback);
			}
		}
	});
};

exports.down = function(next){
  next();
};
