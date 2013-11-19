'use strict';

module.exports = (function() {
	var wrapper = require('./mandrill_wrapper'),
		CollaborationObject = require('../models/collaboration_object'),
		User = require('../models/user'),
		Group = require('../models/group'),
		log = require('../common/log'),
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
		CollaborationObject.findById(message.collaborationObjectId, function(err, collaborationObject) {
			if (err) {
				return handleError(err);
			}
			
			getOfflineUsersAndNotify(collaborationObject, message);
		});
	};

	function getOfflineUsersAndNotify(collaborationObject, message) {
		User.findExcept(self.onlineUsersIds, self.senderUser.groupId, function(err, offlineUsers) {
			if (err) {
				return handleError(err);
			}

			if (!collaborationObject.members.entireGroup) {
				offlineUsers = offlineUsers.filter(function(offlineUser) {
					return collaborationObject.members.users.some(function(conversationMemberUserId) {
						return offlineUser._id.toString() === conversationMemberUserId.toString();
					});
				});
			}

			Group.findById(self.senderUser.groupId, 'rawName', function(err, group) {
				if (err) { 
					return handleError(err);
				}

				sendEmail(offlineUsers, group, collaborationObject, message);
			});
		});
	}

	function sendEmail(offlineUsers, group, collaborationObject, message) {
		var fromName = self.senderUser.firstName + ' ' + self.senderUser.lastName,
			fromEmail = "notification@dobly.com",
			replyToEmail = "no-reply@dobly.com", 
			subject = "[Dobly - " + group.rawName + "] " + collaborationObject.topic, 
			text = message.content, 
			tags = [ "offline-messages" ];

		var to = offlineUsers.map(function(offlineUser) {
			return { 
				"email": offlineUser.email,
				"name": offlineUser.firstName + " " + offlineUser.lastName
			};
		});

		wrapper.send(fromName, fromEmail, to, replyToEmail, subject, text, tags);
	}

	function handleError(err) {
		log.error(err);
	}

	return self;
})();