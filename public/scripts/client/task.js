define(['knockout', 'client/common'], function(ko, common){
	return function(data){
		var self = {};

		self.id = ko.observable(data._id);	
		self.createdBy = app.groupUsers[data.createdById];
		self.timestamp = common.formatTimestamp(data.timestamp);
		self.isComplete = ko.observable();
		self.completedOn = ko.observable();
		self.completedBy = ko.observable();
		self.content = ko.observable();
		self.rawContent = ko.observable();
		self.processing = ko.observable(false);
		self.showDetails = ko.observable(false);
		self.isEditing = ko.observable(false);
		self.editHasFocus = ko.observable(false);
		self.updatedContent = ko.observable(data.content);

		self.updateCompleteValues = function(data){
			self.completedOn(data.completedOn ? common.formatTimestamp(data.completedOn) : null);
			self.completedBy(data.completedById ? app.groupUsers[data.completedById] : null);
			
			self.isComplete(data.isComplete);
		};

		self.setContent = function(content){
			self.rawContent = content;
			self.content(common.formatUserInput(content));
		};

		self.updateCompleteValues(data);
		self.setContent(data.content);

		self.toggleComplete = function(){
			self.processing(true);

			app.socket.emit('toggle_complete_task', {
				id: self.id(),
				collaborationObjectId: data.collaborationObjectId,
				isComplete: !self.isComplete()
			}, function(completeData){
				self.updateCompleteValues(completeData);
				self.processing(false);
			});
			
			return true;
		};

		self.toggleDetails = function(){
			self.showDetails(!self.showDetails());
		};

		self.startEdit = function(){
			self.isEditing(true);
			self.editHasFocus(true);
		};

		self.editHasFocus.subscribe(function(hasFocus){
			if(!hasFocus){
				self.isEditing(false);
				self.updatedContent(self.rawContent);
			}
		});

		function taskHasBeenUpdated(){
			return self.rawContent !== self.updatedContent();
		}

		self.updateTaskContent = function(obj, event){
			if (taskHasBeenUpdated() && common.enterKeyPressed(event) && !event.shiftKey) {
				app.socket.emit('update_task_content', { 
					id: self.id(), 
					content: self.updatedContent(),
					collaborationObjectId: data.collaborationObjectId
				});

				self.setContent(self.updatedContent());
				self.editHasFocus(false);

				return false;
			}else{
				return true;
			}
		};

		return self;
	};
});