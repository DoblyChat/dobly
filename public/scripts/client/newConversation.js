function createNewConversation(navigation) {
	var self = {};

	self.topic = ko.observable();

	self.setup = function() {
    $('#new-convo textarea').placeholder();
    common.delayedFocus('#new-convo textarea');
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
    app.socket.emit('create_conversation', { topic: self.topic() });
    self.topic('');
    navigation.desktop();  
  }

  self.cancel = function() {
    self.topic('');
    navigation.desktop();    
  }

	return self;
}