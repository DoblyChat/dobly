define(['knockout', 'client/socket', 'client/group', 'client/common'], 
	function(ko, socket, group, common){
	
	function Task(data){
		var collaborationObjectId = data.collaborationObjectId;

		this.id = ko.observable(data._id);	
		this.createdBy = group.getUserFullName(data.createdById);
		this.timestamp = ko.observable(data.timestamp ? data.timestamp : null);
		this.formattedTimestamp = ko.computed(function() {
            return common.formatTimestamp(this.timestamp());
        }, this);
		this.isComplete = ko.observable();
		this.completedOn = ko.observable();
		this.completedBy = ko.observable();
		this.content = ko.observable();
		this.processing = ko.observable(false);
		this.showDetails = ko.observable(false);
		this.showMenu = ko.observable(false);
		this.isEditing = ko.observable(false);
		this.isAssigning = ko.observable(false);
		this.updatedContent = ko.observable(data.content);
		this.assignedTo = ko.observable();
		this.updatedAssignedToId = ko.observable(data.assignedToId);
		this.menuHasFocus = ko.observable(false);

		this.setContent = function(content){
			this.rawContent = content;
			this.content(common.formatUserInput(content));
		};

		this.setAssignedTo = function(assignedToId){
			if(assignedToId){
				this.assignedToId = assignedToId;
				this.assignedTo(group.getUserFullName(this.assignedToId));
			}	
		};

		this.updateCompleteValues(data);
		this.setContent(data.content);
		this.setAssignedTo(data.assignedToId);

		this.getNotificationText = function(){
			return this.createdBy + ' has added a new task: ' + this.content();
		};

		this.toggleComplete = function(){
			this.processing(true);

			socket.emit('toggle_complete_task', {
				id: this.id(),
				collaborationObjectId: collaborationObjectId,
				isComplete: !this.isComplete()
			}, function(completeData){
				this.updateCompleteValues(completeData);
				this.processing(false);
			});
			
			return true;
		};

		this.toggleDetails = function(){
			this.showDetails(!this.showDetails());
		};

		this.showPopupMenu = function(){
			this.showMenu(true);
			this.menuHasFocus(true);
		};

		this.startEdit = function(){
			this.showMenu(false);
			this.isEditing(true);
		};

		this.startAssign = function(){
			this.showMenu(false);
			this.isAssigning(true);
		};

		this.isUpdating = ko.computed(function(){
			return this.isEditing() || this.isAssigning();
		}, this);

		function cancelEdit(){
			this.isEditing(false);
			this.updatedContent(this.rawContent);
		}

		function cancelAssign(){
			this.isAssigning(false);
			this.updatedAssignedToId(this.assignedToId);
		}

		this.cancel = function(){
			if(this.isEditing()){
				cancelEdit();
			}else{
				cancelAssign();
			}
		};

		function contentHasBeenUpdated(){
			return this.rawContent !== this.updatedContent();
		}

		function updateContent(){
			if(contentHasBeenUpdated()){
				socket.emit('update_task_content', { 
					id: this.id(), 
					content: this.updatedContent(),
					collaborationObjectId: collaborationObjectId
				});

				this.setContent(this.updatedContent());	
			}

			this.isEditing(false);
		}

		function assignedToHasBeenUpdated(){
			return this.assignedToId !== this.updatedAssignedToId();
		}

		function updateAssignedTo(){
			if(assignedToHasBeenUpdated()){
				socket.emit('assign_task', {
					id: this.id(),
					assignedToId: this.updatedAssignedToId(),
					collaborationObjectId: collaborationObjectId
				});

				this.setAssignedTo(this.updatedAssignedToId());
			}

			this.isAssigning(false);
		}

		this.update = function(){
			if(this.isEditing()){
				updateContent();
			}else{
				updateAssignedTo();
			}
		};

		this.updateKeyPress = function(obj, event){
			if (common.enterKeyPressed(event) && !event.shiftKey) {
				this.update();
				return false;
			}else{
				return true;
			}
		};

		this.menuHasFocus.subscribe(function(focus){
			if(!focus){
				this.showMenu(false);
			}
		});
	}

	Task.prototype.updateCompleteValues = function(data){
		this.completedOn(data.completedOn ? common.formatTimestamp(data.completedOn) : null);
		this.completedBy(data.completedById ? group.getUserFullName(data.completedById) : null);
		this.isComplete(data.isComplete);
	};

	return Task;
});