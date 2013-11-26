define(['knockout', 'client/common'], function(ko, common){
	return function(data){
		var self = {};

		self.id = ko.observable(data._id);	
		self.createdBy = app.groupUsers[data.createdById];
		self.timestamp = ko.observable(data.timestamp ? data.timestamp : null);
		self.formattedTimestamp = ko.computed(function() {
            return common.formatTimestamp(self.timestamp());
        });
		self.isComplete = ko.observable();
		self.completedOn = ko.observable();
		self.completedBy = ko.observable();
		self.content = ko.observable();
		self.processing = ko.observable(false);
		self.showDetails = ko.observable(false);
		self.isEditing = ko.observable(false);
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
		};

		self.cancelEdit = function(){
			self.isEditing(false);
			self.updatedContent(self.rawContent);
		};

		function hasBeenUpdated(){
			return self.rawContent !== self.updatedContent();
		}

		self.updateContent = function(){
			if(hasBeenUpdated()){
				app.socket.emit('update_task_content', { 
					id: self.id(), 
					content: self.updatedContent(),
					collaborationObjectId: data.collaborationObjectId
				});

				self.setContent(self.updatedContent());	
			}

			self.isEditing(false);
		};

		self.updateContentKeyPress = function(obj, event){
			if (common.enterKeyPressed(event) && !event.shiftKey) {
				self.updateContent();
				return false;
			}else{
				return true;
			}
		};

		return self;
	};
});