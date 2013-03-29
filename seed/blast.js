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
					createdBy: user._id,
					groupId: user.groupId
				});
			}

			var conversationsToBeSaved = [];

			Conversation.create(conversationArray, function(err){
				for(var a = 1; a < arguments.length; a++){
					var conversation = arguments[a];

					for(var j = 0; j < 500; j++){
						var msg = new Message();
						msg.content = 'this\nis\na\ntest';
						msg.createdBy = user.username;
						conversation.messages.push(msg);
					}

					conversationsToBeSaved.push(conversation);
				}

				async.each(conversationsToBeSaved, saveConversation, saveDesktop);

				function saveConversation(conversation, callback){
					conversation.save(callback);
				}

				function saveDesktop(err){
					Desktop.findOrCreateByUserId(user._id, function(err, desktop){
						for(var j = 0; j < conversationsToBeSaved.length; j++){
							desktop.conversations.push(conversationsToBeSaved[j]._id);
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
