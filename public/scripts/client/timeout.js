function createTimeout(maxReconnects, global) {
	var self = {};

	app.socket.on('reconnecting', function(delay, attempt) {
		if (attempt === maxReconnects) {
			timeout();
		}
	});

	function timeout(){
		global.location.href = "http://" + global.location.host + "/timeout";
	}

	self.startPing = function() {
		setInterval(self.emitPing, 5000);

		app.socket.on('timeout', function() {
			timeout();
		});
	};

	self.emitPing = function() {
		app.socket.emit('ping');
	};

	return self;
}