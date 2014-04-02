define(function(){
	
	var self = {},
		appTitle = document.title,
		titleBlinkTimer;

	self.update = function(unreadCount){
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
});