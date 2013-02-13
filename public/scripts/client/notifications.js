Modernizr.addTest('notifications', function(){ 
	return !!(window.webkitNotifications || window.mozNotifications || window.oNotifications || window.msNotifications || window.notifications);
});

function createNotifier(){
	var self = {};

	var notifications = window.webkitNotifications;

	// consider adding a function that on load we ask the user for permission
	
	self.setup = function() {
		if(Modernizr.notifications){
			if(notifications.checkPermission() !== 0){
				notifications.requestPermission();
			}
		}
	}

	self.show = function(title, content){
		if(Modernizr.notifications){
			if(notifications.checkPermission() === 0){
				var notif = notifications.createNotification('icon.png', title, content);
				notif.show();
			}
		}
	}

	return self;
}