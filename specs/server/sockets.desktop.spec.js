describe('Sockets', function(){
	describe('Desktop', function(){
			
		var desktopIo, modelMock, desktopMock;

		beforeEach(function(){
			mockery.enable({ useCleanCache: true });
			mockery.registerAllowable('../../sockets/desktop_io');
			modelMock = buildMock('../models/desktop', 'findById');
			desktopIo = require('../../sockets/desktop_io');

			desktopMock = { 
				isModified: jasmine.createSpy(),
				removeConversation: jasmine.createSpy(),
				addConversation: jasmine.createSpy(),
				moveConversation: jasmine.createSpy(),
			};
		});

		afterEach(function(){
			mockery.disable();
			mockery.deregisterAll();
		});

		describe('#add', function(){
			it('adds a conversation', function(){
				desktopIo.add({ id: 3, conversationId: 23 });
				expect(modelMock.findById.mostRecentCall.args[0]).toBe(3);
				var callback = modelMock.findById.getCallback();
				callback(null, desktopMock);
				expect(desktopMock.addConversation).toHaveBeenCalled();
				expect(desktopMock.addConversation.mostRecentCall.args[0]).toBe(23);
			});

			it('logs an error if find desktop failed', function(){
				desktopIo.add({ id: 12 });
				logsErrorIfFindFailedTest();
			});

			it('logs an error if add failed', function(){
				desktopIo.add({ id: 15 });
				var callback = modelMock.findById.getCallback();
				callback(null, desktopMock);
				expect(desktopMock.addConversation).toHaveBeenCalled();

				spyOn(console, 'error');

				var addCallback = desktopMock.addConversation.getCallback();
				addCallback('add-error');
				expect(console.error).toHaveBeenCalledWith('Desktop error adding conversation', 'add-error');
			});
		});

		describe('#remove', function(){
			it('removes a conversation', function(){
				desktopIo.remove({ id: 'id', conversationId: 34 });
				expect(modelMock.findById.mostRecentCall.args[0]).toBe('id');
				var callback = modelMock.findById.getCallback();
				callback(null, desktopMock);
				expect(desktopMock.removeConversation).toHaveBeenCalled();
				expect(desktopMock.removeConversation.mostRecentCall.args[0]).toBe(34);
			});

			it('logs an error if find desktop failed', function(){
				desktopIo.remove({ id: 12 });
				logsErrorIfFindFailedTest();
			});

			it('logs an error if remove conversation failed', function(){
				desktopIo.remove({ id: 15 });
				var callback = modelMock.findById.getCallback();
				callback(null, desktopMock);
				expect(desktopMock.removeConversation).toHaveBeenCalled();

				spyOn(console, 'error');

				var addCallback = desktopMock.removeConversation.getCallback();
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

				spyOn(console, 'error');

				var addCallback = desktopMock.moveConversation.getCallback();
				addCallback('move-error');
				expect(console.error).toHaveBeenCalledWith('Desktop error updating strip order', 'move-error');
			});
		});

		function logsErrorIfFindFailedTest(){
			var callback = modelMock.findById.getCallback();

			spyOn(console, 'error');
			callback('find error');
			expect(console.error).toHaveBeenCalledWith('Desktop update error: find', 'find error');
		}
	});
});