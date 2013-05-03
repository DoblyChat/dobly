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
	console.log(typeof Conversation.collection);
  	Conversation.find({}, function(err, conversations){
	  	async.each(conversations, moveMessages, function(err){
	  		logError(err);
	  		cleanAllMessages(function(){
	  			next();
	  		});
	  	});

	  	function moveMessages(conversation, callback){
	  		async.each(conversation.get('messages'), moveMessage, function(err){
	  			callback(err);
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
					callback(err);
				});
		  	} 
	  	} 			
	});
};

function cleanAllMessages(callback){
    Conversation.collection.update({}, { $unset: { 'messages': 1 } }, { multi: true },
                        function(err) {
        					if (err) {
        						logError(err);
        					}
        					callback();
    });
}

exports.down = function(next){
	Message.find({}, function(err, messages){
		logError(err);
		Conversation.find({}, function(err, conversations){
			conversations.forEach(function(conversation){
				conversation.messages = [];
			});

			async.each(messages, moveMessages, function(err){
				logError(err);
				async.each(conversations, saveConversation, end);					
			});

			function moveMessages(message, callback){
				conversations.forEach(function(conversation){
					if(conversation._id.equals(message.conversationId)){
						conversation.messages.push(message);
					}
				});

				message.remove(callback);
			}

			function saveConversation(conversation, callback){
				conversation.save(function(err){
					logError(err);
					callback(err);
				});
			}

			function end(err){
				logError(err);
				next();
			}
		});		
	});
};
