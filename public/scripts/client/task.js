define(['knockout', 'client/socket', 'client/group', 'client/common'], 
	function(ko, socket, group, common){
	
	function Task(data){
		var self = this;

		self.collaborationObjectId = data.collaborationObjectId;
		self.id = ko.observable(data._id);	
		self.createdBy = group.getUserFullName(data.createdById);
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

		self.updateCompleteValues(data);
		self.setContent(data.content);
		self.setAssignedTo(data.assignedToId);		

		self.isUpdating = ko.computed(function(){
			return self.isEditing() || self.isAssigning();
		}, self);

		self.menuHasFocus.subscribe(function(focus){
			if(!focus){
				self.showMenu(false);
			}
		});
	}

	var proto = Task.prototype;

	proto.updateCompleteValues = function(data){
		this.completedOn(data.completedOn ? common.formatTimestamp(data.completedOn) : null);
		this.completedBy(data.completedById ? group.getUserFullName(data.completedById) : null);
		this.isComplete(data.isComplete);
	};

	proto.setContent = function(content){
		this.rawContent = content;
		this.content(common.formatUserInput(content));
	};

	proto.setAssignedTo = function(assignedToId){
		if(assignedToId){
			this.assignedToId = assignedToId;
			this.assignedTo(group.getUserFullName(this.assignedToId));
		}	
	};

	proto.getNotificationText = function(){
		return this.createdBy + ' has added a new task: ' + this.content();
	};

	proto.toggleComplete = function(){
		var self = this;
		this.processing(true);

		socket.emit('toggle_complete_task', {
			id: this.id(),
			collaborationObjectId: this.collaborationObjectId,
			isComplete: !this.isComplete()
		}, function(completeData){
			self.updateCompleteValues(completeData);
			self.processing(false);
		});
		
		return true;
	};

	proto.toggleDetails = function(){
		this.showDetails(!this.showDetails());
	};

	proto.showPopupMenu = function(){
		this.showMenu(true);
		this.menuHasFocus(true);
	};

	proto.startEdit = function(){
		this.showMenu(false);
		this.isEditing(true);
	};

	proto.startAssign = function(){
		this.showMenu(false);
		this.isAssigning(true);
	};

	proto.cancel = function(){
		if(this.isEditing()){
			this.isEditing(false);
			this.updatedContent(this.rawContent);
		}else{
			this.isAssigning(false);
			this.updatedAssignedToId(this.assignedToId);
		}
	};

	function contentHasBeenUpdated(task){
		return task.rawContent !== task.updatedContent();
	}

	function updateContent(task){
		if(contentHasBeenUpdated(task)){
			socket.emit('update_task_content', { 
				id: task.id(), 
				content: task.updatedContent(),
				collaborationObjectId: task.collaborationObjectId
			});

			task.setContent(task.updatedContent());	
		}

		task.isEditing(false);
	}

	function assignedToHasBeenUpdated(task){
		return task.assignedToId !== task.updatedAssignedToId();
	}

	function updateAssignedTo(task){
		if(assignedToHasBeenUpdated(task)){
			socket.emit('assign_task', {
				id: task.id(),
				assignedToId: task.updatedAssignedToId(),
				collaborationObjectId: task.collaborationObjectId
			});

			task.setAssignedTo(task.updatedAssignedToId());
		}

		task.isAssigning(false);
	}

	proto.update = function(){
		if(this.isEditing()){
			updateContent(this);
		}else{
			updateAssignedTo(this);
		}
	};

	proto.updateKeyPress = function(obj, event){
		if (common.enterKeyPressed(event) && !event.shiftKey) {
			this.update();
			return false;
		}else{
			return true;
		}
	};

	return Task;
});