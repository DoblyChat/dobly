describe('Sockets', function(){
	'use strict';

	describe('Task - integration', function(){
		var taskIo, offlineNotificationMock,
			socketMock, Task, CollaborationObject, UnreadMarker,
			userId, groupId, collaborationObjectId;

		beforeEach(function(done){
			CollaborationObject = require('../../lib/models/collaboration_object');
			Task = require('../../lib/models/task');
			UnreadMarker = require('../../lib/models/unread_marker');

			mockery.enable({ warnOnUnregistered: false });

			offlineNotificationMock = buildMock('../notifications/offline_notification', 'init', 'notify');

			taskIo = require('../../lib/sockets/task_io');

			socketMock = {
                emit: jasmine.createSpy(),
                broadcastToGroup: jasmine.createSpy(),
                broadcastToCollaborationObjectMembers: jasmine.createSpy(),
                handshake: {
                    user: {
                        _id: new mongo.Types.ObjectId(),
                    },
                },
            };

            userId = new mongo.Types.ObjectId();
            groupId = new mongo.Types.ObjectId();

            CollaborationObject.create({
            	topic: 'task io integration test',
            	createdById: userId,
            	members: {
            		entireGroup: false,
            		users: userId
            	},
            	groupId: groupId,
            	type: 'T'
            }, function(err, collaborationObject){
            	collaborationObjectId = collaborationObject._id;
            	done(err);
            });
		});

		afterEach(function(done){
			CollaborationObject.remove({ id: collaborationObjectId}, function(){
				Task.remove({ collaborationObjectId: collaborationObjectId }, done);
			});
		});

		it('adds a task', function(done){
			var sockets = {},
				data = {
					collaborationObjectId: collaborationObjectId,
					content: 'task io integration test'
				},
				confirm = jasmine.createSpy('confirm');

			taskIo.add(socketMock, sockets, data, function(task){
				expect(socketMock.broadcastToCollaborationObjectMembers).toHaveBeenCalled();

				Task.find({ collaborationObjectId: collaborationObjectId }, 
					function(err, tasks){
						expect(tasks.length).toBe(1);
						
						var task = tasks[0];

						expect(task.content).toBe(data.content);
						expect(task.collaborationObjectId).toEqual(collaborationObjectId);

						UnreadMarker.find({ collaborationObjectId: collaborationObjectId }, 
							function(err, markers){
								expect(markers.length).toBe(1);
								var marker = markers[0];
								expect(marker.userId).toEqual(userId);

								expect(offlineNotificationMock.init).toHaveBeenCalledWith(socketMock, sockets);
								expect(offlineNotificationMock.notify).toHaveBeenCalled();

								var itemInNotifications = offlineNotificationMock.notify.mostRecentCall.args[0];
								expect(itemInNotifications.content).toBe(data.content);
								done(err);
							});
					});
			});
		});

		it('removes a task', function(done){
			Task.create({
				createdById: userId,
				collaborationObjectId: collaborationObjectId,
				content: 'I should be removed'
			}, function(err, task){
				
				var data = {
					id: task._id,
					collaborationObjectId: collaborationObjectId
				};

				taskIo.remove(socketMock, data);

				waitUntilSpyCalled(socketMock.broadcastToCollaborationObjectMembers, function(args){
					expect(args[0]).toBe('task_removed');
					expect(args[1]).toBe(collaborationObjectId);
					expect(args[2]).toBe(data);

					Task.findById(task.id, function(err, task){
						expect(task).toBe(null);
						done();
					});
				});
			});
		});

		describe('toggles complete', function(){
			
			it('marks as complete', function(done){
				Task.create({
					createdById: userId,
					collaborationObjectId: collaborationObjectId,
					content: 'Im going to be completed'
				}, function(err, task){
					
					taskIo.toggleComplete(socketMock, {
						isComplete: true,
						collaborationObjectId: collaborationObjectId,
						id: task._id
					}, function(confirmData){
						expect(confirmData.isComplete).toBe(true);
						expect(confirmData.completedOn).toBeEquivalentDates(new Date());
						expect(confirmData.completedById).toEqual(socketMock.handshake.user._id);

						Task.findById(task._id, function(err, savedTask){
							expect(savedTask.completedById).toEqual(socketMock.handshake.user._id);
							expect(savedTask.completedOn).toBeEquivalentDates(new Date());
							done();
						});
					});
				});
			});

			it('marks as incomplete', function(done){
				Task.create({
					createdById: userId,
					collaborationObjectId: collaborationObjectId,
					content: 'Im going to be marked as incomplete',
					completedOn: new Date(),
					completedById: userId,
				}, function(err, task){
					
					taskIo.toggleComplete(socketMock, {
						isComplete: false,
						collaborationObjectId: collaborationObjectId,
						id: task._id
					}, function(confirmData){
						expect(confirmData.isComplete).toBe(false);
						expect(confirmData.completedOn).toBeNull();
						expect(confirmData.completedById).toBeNull();

						Task.findById(task.id, function(err, savedTask){
							expect(err).toBeNull();
							expect(savedTask.completedById).toBeNull();
							expect(savedTask.completedOn).toBeNull();
							done(err);
						});
					});
				});
			});

			it('marks as complete', function(done){
				Task.create({
					createdById: userId,
					collaborationObjectId: collaborationObjectId,
					content: 'Im going to be marked as complete',
				}, function(err, task){
					taskIo.toggleComplete(socketMock, {
						isComplete: true,
						collaborationObjectId: collaborationObjectId,
						id: task._id
					}, function(confirmData){
						expect(confirmData.isComplete).toBe(true);
						expect(confirmData.completedOn).toBeEquivalentDates(new Date());
						expect(confirmData.completedById).toEqual(socketMock.handshake.user._id);

						Task.findById(task.id, function(err, savedTask){
							expect(err).toBe(null);
							expect(savedTask.completedById).toEqual(socketMock.handshake.user._id);
							expect(savedTask.completedOn).toBeEquivalentDates(new Date());

							done(err);
						});
					});
				});
			});
		});

		it('updates the content', function(done){
			Task.create({
				createdById: userId,
				collaborationObjectId: collaborationObjectId,
				content: 'I should be updated'
			}, function(err, task){
				
				var data = {
					id: task._id,
					collaborationObjectId: collaborationObjectId,
					content: 'My new content'
				};

				taskIo.updateContent(socketMock, data);

				waitUntilSpyCalled(socketMock.broadcastToCollaborationObjectMembers, function(args){
					expect(args[0]).toBe('task_content_updated');
					expect(args[1]).toBe(collaborationObjectId);
					expect(args[2]).toBe(data);

					Task.findById(task.id, function(err, task){
						expect(task.content).toBe(data.content);
						done();
					});
				});
			});
		});

		it('assigns the task', function(done){
			var assignee = new mongo.Types.ObjectId();

			Task.create({
				createdById: userId,
				collaborationObjectId: collaborationObjectId,
				content: 'Im going to be assigned'
			}, function(err, task){
				
				var data = {
					id: task._id,
					collaborationObjectId: collaborationObjectId,
					assignedToId: assignee
				};

				taskIo.assign(socketMock, data);

				waitUntilSpyCalled(socketMock.broadcastToCollaborationObjectMembers, function(args){
					expect(args[0]).toBe('task_assigned');
					expect(args[1]).toBe(collaborationObjectId);
					expect(args[2]).toBe(data);

					Task.findById(task.id, function(err, task){
						expect(task.assignedToId).toEqual(assignee);
						done();
					});
				});
			});
		});
	});
});