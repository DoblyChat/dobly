define(['jquery', 'knockout'], function($, ko){
	'use strict';
    
    return function(data){
		var self = {};

		self.name = data.name;
		self.rawName = data.rawName;

		self.users = [];
		self.otherUsers = [];

		ko.utils.arrayForEach(data.users, function(userData){
			pushUser(userData);
		});

		function pushUser(userData) {
			var user = createUser(userData);
			self.users.push(user);
			pushToOtherUsers(user);
		}

		function createUser(userData){
			return { 
				fullName: userData.firstName + ' ' + userData.lastName, 
				online: ko.observable(false),
				id: userData._id
			};
		}

		function pushToOtherUsers(user) {
			if(user.id !== app.user._id){
				self.otherUsers.push(user);
			}
		}

		app.socket.on('receive_online_users', function(onlineUsers){
			ko.utils.arrayForEach(self.users, function(user){
				if (onlineUsers.indexOf(user.id) >= 0){
					user.online(true);
				}
			});
		});

		app.socket.on('user_connected', function(connectedUser){
			function isExistingUser(user) {
				return user.id === connectedUser._id;
			}

			if (!self.users.some(isExistingUser)) {
				app.groupUsers[connectedUser._id] = connectedUser.firstName + ' ' + connectedUser.lastName;
				pushUser(connectedUser);
			}

			setAsOnline(connectedUser._id);
		});

		function setAsOnline(connectedUserId) {
			ko.utils.arrayForEach(self.users, function(user){
				if (user.id === connectedUserId){
					user.online(true);
				}
			});
		}

		app.socket.on('user_disconnected', function(disconnectedUserId){
			ko.utils.arrayForEach(self.users, function(user){
				if (user.id === disconnectedUserId){
					user.online(false);
				}
			});
		});

		app.socket.emit('request_online_users');

		return self;
	};
});
