function createNewConversation(navigation) {
	var self = {};

	self.topic = ko.observable();

	self.focusTopic = function() {
    setTimeout(function () { $('#new-convo textarea').focus(); }, 400);
  };

	self.createOnEnter = function(data, event) {
	  if (common.enterKeyPressed(event) && self.topic().length > 0) {
	    create();
	    return false;
	  }
	  else {
	    return true;
	  }
	};

  self.createOnClick = function() {
    if (self.topic().length > 0) {
      create();
    }
  }

  function create() {
    socket.emit('create_conversation', { topic: self.topic() });
    self.topic('');
    navigation.desktop();  
  }

  self.cancel = function() {
    self.topic('');
    navigation.desktop();    
  }

	return self;
}