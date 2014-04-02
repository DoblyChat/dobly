define(function(){
	'use strict';
    
    var notifications = window.webkitNotifications || window.mozNotifications || window.oNotifications || window.msNotifications || window.notifications,
    	canUseNotifications = !!(notifications),
		self = {},
		ALLOWED = 0,
		notifications = window.webkitNotifications;

	self.showDesktopNotification = function(collaborationObject, content){
		if(!app.inFocus){
			if(canUseNotifications){
				if(notifications.checkPermission() === ALLOWED){
					var notif = notifications.createNotification(
						'/images/logo.transparent.png', 
						collaborationObject.topic(), content);

					notif.onclick = function(){
						window.focus();
						app.desktop.activate(collaborationObject);
						collaborationObject.hasFocus(true);
					};

					notif.show();

					setTimeout(function(){
						notif.cancel();
					}, '5000');
				}
			}
			playSound();
		}
	};

	function playSound(){
		document.getElementById('notification-sound').play();
	}

	return self;
});

