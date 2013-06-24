function createConversationInfo(){
	var self = {};

    self.conversation = ko.observable();

    self.set = function(conversation){
      self.conversation(conversation);
    };

    return self;
}