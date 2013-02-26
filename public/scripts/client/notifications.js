Modernizr.addTest('notifications', function(){ 
	return !!(window.webkitNotifications || window.mozNotifications || window.oNotifications || window.msNotifications || window.notifications);
});

function createNotifier(desktop){
	var self = {};

	var ALLOWED = 0;
	var NOT_SET = 1;

	var notifications = window.webkitNotifications;
	var titleBlinkTimer;

	self.needsToAskForPermission = function(){
		return Modernizr.notifications && permissionsNotSet();
	}

	function permissionsNotSet(){
		// not set = 1
		// denied = 2
		// allowed = 0
		return notifications.checkPermission() === NOT_SET;
	}

	self.setup = function() {
		if(Modernizr.notifications && permissionsNotSet()){
			notifications.requestPermission();
		}
	}

	self.showDeskopNotification = function(conversation, content){
		if(!app.inFocus){
			if(Modernizr.notifications){
				if(notifications.checkPermission() === ALLOWED){
					var notif = notifications.createNotification(
						'http://files.softicons.com/download/system-icons/onceagain-icons-by-delacro/png/48/Message.png', 
						conversation.topic(), content);

					notif.onclick = function(){
						window.focus();
						desktop.activate(conversation);
						conversation.hasFocus(true);
					}

					notif.show();

					setTimeout(function(){
						notif.cancel();
					}, '5000');
				}
			}
			playSound();
		}
	}

	function playSound(){
		document.getElementById('notification-sound').play();
	}

	self.updateTitle = function(unreadCount){
		var appTitle = 'FluidTalk';
		clearInterval(titleBlinkTimer);

		if(unreadCount > 0){
			titleBlinkTimer = setInterval(blink, '1500');
		}else{
			document.title = appTitle;
		}

		function blink(){
			var currentTitle = document.title;
			if(currentTitle === appTitle){
				document.title = '(' + unreadCount + ') unread - FluidTalk';
			}else{
				document.title = appTitle;
			}
		}
	}

	return self;
}