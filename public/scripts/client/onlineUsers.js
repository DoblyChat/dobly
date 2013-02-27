function createOnlineUsersModule(){
	var self = {};

	self.list = ko.observableArray([]);

	self.request = function(){
		socket.emit('request_online_users');
	}

	socket.on('receive_online_users', function(users){
		self.list(users);
	});

	socket.on('user_connected', function(connectedUser){
		if(self.list.indexOf(connectedUser) < 0){
			self.list.push(connectedUser);
		}
	});

	socket.on('user_disconnected', function(disconnectedUser){
		self.list.remove(disconnectedUser);
	});

	return self;
}