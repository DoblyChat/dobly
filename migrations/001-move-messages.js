var Conversation = require('../models/conversation'),
	Message = require('../models/message'),
	async = require('async'),
	mongo = require('mongoose');

var databaseUri = process.env.MONGOLAB_URI || 'mongodb://localhost/proto';
mongo.connect(databaseUri);

function logError(err){
	if(err){
		console.error(err);
	}
}

exports.up = function(next){
  	Conversation.find({}, function(err, conversations){
	  	async.each(conversations, moveMessages, function(err){
	  		logError(err);
	  		next();
	  	});

	  	function moveMessages(conversation, callback){
	  		var messageIds = [];

	  		async.each(conversation.messages, moveMessage, function(err){
	  			console.error(err);
	  			conversation.messages = messageIds;
	  			conversation.save(function(err){
	  				logError(err);
	  				callback(err);
	  			});
	  		});

	  		function moveMessage(message, callback){
		  		var newMessage = new Message();
				newMessage.content = message.content;
				newMessage.createdBy = message.createdBy;
				newMessage.timestamp = message.timestamp;
				newMessage.conversationId = conversation._id;
				newMessage._id = message._id;
				newMessage.save(function(err){
					logError(err);
					messageIds.push(message._id);
					callback(err);
				});
		  	} 
	  	} 			
	});
};

exports.down = function(next){
	Message.find({}, function(err, messages){
		logError(err);
		Conversation.find({}, function(err, conversations){
			async.each(messages, moveMessages, function(err){
				logError(err);
				async.each(
					conversations, 
					function(conversation, callback){
						conversation.save(function(err){
							logError(err);
							callback(err);
						});
					}, 
					function(err){
						logError(err);
						messages.remove(function(err){
							logError(err);
							next();
						});
					}
				);					
			});

			function moveMessages(message, callback){
				conversations.forEach(function(conversation){
					if(conversation._id.equal(message.conversationId)){
						conversation.messages.push(message);
					}
				});
			}

		});		
	});
  next();
};
