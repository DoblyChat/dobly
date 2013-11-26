describe('Sockets', function(){
	'use strict';

    describe('Conversation', function(){
		var conversationIo, messageMock,
			collaborationObjectIo;

		beforeEach(function(){
			mockery.enable({ useCleanCache: true });
			mockery.registerAllowable('../../lib/sockets/conversation_io');

			collaborationObjectIo = buildMock('./base_collaboration_object_io', 'sendItem');
			messageMock = buildMock('../models/message', 'create', 'readMessagesByPage');

			conversationIo = require('../../lib/sockets/conversation_io');
		});

		it('saves message', function(){
			var socket = {
					handshake: {
						user: {
							firstName: 'usr'
						}
					}
				},
				sockets = { sock: 'ets' },
				data = { da: 'ta' },
				confirm = jasmine.createSpy();

			conversationIo.sendMessage(socket, sockets, data, confirm);
			expect(collaborationObjectIo.sendItem).toHaveBeenCalled();
			var sendArgs = collaborationObjectIo.sendItem.mostRecentCall.args;
			expect(sendArgs[0]).toBe(socket);
			expect(sendArgs[1]).toBe(sockets);
			expect(sendArgs[2]).toBe(data);
			expect(sendArgs[4]).toBe(confirm);

			var callback = jasmine.createSpy();
			sendArgs[3](callback);

			expect(messageMock.create).toHaveBeenCalled();
			
			var messageData = messageMock.create.mostRecentCall.args[0];
			expect(messageData.content).toBe(data.content);
			expect(messageData.createdById).toBe(socket.handshake.user._id);
			expect(messageData.timestamp).toBeEquivalentDates(Date.now());
			expect(messageData.collaborationObjectId).toBe(data.collaborationObjectId);

			expect(messageMock.create.getCallback()).toBe(callback);
		});				
		

		describe('#readMessages', function(){
			it('reads paged messages', function(){
				var data = { collaborationObjectId: 'convo-id', page: 3 };
				var confirm = jasmine.createSpy('confirm');

				conversationIo.readMessages(data, confirm);
				expect(messageMock.readMessagesByPage).toHaveBeenCalled();

				var args = messageMock.readMessagesByPage.mostRecentCall.args;
				expect(args[0]).toBe(data.collaborationObjectId);
				expect(args[1]).toBe(data.page);

				var callback = messageMock.readMessagesByPage.getCallback();
				spyOn(console, 'error');

				var messages = [{ dummy: 'test' }];
				callback(null, messages);
				expect(confirm).toHaveBeenCalledWith(messages);
				expect(console.error).not.toHaveBeenCalled();
				callback('my error', null);
				expect(console.error).toHaveBeenCalledWith('Error loading more messages', 'my error');
			});
		});
	});
});