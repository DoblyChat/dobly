function createNewConversation(navigation) {
	var self = {};

	self.topic = ko.observable();
    self.forEntireGroup = ko.observable(false);
    self.selectedMembers = ko.observableArray([]);

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
        var data = { topic: self.topic(), forEntireGroup: self.forEntireGroup(), selectedMembers: self.selectedMembers() }
        app.socket.emit('create_conversation', data);
        clear();
        navigation.desktop();  
    }

    self.cancel = function() {
        clear();
        navigation.desktop();    
    }

    function clear(){
        self.topic('');
        self.forEntireGroup(false);
        self.selectedMembers([]);
    }

	return self;
}