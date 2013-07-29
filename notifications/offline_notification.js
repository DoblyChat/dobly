module.exports = (function() {
	var wrapper = require('./mandrill_wrapper'),
		Conversation = require('../models/conversation'),
		User = require('../models/user'),
		Group = require('../models/group'),
		self = {};

	self.senderUser = null;
	self.onlineUsersIds = null;

	self.init = function(socket, sockets) {
		self.senderUser = socket.handshake.user;
		self.onlineUsersIds = sockets.groupClients(self.senderUser.groupId).map(function(client) {
			return client.handshake.user._id;
		});
	};

	self.notify = function(message) {
		Conversation.findById(message.conversationId, function(err, conversation) {
			if(err) {
				console.error('Error reading conversation to notify offline users', err);
			} else {
				getOfflineUsersAndNotify(conversation, message);
			}
		});
	};

	function getOfflineUsersAndNotify(conversation, message) {
		User.findExcept(self.onlineUsersIds, self.senderUser.groupId, function(err, offlineUsers) {
			if (!conversation.members.entireGroup) {
				offlineUsers = offlineUsers.filter(function(offlineUser) {
					return conversation.members.users.some(function(conversationMemberUserId) {
						return offlineUser._id.toString() === conversationMemberUserId.toString();
					});
				});
			}

			Group.findById(self.senderUser.groupId, 'rawName', function(err, group) {
				sendEmail(offlineUsers, group, conversation, message);
			});
		});
	}

	function sendEmail(offlineUsers, group, conversation, message) {
		var fromName = self.senderUser.name,
			fromEmail = "notification@dobly.com",
			replyToEmail = "no-reply@dobly.com", 
			subject = "[Dobly - " + group.rawName + "] " + conversation.topic, 
			text = message.content, 
			tags = [ "offline-messages" ];

		var to = offlineUsers.map(function(offlineUser) {
			return { 
				"email": offlineUser.email,
				"name": offlineUser.name
			};
		});

		wrapper.send(fromName, fromEmail, to, replyToEmail, subject, text, tags);
	}

	return self;
})();