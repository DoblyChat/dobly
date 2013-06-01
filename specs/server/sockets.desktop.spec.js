describe('Sockets', function(){
	describe('Desktop', function(){
			
		var desktopIo, modelMock, desktopMock;

		beforeEach(function(){
			mockery.enable({ useCleanCache: true });
			mockery.registerAllowable('../../sockets/desktop_io');
			modelMock = buildMock('../models/desktop', 'findById', 'addConversation', 'removeConversation');
			desktopIo = require('../../sockets/desktop_io');

			desktopMock = { 
				moveConversation: jasmine.createSpy(),
			};

			spyOn(console, 'error');
		});

		afterEach(function(){
			mockery.disable();
			mockery.deregisterAll();
		});

		describe('#addConversation', function(){
			it('adds a conversation', function(){
				desktopIo.addConversation({ id: 3, conversationId: 23 });
				expect(modelMock.addConversation).toHaveBeenCalled();
				expect(modelMock.addConversation.mostRecentCall.args[0]).toBe(3);
				expect(modelMock.addConversation.mostRecentCall.args[1]).toBe(23);
			});

			it('logs an error if add conversation failed', function(){
				desktopIo.addConversation({ id: 15 });
				expect(modelMock.addConversation).toHaveBeenCalled();

				var addCallback = modelMock.addConversation.getCallback();
				addCallback('add-error');
				expect(console.error).toHaveBeenCalledWith('Desktop error adding conversation', 'add-error');
			});
		});

		describe('#removeConversation', function(){
			it('removes a conversation', function(){
				desktopIo.removeConversation({ id: 'id', conversationId: 34 });
				expect(modelMock.removeConversation).toHaveBeenCalled();
				expect(modelMock.removeConversation.mostRecentCall.args[0]).toBe('id');
				expect(modelMock.removeConversation.mostRecentCall.args[1]).toBe(34);

				expect(console.error).not.toHaveBeenCalled();
			});

			it('logs an error if remove conversation failed', function(){
				desktopIo.removeConversation({ id: 15 });
				expect(modelMock.removeConversation).toHaveBeenCalled();

				var addCallback = modelMock.removeConversation.getCallback();
				addCallback('remove-error');
				expect(console.error).toHaveBeenCalledWith('Desktop error removing conversation', 'remove-error');
			});
		});

		describe('#updatesStripOrder', function(){
			
			var data;

			beforeEach(function(){
				data = { id: 'id', currentSort: { startIndex: 1, stopIndex: 2 } };
			});

			it('moves a converstion', function(){
				desktopIo.updateStripOrder(data);
				expect(modelMock.findById.mostRecentCall.args[0]).toBe('id');
				var callback = modelMock.findById.getCallback();
				callback(null, desktopMock);
				expect(desktopMock.moveConversation).toHaveBeenCalled();
				expect(desktopMock.moveConversation.mostRecentCall.args[0]).toBe(1);
				expect(desktopMock.moveConversation.mostRecentCall.args[1]).toBe(2);

				expect(console.error).not.toHaveBeenCalled();
			});

			it('logs an error if find desktop failed', function(){
				desktopIo.updateStripOrder(data);
				logsErrorIfFindFailedTest();
			});

			it('logs an error if remove conversation failed', function(){
				desktopIo.updateStripOrder(data);
				var callback = modelMock.findById.getCallback();
				callback(null, desktopMock);
				expect(desktopMock.moveConversation).toHaveBeenCalled();

				var addCallback = desktopMock.moveConversation.getCallback();
				addCallback('move-error');
				expect(console.error).toHaveBeenCalledWith('Desktop error updating strip order', 'move-error');
			});
		});

		function logsErrorIfFindFailedTest(){
			var callback = modelMock.findById.getCallback();
			callback('find error');
			expect(console.error).toHaveBeenCalledWith('Desktop update error: find', 'find error');
		}
	});
});