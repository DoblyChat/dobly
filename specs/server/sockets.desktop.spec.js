describe('Sockets', function(){
	'use strict';

    describe('Desktop', function(){
			
		var desktopIo, modelMock, desktopMock, socketMock;

		beforeEach(function(){
			mockery.enable({ useCleanCache: true });
			mockery.registerAllowable('../../lib/sockets/desktop_io');
			modelMock = buildMock('../models/desktop', 'findById', 'addCollaborationObject', 'removeCollaborationObject');
			desktopIo = require('../../lib/sockets/desktop_io');

			desktopMock = { 
				moveCollaborationObject: jasmine.createSpy(),
			};

			socketMock = {
				joinCollaborationObjectRoom: jasmine.createSpy(),
				leaveCollaborationObjectRoom: jasmine.createSpy()
			};

			spyOn(console, 'error');
		});

		describe('#addCollaborationObject', function(){
			it('adds a collaboration object', function(){
				desktopIo.addCollaborationObject(socketMock, { id: 3, collaborationObjectId: 23 });
				expect(modelMock.addCollaborationObject).toHaveBeenCalled();
				expect(modelMock.addCollaborationObject.mostRecentCall.args[0]).toBe(3);
				expect(modelMock.addCollaborationObject.mostRecentCall.args[1]).toBe(23);
			});

			it('logs an error if add collaboration object failed', function(){
				desktopIo.addCollaborationObject(socketMock, { id: 15 });
				expect(modelMock.addCollaborationObject).toHaveBeenCalled();

				var addCallback = modelMock.addCollaborationObject.getCallback();
				addCallback('add-error');
				expect(console.error).toHaveBeenCalledWith('Desktop error adding collaboration object', 'add-error');
				expect(socketMock.joinCollaborationObjectRoom).not.toHaveBeenCalled();
			});

			it('joins collaboration object room if save successfull', function(){
				desktopIo.addCollaborationObject(socketMock, { id: 15, collaborationObjectId: 34 });
				var callback = modelMock.addCollaborationObject.getCallback();
				callback(null);
				expect(console.error).not.toHaveBeenCalled();
				expect(socketMock.joinCollaborationObjectRoom).toHaveBeenCalledWith(34);
			});
		});

		describe('#removeCollaborationObject', function(){
			it('removes a collaboration object', function(){
				desktopIo.removeCollaborationObject(socketMock, { id: 'id', collaborationObjectId: 34 });
				expect(modelMock.removeCollaborationObject).toHaveBeenCalled();
				expect(modelMock.removeCollaborationObject.mostRecentCall.args[0]).toBe('id');
				expect(modelMock.removeCollaborationObject.mostRecentCall.args[1]).toBe(34);

				expect(console.error).not.toHaveBeenCalled();
			});

			it('logs an error if remove collaboration object failed', function(){
				desktopIo.removeCollaborationObject(socketMock, { id: 15 });
				expect(modelMock.removeCollaborationObject).toHaveBeenCalled();

				var callback = modelMock.removeCollaborationObject.getCallback();
				callback('remove-error');
				expect(console.error).toHaveBeenCalledWith('Desktop error removing collaboration object', 'remove-error');
				expect(socketMock.leaveCollaborationObjectRoom).not.toHaveBeenCalled();
			});

			it('leaves collaboration object room if save successfull', function(){
				desktopIo.removeCollaborationObject(socketMock, { id: 15, collaborationObjectId: 34 });
				var callback = modelMock.removeCollaborationObject.getCallback();
				callback(null);
				expect(console.error).not.toHaveBeenCalled();
				expect(socketMock.leaveCollaborationObjectRoom).toHaveBeenCalledWith(34);
			});
		});

		describe('#updatesStripOrder', function(){
			
			var data;

			beforeEach(function(){
				data = { id: 'id', currentSort: { startIndex: 1, stopIndex: 2 } };
			});

			it('moves a collaborationn object', function(){
				desktopIo.updateStripOrder(data);
				expect(modelMock.findById.mostRecentCall.args[0]).toBe('id');
				var callback = modelMock.findById.getCallback();
				callback(null, desktopMock);
				expect(desktopMock.moveCollaborationObject).toHaveBeenCalled();
				expect(desktopMock.moveCollaborationObject.mostRecentCall.args[0]).toBe(1);
				expect(desktopMock.moveCollaborationObject.mostRecentCall.args[1]).toBe(2);

				expect(console.error).not.toHaveBeenCalled();
			});

			it('logs an error if find desktop failed', function(){
				desktopIo.updateStripOrder(data);
				logsErrorIfFindFailedTest();
			});

			it('logs an error if remove collaboration object failed', function(){
				desktopIo.updateStripOrder(data);
				var callback = modelMock.findById.getCallback();
				callback(null, desktopMock);
				expect(desktopMock.moveCollaborationObject).toHaveBeenCalled();

				var addCallback = desktopMock.moveCollaborationObject.getCallback();
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