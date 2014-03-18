define(['client/conversation', 'client/task-list', 'client/message', 'client/task'], 
	function(Conversation, TaskList, Message, Task){
		return {
			collaborationObject: function(data, group){
				return data.type === 'C' ? new Conversation(data) : new TaskList(data, group);
			},
			item: function(collaborationObjectType, data){
				return collaborationObjectType === 'C' ? new Message(data, true) : new Task(data);
			}
		};
	}
);