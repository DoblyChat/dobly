define(['knockout', 'client/common'], function(ko, common){
	return function(data){
		var self = {};

		var collaborationObjectId = data.collaborationObjectId;

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
		self.showMenu = ko.observable(false);
		self.isEditing = ko.observable(false);
		self.isAssigning = ko.observable(false);
		self.updatedContent = ko.observable(data.content);
		self.assignedTo = ko.observable();
		self.updatedAssignedToId = ko.observable(data.assignedToId);
		self.menuHasFocus = ko.observable(false);

		self.updateCompleteValues = function(data){
			self.completedOn(data.completedOn ? common.formatTimestamp(data.completedOn) : null);
			self.completedBy(data.completedById ? app.groupUsers[data.completedById] : null);
			self.isComplete(data.isComplete);
		};

		self.setContent = function(content){
			self.rawContent = content;
			self.content(common.formatUserInput(content));
		};

		self.setAssignedTo = function(assignedToId){
			self.assignedToId = assignedToId;
			self.assignedTo(app.groupUsers[self.assignedToId]);
		};

		self.updateCompleteValues(data);
		self.setContent(data.content);
		self.setAssignedTo(data.assignedToId);

		self.getNotificationText = function(){
			return self.createdBy + ' has added a new task: ' + self.content();
		};

		self.toggleComplete = function(){
			self.processing(true);

			app.socket.emit('toggle_complete_task', {
				id: self.id(),
				collaborationObjectId: collaborationObjectId,
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

		self.showPopupMenu = function(){
			self.showMenu(true);
			self.menuHasFocus(true);
		};

		self.startEdit = function(){
			self.showMenu(false);
			self.isEditing(true);
		};

		self.startAssign = function(){
			self.showMenu(false);
			self.isAssigning(true);
		};

		self.isUpdating = ko.computed(function(){
			return self.isEditing() || self.isAssigning();
		});

		function cancelEdit(){
			self.isEditing(false);
			self.updatedContent(self.rawContent);
		}

		function cancelAssign(){
			self.isAssigning(false);
			self.updatedAssignedToId(self.assignedToId);
		}

		self.cancel = function(){
			if(self.isEditing()){
				cancelEdit();
			}else{
				cancelAssign();
			}
		};

		function contentHasBeenUpdated(){
			return self.rawContent !== self.updatedContent();
		}

		function updateContent(){
			if(contentHasBeenUpdated()){
				app.socket.emit('update_task_content', { 
					id: self.id(), 
					content: self.updatedContent(),
					collaborationObjectId: collaborationObjectId
				});

				self.setContent(self.updatedContent());	
			}

			self.isEditing(false);
		}

		function assignedToHasBeenUpdated(){
			return self.assignedToId !== self.updatedAssignedToId();
		}

		function updateAssignedTo(){
			if(assignedToHasBeenUpdated()){
				app.socket.emit('assign_task', {
					id: self.id(),
					assignedToId: self.updatedAssignedToId(),
					collaborationObjectId: collaborationObjectId
				});

				self.setAssignedTo(self.updatedAssignedToId());
			}

			self.isAssigning(false);
		}

		self.update = function(){
			if(self.isEditing()){
				updateContent();
			}else{
				updateAssignedTo();
			}
		};

		self.updateKeyPress = function(obj, event){
			if (common.enterKeyPressed(event) && !event.shiftKey) {
				self.update();
				return false;
			}else{
				return true;
			}
		};

		self.menuHasFocus.subscribe(function(focus){
			if(!focus){
				self.showMenu(false);
			}
		});

		return self;
	};
});