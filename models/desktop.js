var mongo = require('mongoose');

var schema = new mongo.Schema({
	conversations: { type: [ mongo.Schema.Types.ObjectId ], default: [] },
	userId: { type: mongo.Schema.Types.ObjectId, required: true },
});

schema.methods.removeConversation = function(conversationId){
	var index = this.conversations.indexOf(conversationId);
	if(index >= 0){		
		this.conversations.splice(index, 1);
	}
};

schema.methods.addConversation = function(conversationId){
	if(this.conversations.indexOf(conversationId) < 0){
    	this.conversations.push(conversationId);            
    }
};

schema.methods.moveConversation = function(currentIndex, newIndex){
	var conversation = this.conversations[currentIndex];
    this.conversations.splice(currentIndex, 1);
    this.conversations.splice(newIndex, 0, conversation);
};

schema.statics.findOrCreateByUserId = function(userId, callback){
	var model = this;

	this.findOne({ userId: userId }, function(err, desktop){
		if(desktop === null){
			desktop = new model();
			desktop.userId = userId;
			desktop.save(function(err, savedDesktop){
				callback(err, savedDesktop);
			});
		}
		else{
			callback(err, desktop);
		}
	});
}

module.exports = mongo.model('Desktop', schema);