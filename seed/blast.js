var Conversation = require('../models/conversation')
  , Message = require('../models/message')
  , User = require('../models/user')
  , Group = require('../models/group')
  , Desktop = require('../models/desktop')
  , mongo = require('mongoose')
  , async = require('async');

var databaseUri = process.env.MONGOLAB_URI || 'mongodb://localhost/proto';
mongo.connect(databaseUri);

function blast(callback){
	Group.findOne({ name: 'founders' }, function(err, group){
		User.create([{ username: 'blast', password: 'pass', groupId: group._id}], function(err, user){
			var conversationArray = [];

			for(var i = 0; i < 20; i++){
				conversationArray.push({ 
					topic: 'Convo ' + i,
					createdById: user._id,
					groupId: user.groupId
				});
			}

			Conversation.create(conversationArray, function(err){
				var conversations = [];

				for(var i = 1; i < arguments.length; i++ ){
					conversations.push(arguments[i]);
				}

				async.each(conversations, saveConversation, saveDesktop);

				function saveConversation(conversation, callback){
					var messages = [];

					for(var j = 0; j < 500; j++){
						messages.push({ 
							content: j,
							createdBy: user.username,
							conversationId: conversation._id,
						});
					}

					Message.create(messages, function(err){
						conversation.save(callback);
					});
				}

				function saveDesktop(err){
					Desktop.findOrCreateByUserId(user._id, function(err, desktop){
						for(var j = 0; j < conversations.length; j++){
							desktop.conversations.push(conversations[j]._id);
						}

						desktop.save(function(err){
							callback(err);	
						});	
					});
				}
			});
		});
	});
}

async.series([
	function(callback){
		User.findOneAndRemove({ username: 'blast' }, callback);
	},
	function(callback){
		Conversation.remove({ topic: new RegExp('^Convo.*$') }, callback);
	},
	function(callback){
		Desktop.remove({}, callback);
	},
	function(callback){
		blast(callback);
	}],
	function(err, results){
		if(err) {
			console.log(err);
			process.exit(0);
		}else{
			console.log('all conversations have been created');
			process.exit(0)
		}
	}
);
