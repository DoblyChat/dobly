describe('Desktop', function(){
	'use strict';

	var Desktop = require('../../lib/models/desktop');
	var User = require('../../lib/models/user');
	var CollaborationObject = require('../../lib/models/collaboration_object');

	var desktop;

	beforeEach(function(){
		desktop = new Desktop();
	});

	describe('#removeCollaborationObject', function(){
		beforeEach(function(done){
			Desktop.create({
				userId: new mongo.Types.ObjectId()
			}, function(err, aDesktop){
				desktop = aDesktop;
				done(err);
			});
		});

		afterEach(function(done){
			desktop.remove(done);
		});

		it('removes a collaboration object', function(done){
			var collaborationObjectId = new mongo.Types.ObjectId();
			desktop.collaborationObjects.push(collaborationObjectId);
			
			desktop.save(function(err){
				Desktop.findById(desktop._id, function(err, savedDesktop){
					expect(savedDesktop.collaborationObjects).toContain(collaborationObjectId);

					Desktop.removeCollaborationObject(savedDesktop._id, collaborationObjectId, function(err){
						Desktop.findById(desktop._id, function(err, savedDesktop){
							expect(savedDesktop.collaborationObjects).not.toContain(collaborationObjectId);
							done(err);
						});
					});
				});
			});
		});

		it('does not throw error if collaboration object list empty', function(done){
			var collaborationObjectId = new mongo.Types.ObjectId();
			expect(desktop.collaborationObjects).not.toContain(collaborationObjectId);

			Desktop.removeCollaborationObject(desktop._id, collaborationObjectId, function(err){
				expect(err).toBeNull();
				done(err);
			});
		});

		it('removes the right collaboration object', function(done){
			var collaborationObjectId = new mongo.Types.ObjectId();
			var otherId = new mongo.Types.ObjectId();

			desktop.update({ $push: { collaborationObjects: { $each: [ collaborationObjectId, otherId ] }}}, function(err){
				Desktop.findById(desktop._id, function(err, savedDesktop){
					expect(savedDesktop.collaborationObjects).toContain(collaborationObjectId);
					expect(savedDesktop.collaborationObjects).toContain(otherId);

					Desktop.removeCollaborationObject(savedDesktop._id, otherId, function(err){
						Desktop.findById(desktop._id, function(err, savedDesktop){
							expect(savedDesktop.collaborationObjects).toContain(collaborationObjectId);
							expect(savedDesktop.collaborationObjects).not.toContain(otherId);
							done(err);
						});
					});
				});
			});
		});
	});

	describe('#addCollaborationObject', function(){
		beforeEach(function(done){
			Desktop.create({
				userId: new mongo.Types.ObjectId()
			}, function(err, aDesktop){
				desktop = aDesktop;
				done(err);
			});
		});

		afterEach(function(done){
			desktop.remove(done);
		});

		it('adds a collaboration object', function(done){
			var collaborationObjectId = new mongo.Types.ObjectId();

			Desktop.addCollaborationObject(desktop._id, collaborationObjectId, function(err){
				Desktop.findById(desktop._id, function(err, savedDesktop){
					expect(savedDesktop.collaborationObjects).toContain(collaborationObjectId);
					
					var anotherConversationId = new mongo.Types.ObjectId();

					Desktop.addCollaborationObject(savedDesktop._id, anotherConversationId, function(err){
						Desktop.findById(desktop._id, function(err, savedDesktop){
							expect(savedDesktop.collaborationObjects.length).toBe(2);
							expect(savedDesktop.collaborationObjects).toContain(anotherConversationId);
							done(err);
						});
					});
				});
			});
		});

		it('does not add the same collaboration object twice', function(done){
			var collaborationObjectId = new mongo.Types.ObjectId();

			Desktop.addCollaborationObject(desktop._id, collaborationObjectId, function(err){
				Desktop.findById(desktop._id, function(err, savedDesktop){
					expect(savedDesktop.collaborationObjects).toContain(collaborationObjectId);

					Desktop.addCollaborationObject(desktop._id, collaborationObjectId, function(err){
						Desktop.findById(desktop._id, function(err, savedDesktop){
							expect(savedDesktop.collaborationObjects.length).toBe(1);
							done(err);
						});
					});
				});
			});
		});
	});

	describe('#moveCollaborationObject', function(){
		beforeEach(function(done){
			Desktop.create({
				userId: new mongo.Types.ObjectId()
			}, function(err, aDesktop){
				desktop = aDesktop;
				done(err);
			});
		});

		afterEach(function(done){
			desktop.remove(done);
		});

		it('moves collaboration object to new location', function(done){
			var object1 = new mongo.Types.ObjectId();
			var object2 = new mongo.Types.ObjectId();
			var object3 = new mongo.Types.ObjectId();

			desktop.collaborationObjects.push(object1);
			desktop.collaborationObjects.push(object2);
			desktop.collaborationObjects.push(object3);

			desktop.save(function(err){
				verifyOrder(object1, object2, object3, function(desktop){
					desktop.moveCollaborationObject(0, 1, function(){
						verifyOrder(object2, object1, object3, function(desktop){
							desktop.moveCollaborationObject(0, 2, function(){
								verifyOrder(object1, object3, object2, function(desktop){
									desktop.moveCollaborationObject(1, 1, function(){
										verifyOrder(object1, object3, object2, function(desktop){
											desktop.moveCollaborationObject(1, 2, function(){
												verifyOrder(object1, object2, object3, function(desktop){
													done();
												});
											});
										});
									});
								});
							});
						});
					});
				});
			});
		});

		function verifyOrder(first, second, third, callback){
			Desktop.findById(desktop._id, function(err, savedDesktop){
				expect(savedDesktop.collaborationObjects[0].toString()).toBe(first.toString());
				expect(savedDesktop.collaborationObjects[1].toString()).toBe(second.toString());
				expect(savedDesktop.collaborationObjects[2].toString()).toBe(third.toString());

				callback(savedDesktop);
			});
		}
	});

	describe('#findOrCreateByUserId', function(){
		var userId, findOne;

		beforeEach(function(){
			userId = new mongo.Types.ObjectId();
		});

		it('creates desktop entry if one for user does not exist', function(done){

			Desktop.findOrCreateByUserId(userId, function(err, savedDesktop){ 
				expect(arguments.length).toBe(2);
				expect(savedDesktop.userId).toBe(userId);
				expect(savedDesktop.collaborationObjects).not.toBe(null);
				done(err);
			});
		});

		it('returns desktop entry if one for user already exists', function(done){
			Desktop.create({ userId: userId }, function(err, desktop){

				Desktop.findOrCreateByUserId(userId, function(err, savedDesktop){ 
					expect(savedDesktop._id).toBe(savedDesktop._id);
					done(err);
				});
			});
		});

		afterEach(function(done){
			Desktop.remove({ userId: userId }, done);
		});

	});

	describe('#fields', function() {

		it('userId is required', function(done) {
			Desktop.create({}, function(err){
				checkRequiredFieldError(err, 'userId');
				done();
			});
		});

		it('has a default empty array of collaboration objects', function(){
			var desktop = new Desktop();
			expect(desktop.collaborationObjects).not.toBe(null);
			expect(desktop.collaborationObjects.length).toBe(0);
		});
	});

	describe('#addRecentCollaborationObjects', function() {

		var user_X, group_A, testDesktop,
			user_A, group_B, user_B;

		var today, yesterday, dayBeforeYesterday, threeDaysAgo, fourDaysAgo, fiveDaysAgo;

		beforeEach(function(done){
			group_A = new mongo.Types.ObjectId();
			user_X = new mongo.Types.ObjectId();
			group_B = new mongo.Types.ObjectId();
			user_A = new mongo.Types.ObjectId();
			user_B = new mongo.Types.ObjectId();

			today = new Date();
			yesterday = new Date();
			dayBeforeYesterday = new Date();
			threeDaysAgo = new Date();
			fourDaysAgo = new Date();
			fiveDaysAgo = new Date();

			yesterday.setDate(today.getDate()-1);
			dayBeforeYesterday.setDate(today.getDate()-2);
			threeDaysAgo.setDate(today.getDate()-3);
			fourDaysAgo.setDate(today.getDate()-4);
			fiveDaysAgo.setDate(today.getDate()-5);

			var collaborationObjects = [
				{ topic: 'one', createdById: user_A, members: { entireGroup: true, users: [] }, groupId: group_A, type: 'C', lastActivity: yesterday },
				{ topic: 'other group', createdById: user_B, members: { entireGroup: true, users: []}, groupId: group_B, type: 'C' },
				{ topic: 'two', createdById: user_A, members: { entireGroup: true, users: [] }, groupId: group_A, type: 'C', lastActivity: dayBeforeYesterday },
				{ topic: 'three', createdById: user_A, members: { entireGroup: true, users: [] }, groupId: group_A, type: 'C', lastActivity: fourDaysAgo },
				{ topic: 'four', createdById: user_A, members: { entireGroup: true, users: [] }, groupId: group_A, type: 'C', lastActivity: threeDaysAgo },
				{ topic: 'five', createdById: user_A, members: { entireGroup: true, users: [] }, groupId: group_A, type: 'C', lastActivity: fiveDaysAgo },
				{ topic: 'six', createdById: user_A, members: { entireGroup: true, users: [] }, groupId: group_A, type: 'C', lastActivity: today }
			];		

			CollaborationObject.create(collaborationObjects, function(err) {
				var userData = { firstName: 'test me', lastName: 'test me last', email: 'model-test@dobly.com', password: 'cleartext', groupId: group_A };
				User.create(userData, function(err, user) {
					Desktop.findOrCreateByUserId(user._id, function(err, desktop) {
						testDesktop = desktop;
						done(err);
					});
				});
			});
		});

		afterEach(function(done){
			CollaborationObject.remove({ $or: [ { groupId: group_A }, { groupId: group_B } ] }, function(err, result) {
				Desktop.remove({ userId: testDesktop.userId }, function(err, result) {
					User.remove({ _id: testDesktop.userId }, done);
				});
			});
		});

		it('adds the most recent collaboration objects', function(done) {
			function verify(collaborationObject, date) {
				expect(collaborationObject.groupId).toEqual(group_A);
				expect(aproximateDate(collaborationObject.lastActivity)).toEqual(aproximateDate(date));
			}			

			testDesktop.addRecentCollaborationObjects(function(err) {
				Desktop.findOrCreateByUserId(testDesktop.userId, function(err, desktop) {
					expect(desktop.collaborationObjects.length).toBe(5);
					CollaborationObject.findById(desktop.collaborationObjects[0], function(err, first) {
						verify(first, today);
						CollaborationObject.findById(desktop.collaborationObjects[1], function(err, second) {
							verify(second, yesterday);
							CollaborationObject.findById(desktop.collaborationObjects[2], function(err, third) {
								verify(third, dayBeforeYesterday);
								CollaborationObject.findById(desktop.collaborationObjects[3], function(err, fourth) {
									verify(fourth, threeDaysAgo);
									CollaborationObject.findById(desktop.collaborationObjects[4], function(err, fifth) {
										verify(fifth, fourDaysAgo);
										done(err);
									});
								});
							});
						});
					});
				});
			});
		});

		
	});
});