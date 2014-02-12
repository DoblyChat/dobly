define(['knockout', 'client/routing', 'client/data'], function(ko, routing, data){
	'use strict';
    
    var self = {};

	self.name = data.group.name;
	self.rawName = data.group.rawName;

	self.users = [];
	self.otherUsers = [];
	self.map = {};

	ko.utils.arrayForEach(data.group.users, function(userData){
		pushUser(userData);
	});

	self.showing = ko.observable(false);

	function pushUser(userData) {
		var user = createUser(userData);
		self.users.push(user);
		pushToOtherUsers(user);
		self.map[user.id] = user;
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
			pushUser(connectedUser);
		}

		setAsOnline(connectedUser._id);
	});

	function setAsOnline(connectedUserId) {
		if(self.map[connectedUserId]){
			self.map[connectedUserId].online(true);
		}
	}

	app.socket.on('user_disconnected', function(disconnectedUserId){
		ko.utils.arrayForEach(self.users, function(user){
			if (user.id === disconnectedUserId){
				user.online(false);
			}
		});
	});

	self.getUserFullName = function(userId){
		return self.map[userId].fullName;
	};

	app.socket.emit('request_online_users');

	routing.subscribe('group', self.showing);

	return self;
});
