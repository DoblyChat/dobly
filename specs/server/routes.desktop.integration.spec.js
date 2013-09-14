describe('Desktop route - integration', function(){
	'use strict';

    var User = require('../../lib/models/user'),
		Group = require('../../lib/models/group'),
		CollaborationObject = require('../../lib/models/collaboration_object'),
		Desktop = require('../../lib/models/desktop'),
		Message = require('../../lib/models/message'),
		UnreadMarker = require('../../lib/models/unread_marker'),
		async = require('async');

	var desktopRoute, req, res, group,
		TEST_NAME = 'test desktop route';

	beforeEach(function(done){
		desktopRoute = require('../../lib/routes/desktop');

		req = {};

		res = {
			render: jasmine.createSpy('render')
		};

		Group.create({ name: 'test', rawName: 'Test'}, function(err, testGroup){
			group = testGroup;
			done(err);
		});
	});

	afterEach(function(done){
		group.remove(done);
	});

	describe('#get', function(){
		var testUser, collaborationObjects;

		beforeEach(function(done){
			User.create({ email: 'test@email.com', firstName: TEST_NAME, lastName: 'last', groupId: group._id, password: 'pass' }, function(err, user){
				testUser = user;

				async.parallel({
					user2: function(callback){
						User.create({ email: 'routes.int.2@test.com', firstName: TEST_NAME + '2', lastName: 'last', groupId: group._id, password: 'pass' }, callback);
					},
					desktop: function(callback){
						Desktop.create({ userId: user._id }, callback);
					},
					collaborationObjects: function(callback){
						var collaborationObjects = [];

						for(var i = 0; i < 3; i++ ){
							collaborationObjects.push({ topic: 'test ' + i, createdById: user._id, groupId: group._id, timestamp: new Date(), members: { entireGroup: true }, type: 'C' });
						}

						CollaborationObject.create(collaborationObjects, function(err){
							var savedCollaborationObjects = [ arguments[1], arguments[2], arguments[3] ];
							async.parallel([
								function(callback){
									UnreadMarker.create([ 
										{
											collaborationObjectId: savedCollaborationObjects[0]._id,
											userId: user._id,
											count: 1
										},
										{
											collaborationObjectId: savedCollaborationObjects[1]._id,
											userId: user._id,
											count: 23
										}
									], callback);
								},
								function(callback){
									var data = [];

									for(var i = 0; i< 51; i++ ){
										data.push({ content: 'test message 2.' + i, createdById: user._id, collaborationObjectId: savedCollaborationObjects[1]._id, timestamp: new Date(2013, 1, 1, 1, i) });
									}

									data.push({ content: 'test message 1', createdById: user._id, collaborationObjectId: savedCollaborationObjects[0]._id, timestamp: new Date(2013, 9, 17) });
									data.push({ content: 'test message 1.2', createdById: user._id, collaborationObjectId: savedCollaborationObjects[0]._id, timestamp: new Date(2013, 9, 16) });

									data.push({ content: 'test message 3', createdById: user._id, collaborationObjectId: savedCollaborationObjects[2]._id });

									Message.create(data, callback);
								},
							], function(err){
								callback(err, savedCollaborationObjects);
							});
						});
					}
				}, function(err, results){
					collaborationObjects = results.collaborationObjects;
					done(err);
				});
			});
		});

		afterEach(function(done){
			async.parallel([
				function(callback){
					CollaborationObject.remove({ groupId: group._id }, callback);
				},
				function(callback){
					Desktop.remove({ userId: testUser._id }, callback);
				},
				function(callback){
					async.each(collaborationObjects, removeMessages, callback);

					function removeMessages(conversation, callback){
						Message.remove({ collaborationObjectId: conversation._id }, callback);
					}
				},
				function(callback){
					UnreadMarker.remove({ userId: testUser._id }, callback);
				}
				
			], function(err){
				done(err);
			});
		});

		it('renders', function(done){
			req.user = testUser;

			res.render = function(url, result){
				expect(url).toBe('conversations');
				verifyCollaborationObjects(JSON.parse(result.collaborationObjects));
				verifyDesktop(JSON.parse(result.desktop));
				verifyCurrentUser(JSON.parse(result.currentUser));
				verifyGroup(JSON.parse(result.group));

				done();
			};

			desktopRoute.get(req, res);
		});

		function verifyCollaborationObjects(collaborationObjects){
			expect(collaborationObjects.length).toBe(3);

			for(var i = 0; i < collaborationObjects.length; i++){
				var collaborationObject = collaborationObjects[i];
				expect(collaborationObject.groupId).toBe(group._id.toString());
				expect(collaborationObject.createdById).toBe(testUser._id.toString());
				expect(collaborationObject.topic).toContain('test');
			}

			expect(collaborationObjects[0].items.length).toBe(2);

			// items are provided in reverse order
			expect(collaborationObjects[0].items[1].content).toBe('test message 1');
			expect(collaborationObjects[0].items[0].content).toBe('test message 1.2');

			expect(collaborationObjects[1].items.length).toBe(50);
			expect(collaborationObjects[1].items[0].content).toBe('test message 2.1');
			expect(collaborationObjects[1].items[49].content).toBe('test message 2.50');

			expect(collaborationObjects[2].items.length).toBe(1);
			expect(collaborationObjects[2].items[0].content).toBe('test message 3');

			expect(collaborationObjects[0].unread).toBe(1);
			expect(collaborationObjects[1].unread).toBe(23);
		}

		function verifyDesktop(desktop){
			expect(desktop.userId).toBe(testUser._id.toString());
			expect(desktop.collaborationObjects).toContain(collaborationObjects[0]._id.toString());
			expect(desktop.collaborationObjects).toContain(collaborationObjects[1]._id.toString());
			expect(desktop.collaborationObjects).not.toContain(collaborationObjects[2]._id.toString());
		}

		function verifyCurrentUser(currentUser){
			expect(currentUser._id).toBe(testUser._id.toString());
			expect(currentUser.email).toBe(testUser.email);
		}

		function verifyGroup(resultGroup){
			expect(resultGroup.name).toBe(group.name);
			expect(resultGroup.users.length).toBe(2);
			expect(resultGroup.users[0].firstName).toBe(TEST_NAME);
			expect(resultGroup.users[1].firstName).toBe(TEST_NAME + '2');
		}
	});
});