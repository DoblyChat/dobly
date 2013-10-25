define(['knockout', 'client/common'], function(ko, common){
	return function(data){
		var self = {};

		self.id = ko.observable(data._id);
		self.content = common.formatUserInput(data.content);
		self.isComplete = ko.observable(data.isComplete);
		self.createdBy = app.groupUsers[data.createdById];
		self.timestamp = common.formatTimestamp(data.timestamp);
		self.completedOn = common.formatTimestamp(data.completedOn);

		self.toggleComplete = function(model, event){
			app.socket.emit('toggle_complete_task', {
				id: self.id(),
				collaborationObjectId: data.collaborationObjectId,
				isComplete: event.target.checked
			}, function(completedOnDate){
				var date = completedOnDate ? common.formatTimestamp(completedOnDate) : null;
				self.completedOn = date;
			});

			return true;
		};

		return self;
	};
});