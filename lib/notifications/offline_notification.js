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

	self.initWhenSenderIsOffline = function(sender, groupId, sockets) {
		self.senderUser = sender;
		self.onlineUsersIds = sockets.groupClients(groupId).map(function(client) {
			return client.handshake.user._id;
		});
		self.onlineUsersIds.push(self.senderUser._id);
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
		User.findExcept(self.onlineUsersIds, collaborationObject.groupId, function(err, offlineUsers) {
			if (err) {
				return handleError(err);
			}

			if (!collaborationObject.members.entireGroup) {
				offlineUsers = offlineUsers.filter(function(offlineUser) {
					return collaborationObject.members.users.some(function(conversationMemberUserId) {
						return offlineUser._id.equals(conversationMemberUserId);
					});
				});
			}

			Group.findById(collaborationObject.groupId, 'rawName', function(err, group) {
				if (err) { 
					return handleError(err);
				}

				sendEmail(offlineUsers, group, collaborationObject, message);
			});
		});
	}

	function sendEmail(offlineUsers, group, collaborationObject, message) {
		var fromName = self.senderUser.firstName + ' ' + self.senderUser.lastName,
			fromEmail = process.env.OFFLINE_NOTIFICATION_EMAIL,
			replyToEmail = "Dobly Conversation <r-" + collaborationObject._id + "@" + process.env.REPLIES_EMAIL_DOMAIN + ">", 
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