module.exports = (function() {
	var wrapper = require('mandrill_wrapper'),
		self = {};

	self.notifyOfflineUsers = function(socket, sockets, message) {

		var senderUser = socket.handshake.user;
		var onlineUsers = sockets.groupClients(senderUser.groupId);

		Conversation.findById(message.conversationId, function(err, conversation) {
			if(err) {
				console.error('Error reading conversation to notify offline conversation members', err);
			} else {
				if (conversation.members.entireGroup) {
					User.findExcept(senderUser._id, conversation.groupId, function(err, users) {
						var userIds = users.map(function(user) {
							return user._id;
						});
						notifyOfflineUsersHelper(senderUser, userIds, onlineUsers);	
					});
				}
				else {
					notifyOfflineUsersHelper(senderUser, conversation.members.users, onlineUsers);
				}				
			}
		});
	};

	function notifyOfflineUsersHelper(senderUser, conversationUserIds, onlineUsers) {
		var offlineUsers = conversationUserIds.filter(function(conversationUserId) {
			return !onlineUsers.some(function(onlineUser) {
				return onlineUser.handshake.user._id === conversationUserId;
			});
		});

		var fromName = senderUser.name,
			fromEmail = "notification@dobly.com",
			replyToEmail = "no-reply@dobly.com", 
			subject = conversation.topic, 
			text = message.content, 
			tags = [ "offline-messages" ]);

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