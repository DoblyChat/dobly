define(['client/conversation', 'client/task-list', 'client/message', 'client/task'], 
	function(createConversation, createTaskList, createMessage, createTask){
		return {
			collaborationObject: function(data, group){
				return data.type === 'C' ? createConversation(data) : createTaskList(data, group);
			},
			item: function(collaborationObjectType, data){
				return collaborationObjectType === 'C' ? createMessage(data, true) : createTask(data);
			}
		};
	}
);