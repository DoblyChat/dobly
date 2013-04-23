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
				save: jasmine.createSpy(),
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
				expect(desktopMock.addConversation).toHaveBeenCalledWith(23);
			});

			it('logs an error if find desktop failed', function(){
				desktopIo.add({ id: 12 });
				logsErrorIfFindFailedTest();
			});

			it('saves if conversations modified', function(){
				desktopIo.add({ id: 1, conversationId: 2 });
				saveTest();
			});

			it('does not save if conversations not modified', function(){
				desktopIo.add({ id: 1, conversationId: 2 });
				notSaveTest();
			});
		});

		describe('#remove', function(){
			it('removes a conversation', function(){
				desktopIo.remove({ id: 'id', conversationId: 34 });
				expect(modelMock.findById.mostRecentCall.args[0]).toBe('id');
				var callback = modelMock.findById.getCallback();
				callback(null, desktopMock);
				expect(desktopMock.removeConversation).toHaveBeenCalledWith(34);
			});

			it('logs an error if find desktop failed', function(){
				desktopIo.remove({ id: 12 });
				logsErrorIfFindFailedTest();
			});

			it('saves if conversations modified', function(){
				desktopIo.remove({ id: 1, conversationId: 2 });
				saveTest();
			});

			it('does not save if conversations not modified', function(){
				desktopIo.remove({ id: 1, conversationId: 2 });
				notSaveTest();
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
				expect(desktopMock.moveConversation).toHaveBeenCalledWith(1, 2);
			});

			it('logs an error if find desktop failed', function(){
				desktopIo.updateStripOrder(data);
				logsErrorIfFindFailedTest();
			});

			it('saves if conversations modified', function(){
				desktopIo.updateStripOrder(data);
				saveTest();
			});

			it('does not save if conversations not modified', function(){
				desktopIo.updateStripOrder(data);
				notSaveTest();
			});
		});

		function logsErrorIfFindFailedTest(){
			var callback = modelMock.findById.getCallback();

			spyOn(console, 'error');
			callback('find error');
			expect(console.error).toHaveBeenCalledWith('Desktop update error: find', 'find error');
		}

		function saveTest(){
			expect(modelMock.findById).toHaveBeenCalled();
			
			var callback = modelMock.findById.getCallback();
			desktopMock.isModified = desktopMock.isModified.andReturn(true);
			callback(null, desktopMock);

			expect(desktopMock.save).toHaveBeenCalled();

			var saveCallback = desktopMock.save.getCallback();
			spyOn(console, 'error');
			saveCallback(null);
			expect(console.error).not.toHaveBeenCalled();

			saveCallback('my error');
			expect(console.error).toHaveBeenCalledWith('Desktop update error: save', 'my error');
		}

		function notSaveTest(){
			var callback = modelMock.findById.getCallback();
			desktopMock.isModified = desktopMock.isModified.andReturn(false);
			callback(null, desktopMock);

			expect(desktopMock.save).not.toHaveBeenCalled();
		}
	});
});