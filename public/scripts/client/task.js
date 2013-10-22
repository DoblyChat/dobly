define(['knockout', 'client/common'], function(ko, common){
	return function(data){
		var self = {};

		self.id = ko.observable(data._id);
		self.content = common.formatUserInput(data.content);
		self.isComplete = ko.observable(data.isComplete);

		self.complete = function(){
			app.socket.emit('complete_task', {
				collaborationObjectId: data.collaborationObjectId,
				id: self.id()
			});

			return true;
		};

		return self;
	};
});