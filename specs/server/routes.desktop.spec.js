describe('Desktop route', function(){
	'use strict';

	var APP_TITLE = 'Dobly';

    var desktopRoute, req, res, 
		groupMock, userMock, asyncMock,
		collaborationObjectMock, desktopMock, unreadMock,
		messageMock, logMock, taskMock;

	beforeEach(function(){
		req = {};
		res = { 
			render: jasmine.createSpy(),
		};

		mockery.enable({ useCleanCache: true });
		mockery.registerAllowable('../../lib/routes/desktop');

		groupMock = buildMock('../models/group', 'findOne', 'findById', 'find', 'create');
		userMock = buildMock('../models/user', 'create', 'find');
		desktopMock = buildMock('../models/desktop', 'findOrCreateByUserId');
		unreadMock = buildMock('../models/unread_marker', 'find');
		asyncMock = buildMock('async', 'parallel', 'each');
		collaborationObjectMock = buildMock('../models/collaboration_object', 'findAllowedCollaborationObjects');
		messageMock = buildMock('../models/message', 'readMessagesByPage', 'count');
		taskMock = buildMock('../models/task', 'readTasks');
		logMock = buildMock('../common/log', 'error');

		desktopRoute = require('../../lib/routes/desktop');
	});

	describe('#get', function(){
		var render, setup, dummyCallback;

		beforeEach(function(){
			dummyCallback = jasmine.createSpy('callback');
			desktopRoute.get(req, res);
			setup = asyncMock.parallel.mostRecentCall.args[0];
			render = asyncMock.parallel.getCallback();

			req.user = { groupId: 'groupid', _id: 'my-id' };
		});

		describe('loads', function(){
			describe('collaborationObjects', function(){
				beforeEach(function(){
					setup.collaborationObjects(dummyCallback);
				});

				it('allowed collaboration objects', function(){
					expect(collaborationObjectMock.findAllowedCollaborationObjects).toHaveBeenCalled();
					var args = collaborationObjectMock.findAllowedCollaborationObjects.mostRecentCall.args;

					expect(args[0]).toBe(req.user.groupId);
					expect(args[1]).toBe(req.user._id);
				});

				it('bubbles up error if there is an error finding collaboration objects', function(){
					var callback = collaborationObjectMock.findAllowedCollaborationObjects.getCallback();
					callback('my-error');
					expect(dummyCallback).toHaveBeenCalledWith('my-error');
				});

				describe('items', function(){
					var loadItems, loadMessageCount, 
						collaborationObjects, collaborationObject;

					beforeEach(function(){
						collaborationObjects = [{dummy: 'object1'}, {dummy: 'object2'}];
						
						var callback = collaborationObjectMock.findAllowedCollaborationObjects.getCallback();
						callback(null, collaborationObjects);
						var funcs = asyncMock.parallel.mostRecentCall.args[0];
						loadItems = funcs[0];
						loadMessageCount = funcs[1];
					});

					describe('messages', function(){
						beforeEach(function(){
							collaborationObject = { _id: 'object-id', type: 'C' };
						});

						it('loads first message page', function(){
							loadItems(dummyCallback);
							expect(asyncMock.each).toHaveBeenCalled();
							expect(asyncMock.each.mostRecentCall.args[0]).toBe(collaborationObjects);
							expect(asyncMock.each.mostRecentCall.args[2]).toBe(dummyCallback);

							var load = asyncMock.each.mostRecentCall.args[1];
							load(collaborationObject, dummyCallback);

							expect(messageMock.readMessagesByPage).toHaveBeenCalled();
							var readArgs = messageMock.readMessagesByPage.mostRecentCall.args;

							expect(readArgs[0]).toBe(collaborationObject._id);
							expect(readArgs[1]).toBe(0);

							var callback = messageMock.readMessagesByPage.getCallback();
							var messages = [{ dummyMsg: 'hello world'}];
							callback('my-error', messages);
							expect(collaborationObject.items).toBe(messages.reverse());
							expect(dummyCallback).toHaveBeenCalledWith('my-error');
						});

						it('loads message count', function(){
							loadMessageCount(dummyCallback);
							expect(asyncMock.each).toHaveBeenCalled();
							expect(asyncMock.each.mostRecentCall.args[0]).toBe(collaborationObjects);
							expect(asyncMock.each.mostRecentCall.args[2]).toBe(dummyCallback);

							var loadCount = asyncMock.each.mostRecentCall.args[1];
							loadCount(collaborationObject, dummyCallback);
							expect(messageMock.count).toHaveBeenCalled();

							var countArgs = messageMock.count.mostRecentCall.args;

							expect(countArgs[0].collaborationObjectId).toBe(collaborationObject._id);

							var callback = messageMock.count.getCallback();
							callback('my-error', 123);
							expect(collaborationObject.totalMessages).toBe(123);
							expect(dummyCallback).toHaveBeenCalledWith('my-error');
						});
					});

					describe('tasks', function(){
						beforeEach(function(){
							collaborationObject = { _id: 'object-id', type: 'T' };
							loadItems(dummyCallback);
						});

						it('loads all tasks for task list', function(){
							loadItems(dummyCallback);
							expect(asyncMock.each).toHaveBeenCalled();
							expect(asyncMock.each.mostRecentCall.args[0]).toBe(collaborationObjects);
							expect(asyncMock.each.mostRecentCall.args[2]).toBe(dummyCallback);

							var load = asyncMock.each.mostRecentCall.args[1];
							load(collaborationObject, dummyCallback);

							expect(taskMock.readTasks).toHaveBeenCalled();

							var readArgs = taskMock.readTasks.mostRecentCall.args;
							expect(readArgs[0]).toBe(collaborationObject._id);

							var tasks = [{ task: '1' }, { task: '2' }];
							var err = { 'an': 'error' };
							readArgs[1](err, tasks);
							expect(collaborationObject.items).toBe(tasks);
							expect(dummyCallback).toHaveBeenCalledWith(err);
						});

						it('does not load any count', function(){
							loadMessageCount(dummyCallback);
							expect(asyncMock.each).toHaveBeenCalled();
							expect(asyncMock.each.mostRecentCall.args[0]).toBe(collaborationObjects);
							expect(asyncMock.each.mostRecentCall.args[2]).toBe(dummyCallback);

							var loadCount = asyncMock.each.mostRecentCall.args[1];
							loadCount(collaborationObject, dummyCallback);
							expect(dummyCallback).toHaveBeenCalledWith(null);
						});
					});			

					it('returns collaboration objects after items are loaded', function(){
						var callback = asyncMock.parallel.getCallback();
						callback('my-error', collaborationObjects);
						expect(dummyCallback).toHaveBeenCalledWith('my-error', collaborationObjects);
					});
				});
			});

			it('users desktop data', function(){
				setup.desktop(dummyCallback);
				expect(desktopMock.findOrCreateByUserId).toHaveBeenCalledWith('my-id', dummyCallback);
			});

			it('users unread markers', function(){
				setup.markers(dummyCallback);
				expect(unreadMock.find).toHaveBeenCalled();

				var args = unreadMock.find.mostRecentCall.args;
				expect(args[0].userId).toBe('my-id');
				expect(args[1]).toBeNull();
				expect(args[2].lean).toBe(true);
				expect(args[3]).toBe(dummyCallback);
			});

			it('the group', function(){
				setup.group(dummyCallback);
				expect(groupMock.findById).toHaveBeenCalled();

				var args = groupMock.findById.mostRecentCall.args;
				expect(args[0]).toBe('groupid');
				expect(args[1]).toBe('name rawName');
				expect(args[2].lean).toBe(true);
				expect(args[3]).toBe(dummyCallback);
			});
		});

		describe('render', function(){
			var data, object1, object2, object3, user1, user2, user3;

			beforeEach(function(){
				data = {
					group: {},
					users: [],
					collaborationObjects: [],
					desktop: {
						collaborationObjects: [],
						isModified: jasmine.createSpy(),
						save: jasmine.createSpy()
					},
					markers: [],
				};

				object1 = new mongo.Types.ObjectId();
				object2 = new mongo.Types.ObjectId();
				object3 = new mongo.Types.ObjectId();

				user1 = { _id: new mongo.Types.ObjectId(), name: 'uno' };
				user2 = { _id: new mongo.Types.ObjectId(), name: 'dos' };
				user3 = { _id: new mongo.Types.ObjectId(), name: 'tres' };

				data.collaborationObjects.push({ _id: object1, createdById: user1._id });
				data.collaborationObjects.push({ _id: object2, createdById: user2._id });
				data.collaborationObjects.push({ _id: object3, createdById: user3._id });

				data.users.push(user1);
				data.users.push(user2);
				data.users.push(user3);
			});

			it('logs error if any error is provided', function(){
				render('some error', {});

				expect(logMock.error).toHaveBeenCalledWith('Error rendering desktop', 'some error');
			});

			it('sets groups users', function(){
				render(null, data);
				expect(data.group.users).toBe(data.users);
			});

			describe('collaborationObjects with unread counters', function(){
				beforeEach(function(){
					data.markers.push({ collaborationObjectId: object2, count: 2 });
					data.markers.push({ collaborationObjectId: object3, count: 4 });
				});

				it('adds unread markers to all collaborationObjects', function(){
					render(null, data);
					
					expect(data.collaborationObjects[0].unread).toBe(0);
					expect(data.collaborationObjects[1].unread).toBe(2);
					expect(data.collaborationObjects[2].unread).toBe(4);
				});

				it('adds missing collaborationObjects to the desktop if they have unread messages', function(){
					data.desktop.collaborationObjects.push(object2);
					render(null, data);

					expect(data.desktop.collaborationObjects.indexOf(object3)).toBeGreaterThan(-1);
					expect(data.desktop.collaborationObjects.indexOf(object1)).toBe(-1);
				});
			});

			describe('collaborationObjects with created by names', function(){
				beforeEach(function(){
					data.collaborationObjects[0].createdById = user1._id;
					data.collaborationObjects[1].createdById = user2._id;
					data.collaborationObjects[2].createdById = user3._id;
				});

				it('adds created by names for each collaboration object', function(){
					render(null, data);

					expect(data.collaborationObjects[0].createdBy).toBe(user1.firstName);
					expect(data.collaborationObjects[1].createdBy).toBe(user2.firstName);
					expect(data.collaborationObjects[2].createdBy).toBe(user3.firstName);
				});
			});

			it('updates desktop if modified', function(){
				data.desktop.isModified.andReturn(true);
				render(null, data);

				expect(data.desktop.isModified).toHaveBeenCalledWith('collaborationObjects');
				expect(data.desktop.save).toHaveBeenCalled();

				var args = data.desktop.save.mostRecentCall.args;
				args[0]('my error');
				expect(logMock.error).toHaveBeenCalledWith('Error updating desktop when rendering', 'my error');
				expect(res.render).not.toHaveBeenCalled();

				logMock.error.reset();

				args[0](null);
				expect(logMock.error).not.toHaveBeenCalled();
				expect(res.render).toHaveBeenCalled();
			});

			it('renders desktop', function(){
				data.markers.push({ collaborationObjectId: object3, count: 88 });
				
				render(null, data);

				expect(res.render).toHaveBeenCalled();

				var args = res.render.mostRecentCall.args;
				expect(args[0]).toBe('conversations');

				var renderData = args[1];

				expect(renderData.title).toBe(APP_TITLE);
				expect(renderData.conversations).toBe(JSON.stringify(data.conversations));
				expect(renderData.desktop).toBe(JSON.stringify(data.desktop));
				expect(renderData.currentUser).toBe(JSON.stringify(req.user));
				expect(renderData.group).toBe(JSON.stringify(data.group));
				expect(renderData.layout).toBe('');

				
			});
		});
	});
});