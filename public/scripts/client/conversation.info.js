function createConversationInfo(group){
	var self = {};

	self.topic = ko.observable();
    self.createdBy = ko.observable();
    self.timestamp = ko.observable();
    self.forEntireGroup = ko.observable();
    self.users = ko.observableArray([])

    self.set = function(conversation){
    	self.topic(conversation.topic());
    	self.createdBy(conversation.createdBy());
    	self.timestamp(conversation.timestamp);
    	self.forEntireGroup(conversation.forEntireGroup);
    	self.users([]);
    	
    	var users = group.users();

    	for(var i = 0; i < conversation.users.length; i++){
    		for(var j = 0; j < users.length; j++){
    			if(conversation.users[i] === users[j].id){
    				self.users.push(users[j].username);
    				break;
    			}
    		}
    	}
    };

    return self;
}