var Conversation = require('../lib/models/conversation')
  , Message = require('../lib/models/message')
  , User = require('../lib/models/user')
  , Group = require('../lib/models/group')
  , Desktop = require('../lib/models/desktop')
  , mongo = require('mongoose')
  , async = require('async');

var databaseUri = process.env.MONGOLAB_URI || 'mongodb://localhost/proto';
mongo.connect(databaseUri);

function blast(callback){
	Group.findOne({ name: 'founders' }, function(err, group){
		User.create([{ name: 'blast', email: 'blast@dobly.com', password: 'pass', groupId: group._id}], function(err, user){
			var conversationArray = [];

			for(var i = 0; i < 100; i++){
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
							createdBy: user.name,
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
		User.findOneAndRemove({ email: 'blast@dobly.com' }, callback);
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
