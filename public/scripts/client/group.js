function createGroup(data){
	var self = {};

	self.name = data.name;
	self.users = ko.observableArray([]);

	ko.utils.arrayForEach(data.users, function(userData){
		self.users.push(createUser(userData));
	});

	function createUser(userData){
		return { 
			username: userData.username, 
			online: ko.observable(false),
			id: userData._id
		};
	}

	socket.on('receive_online_users', function(onlineUsers){
		ko.utils.arrayForEach(self.users(), function(user){
			if (onlineUsers.indexOf(user.id) >= 0){
				user.online(true);
			}
		});
	});

	socket.on('user_connected', function(connectedUser){
		ko.utils.arrayForEach(self.users(), function(user){
			if (user.id === connectedUser){
				user.online(true);
			}
		});
	});

	socket.on('user_disconnected', function(disconnectedUser){
		ko.utils.arrayForEach(self.users(), function(user){
			if (user.id === disconnectedUser){
				user.online(false);
			}
		});
	});

	socket.emit('request_online_users');

	return self;
}