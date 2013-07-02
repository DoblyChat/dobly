exports.up = function(next){
	var Conversation = require('../models/conversation'),
		Message = require('../models/message'),
		async = require('async'),
		helper = require('./helper');

	helper.connect();

  	Conversation.find({}, function(err, conversations){
	   	async.each(conversations, moveMessages, function(err){
	   		helper.logError(err);
	   		cleanAllMessages(function(){
	   			helper.disconnect();
	   			next();
	   		});
	   	});

	   	function moveMessages(conversation, callback){
	   		var messages = conversation.get('messages');

	   		if(messages){
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
	 					helper.logError(err);
	 					callback(err);
	 				});
	 		  	} 
	   		}else{
	   			callback(null);
	   		}
	   	} 			
	 });

  	function cleanAllMessages(callback){
	    Conversation.collection.update({}, { $unset: { 'messages': 1 } }, { multi: true },
	                        function(err) {
	        					if (err) {
	        						helper.logError(err);
	        					}
	        					callback();
	    });
	}
};

exports.down = function(next){
	var Conversation = require('../models/conversation'),
		Message = require('../models/message'),
		async = require('async'),
		helper = require('./helper');

	helper.connect();
	
	Message.find({}, function(err, messages){
		helper.logError(err);
		Conversation.find({}, function(err, conversations){
			conversations.forEach(function(conversation){
				conversation.messages = [];
			});

			async.each(messages, moveMessages, function(err){
				helper.logError(err);
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
					helper.logError(err);
					callback(err);
				});
			}

			function end(err){
				helper.logError(err);
				helper.disconnect();
				next();
			}
		});		
	});
};
