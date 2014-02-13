define(['client/socket'], function(socket){
	'use strict';
    
    return function createTimeout(global) {
		var self = {};
		var pingInterval = 5000;
		self.lastPong = new Date();

		socket.on('reconnecting', function(delay, attempt) {
			if (attempt === socket.maxReconnects) {
				timeout();
			}
		});

		function timeout(){
			global.location.href = "http://" + global.location.host + "/timeout";
		}

		self.startPing = function() {
			setInterval(self.emitPing, pingInterval);

			socket.on('timeout', function() {
				timeout();
			});
		};

		self.emitPing = function() {
			var now = new Date();
			var elapsedTimeSinceLastPong = now.getTime() - self.lastPong.getTime();
			showConnectivityIssuesIf(elapsedTimeSinceLastPong > pingInterval * 3);

			socket.emit('ping');
		};

		socket.on('pong', function() {
			self.lastPong = new Date();
		});

		function showConnectivityIssuesIf(showOrHide) {
			$('#connectivityIssues').toggle(showOrHide);
		}

		return self;
	};
});

