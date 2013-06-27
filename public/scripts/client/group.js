function createGroup(data){
	var self = {};

	self.name = data.name;

	self.users = [];
	self.otherUsers = [];

	ko.utils.arrayForEach(data.users, function(userData){
		var user = createUser(userData);
		self.users.push(user);

		if(user.id !== app.user._id){
			self.otherUsers.push(user);
		}
	});

	function createUser(userData){
		return { 
			username: userData.username, 
			online: ko.observable(false),
			id: userData._id
		};
	}

	app.socket.on('receive_online_users', function(onlineUsers){
		ko.utils.arrayForEach(self.users, function(user){
			if (onlineUsers.indexOf(user.id) >= 0){
				user.online(true);
			}
		});
	});

	app.socket.on('user_connected', function(connectedUser){
		ko.utils.arrayForEach(self.users, function(user){
			if (user.id === connectedUser){
				user.online(true);
			}
		});
	});

	app.socket.on('user_disconnected', function(disconnectedUser){
		ko.utils.arrayForEach(self.users, function(user){
			if (user.id === disconnectedUser){
				user.online(false);
			}
		});
	});

	app.socket.emit('request_online_users');

	return self;
}