define(['knockout', 'client/common'], function(ko, common){
	return function(data){
		var self = {};

		self.id = ko.observable(data._id);
		self.content = common.formatUserInput(data.content);	
		self.createdBy = app.groupUsers[data.createdById];
		self.timestamp = common.formatTimestamp(data.timestamp);
		self.isComplete = ko.observable();
		self.completedOn = ko.observable();
		self.completedBy = ko.observable();

		self.updateCompleteValues = function(data){
			self.completedOn(data.completedOn ? common.formatTimestamp(data.completedOn) : null);
			self.completedBy(data.completedById ? app.groupUsers[data.completedById] : null);
			
			self.isComplete(data.isComplete);
		};

		self.updateCompleteValues(data);

		self.toggleComplete = function(model, event){
			app.socket.emit('toggle_complete_task', {
				id: self.id(),
				collaborationObjectId: data.collaborationObjectId,
				isComplete: event.target.checked
			}, function(completeData){
				self.updateCompleteValues(completeData);
			});

			return true;
		};

		self.showDetails = ko.observable(false);

		self.toggleDetails = function(){
			self.showDetails(!self.showDetails());
		};

		return self;
	};
});