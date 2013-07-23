describe('Sockets', function(){
	describe('Conversation - integration', function(){
		var conversationIo, socketMock,
			Conversation, Message, 
			Unread, User;

		beforeEach(function(){
			conversationIo = require('../../sockets/conversation_io'),
			Conversation = require('../../models/conversation'),
			Message = require('../../models/message'),
			Unread = require('../../models/unread_marker'),
			User = require('../../models/user');

			socketMock = {
				emit: jasmine.createSpy(),
				broadcastToGroup: jasmine.createSpy(),
				broadcastToConversationMembers: jasmine.createSpy(),
				handshake: {
					user: {
						name: 'socket-convo-test',
						groupId: new mongo.Types.ObjectId(),
						_id: new mongo.Types.ObjectId(),
					},
				},
			};
		});

		describe('#createConversation', function(){
			var topic = 'socket-conversation-test';

			afterEach(function(done){
				Conversation.remove({ topic: topic }, done);
			});

			it('creates a conversation', function(done){
				var data = { 
					topic: topic,
					forEntireGroup: true,
					selectedMembers: [ new mongo.Types.ObjectId(), new mongo.Types.ObjectId() ]
				};

				socketMock.broadcastToConversationMembers = function(event, conversationId, conversation){
					expect(conversation.topic).toBe(topic);
					expect(conversation.createdById).toBe(socketMock.handshake.user._id);
					expect(conversation._doc.createdBy).toBe(socketMock.handshake.user.name);
					expect(conversation.groupId.toString()).toBe(socketMock.handshake.user.groupId.toString());
					expect(conversation._id).not.toBeNull();
					expect(conversation._id).toEqual(conversationId);
					expect(conversation.members.entireGroup).toBe(true);
					expect(conversation.members.users.length).toBe(2);
					expect(conversation.members.users).toContain(data.selectedMembers[0]);
					expect(conversation.members.users).toContain(data.selectedMembers[1]);

					done();
				};

				var sockets = { groupClients: function(){ return []; } };
				conversationIo.createConversation(socketMock, sockets, data);
			});
		});

		describe('#sendMessage', function(){
			var content = 'socket-send-message-test';
			var name = 'user-send-message-test';
			var email = 'send.message@test.com';
			var userId, conversationId;

			beforeEach(function(done){
				Conversation.create({
					topic: 'sendMessage test',
					groupId: socketMock.handshake.user.groupId,
					createdById: socketMock.handshake.user._id,
					members: {
						entireGroup: true
					}
				}, function(err, conversation){
					conversationId = conversation._id;

					User.create({ 
						name: name,
						email: email,
						groupId: socketMock.handshake.user.groupId,
						password: 'pass'
					}, function(err, user){
						userId = user._id;
						done(err);
					});
				});
			});

			afterEach(function(done){
				Conversation.findByIdAndRemove(conversationId, function(){
					Message.remove({ content: content }, function(){
						User.remove({ email: email }, function(){
							Unread.remove({ userId: userId }, done);
						});
					});	
				})
			});

			it('sends a message', function(done){
				var data = {
					content: content,
					timestamp: new Date(),
					conversationId: conversationId,
				};

				var notification = jasmine.createSpyObj('notification', ['notifyOfflineUsers']);

				conversationIo.sendMessage(socketMock, notification, data, function(message){
					expect(message.content).toBe(content);
					expect(message.createdBy).toBe(socketMock.handshake.user.name);
					expect(message.conversationId).toEqual(data.conversationId);
					expect(message.timestamp).toEqual(data.timestamp);
					expect(message._id).not.toBeNull();

					Message.count({ content: content }, function(err, count){
						expect(err).toBeNull();
						expect(count).toBe(1);

						Unread.find({ userId: userId }, function(err, markers){
							expect(err).toBeNull();
							expect(markers.length).toBe(1);
							expect(markers[0].conversationId).toEqual(data.conversationId);
							expect(markers[0].count).toBe(1);
							done();
						});
					});
				});
			});
		});

		describe('#markAsRead', function(){
			var conversationId, userId;

			beforeEach(function(done){	
				conversationId = new mongo.Types.ObjectId();
				Unread.create({ userId: socketMock.handshake.user._id, conversationId: conversationId, count: 1 }, done);
			});

			afterEach(function(done){
				Unread.remove({ conversationId: conversationId }, done);
			});

			it('removes unread markers', function(done){
				var checkMatched = false;

				runs(function(){
					conversationIo.markAsRead(socketMock, conversationId);
				});
				
				waitsFor(function(){
					Unread.count({ conversationId: conversationId }, function(err, count){
						checkMatched = count === 0;
					});

					return checkMatched;

				}, 'Waiting for unread marker to have been cleared', 2000);

				runs(function(){
					done();
				});
			});
		});

		describe('#updateTopic', function(){
			var conversationId;

			beforeEach(function(done){
				Conversation.create({ 
                    topic: 'socket-conversation-orig',
					createdById: socketMock.handshake.user._id,
					groupId: socketMock.handshake.user.groupId,
                }, 
                function(err, conversation){
                    conversationId = conversation._id;
					done(err); 
                });
        	});

			afterEach(function(done){
				Conversation.findByIdAndRemove(conversationId, done);
			});

			it('updates conversation topic', function(done){
				var checkMatched = false,
					newTopic = 'new socket-io topic';

				runs(function(){
					conversationIo.updateTopic({ conversationId: conversationId, newTopic: 'new socket-io topic'});
				});
				
				waitsFor(function(){
					Conversation.findById(conversationId, function(err, conversation){
						checkMatched = conversation.topic === newTopic;
					});

					return checkMatched;

				}, 'Waiting for topic to be updated', 2000);

				runs(function(){
					done();
				});
			});
		});

		describe('#readMessages', function(){
			var conversationId;

			beforeEach(function(done){
				Conversation.create({ 
                    topic: 'socket-conversation',
					createdById: socketMock.handshake.user._id,
					groupId: socketMock.handshake.user.groupId,
                }, function(err, conversation){
					conversationId = conversation._id;

					Message.create({
						content: 'socket-conversation-test',
						createdBy: 'socket-test',
						timestamp: new Date(),
						conversationId: conversationId
					}, done);
				})
			});

			afterEach(function(done){
				Conversation.findByIdAndRemove(conversationId, function(){
					Message.remove({ conversationId: conversationId }, done);
				});
			});

			it('returns messages', function(done){
				var confirm = function(messages){
					expect(messages.length).toBe(1);
					done();
				};

				conversationIo.readMessages({ conversationId: conversationId, page: 0 }, confirm);
			});

			it('pages messages', function(done){
				var confirm = function(messages){
					expect(messages.length).toBe(0);
					done();
				};

				conversationIo.readMessages({ conversationId: conversationId, page: 1 }, confirm);
			});
		});
	});
});