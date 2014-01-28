define(function(){
	'use strict';
    
    var canUseNotifications = !!(window.webkitNotifications || window.mozNotifications || window.oNotifications || window.msNotifications || window.notifications);		

	return function (desktop){
		var self = {};

		var ALLOWED = 0;

		var notifications = window.webkitNotifications;
		var titleBlinkTimer;

		var appTitle = document.title;

		self.showDesktopNotification = function(collaborationObject, content){
			if(!app.inFocus){
				if(canUseNotifications){
					if(notifications.checkPermission() === ALLOWED){
						var notif = notifications.createNotification(
							'/images/logo.transparent.png', 
							collaborationObject.topic(), content);

						notif.onclick = function(){
							window.focus();
							desktop.activate(collaborationObject);
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

		self.updateTitle = function(unreadCount){
			clearInterval(titleBlinkTimer);

			if(unreadCount > 0){
				titleBlinkTimer = setInterval(blink, '1500');
			}else{
				document.title = appTitle;
			}

			function blink(){
				var currentTitle = document.title;
				if(currentTitle === appTitle){
					document.title = '(' + unreadCount + ') unread - ' + appTitle;
				}else{
					document.title = appTitle;
				}
			}
		};

		return self;
	};
});

