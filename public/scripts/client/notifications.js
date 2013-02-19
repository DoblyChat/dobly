Modernizr.addTest('notifications', function(){ 
	return !!(window.webkitNotifications || window.mozNotifications || window.oNotifications || window.msNotifications || window.notifications);
});

function createNotifier(){
	var self = {};

	var notifications = window.webkitNotifications;

	self.setup = function() {
		if(Modernizr.notifications){
			if(notifications.checkPermission() !== 0){
				notifications.requestPermission();
			}
		}
	}

	self.showDeskopNotification = function(conversation, content){
		if(Modernizr.notifications && !app.inFocus){
			if(notifications.checkPermission() === 0){
				var notif = notifications.createNotification(
					'http://files.softicons.com/download/system-icons/onceagain-icons-by-delacro/png/48/Message.png', 
					conversation.topic(), content);

				notif.onclick = function(){
					window.focus();
					conversation.activate();
					conversation.hasFocus(true);
				}

				notif.show();

				setTimeout(function(){
					notif.cancel();
				}, '5000');
			}
		}
	}

	self.updateTitle = function(unreadCount){
		var title;
		if(unreadCount > 0){
			title = '(' + unreadCount + ') unread - FluidTalk';
		}else{
			title = 'FluidTalk';
		}
		document.title = title;
	}

	return self;
}