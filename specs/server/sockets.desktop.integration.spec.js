describe('Sockets', function(){
	'use strict';

    describe('Desktop - integration', function(){
		var desktopIo, Desktop, desktopId, socketMock;

		beforeEach(function(done){
			desktopIo = require('../../lib/sockets/desktop_io');
			Desktop = require('../../lib/models/desktop');

			socketMock = {
				joinCollaborationObjectRoom: jasmine.createSpy(),
				leaveCollaborationObjectRoom: jasmine.createSpy(),
			};

			Desktop.create({
				userId: new mongo.Types.ObjectId()
			}, function(err, desktop){
				desktopId = desktop._id;
				done(err);
			});
		});

		afterEach(function(done){
			Desktop.findByIdAndRemove(desktopId, done);
		});

		it('adds a collaboration object to the desktop', function(done){
			var collaborationObjectId = new mongo.Types.ObjectId();
			var checkCompleted = false;

			runs(function(){
				desktopIo.addCollaborationObject(socketMock, { id: desktopId, collaborationObjectId: collaborationObjectId });
			});

			waitsFor(function(){
				Desktop.findById(desktopId, function(err, desktop){
					checkCompleted = desktop.collaborationObjects.indexOf(collaborationObjectId) >= 0;
				});

				return checkCompleted;
			});

			runs(function(){
				done();
			});
		});

		describe('removes a collaboration object from the desktop', function(){
			var collaborationObjectId = new mongo.Types.ObjectId();
			var checkCompleted = false;

			beforeEach(function(done){
				Desktop.addCollaborationObject(desktopId, collaborationObjectId, done);
			});

			it('removes collaboration object', function(done){
				runs(function(){
					desktopIo.removeCollaborationObject(socketMock, { id: desktopId, collaborationObjectId: collaborationObjectId });
				});

				waitsFor(function(){
					Desktop.findById(desktopId, function(err, desktop){
						checkCompleted = desktop.collaborationObjects.indexOf(collaborationObjectId) < 0;
					});

					return checkCompleted;
				});

				runs(function(){
					done();
				});
			});
		});

		describe('updates strip order', function(){
			var first, second;

			beforeEach(function(done){
				first = new mongo.Types.ObjectId();
				second = new mongo.Types.ObjectId();

				Desktop.addCollaborationObject(desktopId, first, function(err){
					Desktop.addCollaborationObject(desktopId, second, function(err){
						Desktop.findById(desktopId, function(err, desktop){
							expect(desktop.collaborationObjects.length).toBe(2);
							expect(desktop.collaborationObjects[0]).toEqual(first);
							expect(desktop.collaborationObjects[1]).toEqual(second);
							done();
						});
					});
				});
			});

			it('updates order', function(done){
				var checkCompleted = false;

				runs(function(){
					desktopIo.updateStripOrder({ id: desktopId, currentSort: { startIndex: 0, stopIndex: 1 } });
				});

				waitsFor(function(){
					Desktop.findById(desktopId, function(err, desktop){
						checkCompleted = desktop.collaborationObjects.indexOf(first) === 1 && desktop.collaborationObjects.indexOf(second) === 0;
					});

					return checkCompleted;
				});

				runs(function(){
					done();
				});
			});
		});
	});
});