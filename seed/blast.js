var CollaborationObject = require('../lib/models/collaboration_object')
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
			var collaborationObjectsArray = [];

			for(var i = 0; i < 100; i++){
				collaborationObjectsArray.push({ 
					topic: 'Convo ' + i,
					createdById: user._id,
					groupId: user.groupId
				});
			}

			CollaborationObject.create(collaborationObjectsArray, function(err){
				var collaborationObjects = [];

				for(var i = 1; i < arguments.length; i++ ){
					collaborationObjects.push(arguments[i]);
				}

				async.each(collaborationObjects, saveCollaborationObject, saveDesktop);

				function saveCollaborationObject(collaborationObject, callback){
					var messages = [];

					for(var j = 0; j < 500; j++){
						messages.push({ 
							content: j,
							createdBy: user.name,
							collaborationObjectId: collaborationObject._id,
						});
					}

					Message.create(messages, function(err){
						collaborationObject.save(callback);
					});
				}

				function saveDesktop(err){
					Desktop.findOrCreateByUserId(user._id, function(err, desktop){
						for(var j = 0; j < collaborationObjects.length; j++){
							desktop.collaborationObjects.push(collaborationObjects[j]._id);
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
		CollaborationObject.remove({ topic: new RegExp('^Convo.*$') }, callback);
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
			console.log('all collaborationObjects have been created');
			process.exit(0)
		}
	}
);
