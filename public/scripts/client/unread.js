define(['knockout', 'client/title', 'client/collaboration-object.db'], function(ko, title, db){
	var self = {};

	self.hasUnread = ko.observable(false);

	function calculateUnread(){
		var unread = 0;
        
        db.getCollaborationObjects().forEach(function(collaborationObject){
            unread += collaborationObject.unreadCounter();
        });

        return unread;
	}

	self.update = function(){
		var unread = calculateUnread();
		title.update(unread);
		self.hasUnread(unread > 0);
	};

	self.subscribeToMarkAsRead = function(collaborationObject){
		collaborationObject.subscribeToMarkAsRead(self.update);
	};

	function init(){
		db.getCollaborationObjects().forEach(function(collaborationObject){
			self.subscribeToMarkAsRead(collaborationObject);
        });

        self.update();
	}

	init();

	return self;
});