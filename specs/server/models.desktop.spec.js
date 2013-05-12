describe('Desktop', function(){
	var Desktop = require('../../models/desktop');

	var desktop;

	beforeEach(function(){
		desktop = new Desktop();
	});

	describe('#removeConversation', function(){
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

		it('removes a conversation', function(done){
			var conversationId = new mongo.Types.ObjectId();
			desktop.conversations.push(conversationId);
			
			desktop.save(function(err){
				Desktop.findById(desktop._id, function(err, savedDesktop){
					expect(savedDesktop.conversations).toContain(conversationId);

					desktop.removeConversation(conversationId, function(err){
						Desktop.findById(desktop._id, function(err, savedDesktop){
							expect(savedDesktop.conversations).not.toContain(conversationId);
							done(err);
						});
					});
				});
			});
		});

		it('does not throw error if conversation list empty', function(done){
			var conversationId = new mongo.Types.ObjectId();
			expect(desktop.conversations).not.toContain(conversationId);

			desktop.removeConversation(conversationId, function(err){
				expect(err).toBeNull();
				done(err);
			});
		});

		it('removes the right conversation', function(done){
			var conversationId = new mongo.Types.ObjectId();
			var otherId = new mongo.Types.ObjectId();

			desktop.update({ $push: { conversations: { $each: [ conversationId, otherId ] }}}, function(err){
				Desktop.findById(desktop._id, function(err, savedDesktop){
					expect(savedDesktop.conversations).toContain(conversationId);
					expect(savedDesktop.conversations).toContain(otherId);

					savedDesktop.removeConversation(otherId, function(err){
						Desktop.findById(desktop._id, function(err, savedDesktop){
							expect(savedDesktop.conversations).toContain(conversationId);
							expect(savedDesktop.conversations).not.toContain(otherId);
							done(err);
						});
					});
				});
			});
		});
	});

	describe('#addConversation', function(){
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

		it('adds a conversation', function(done){
			var conversationId = new mongo.Types.ObjectId();

			desktop.addConversation(conversationId, function(err){
				Desktop.findById(desktop._id, function(err, savedDesktop){
					expect(savedDesktop.conversations).toContain(conversationId);
					
					var anotherConversationId = new mongo.Types.ObjectId();

					savedDesktop.addConversation(anotherConversationId, function(err){
						Desktop.findById(desktop._id, function(err, savedDesktop){
							expect(savedDesktop.conversations.length).toBe(2);
							expect(savedDesktop.conversations).toContain(anotherConversationId);
							done(err);
						})
					});
				});
			});
		});

		it('does not add the same conversation twice', function(done){
			var conversationId = new mongo.Types.ObjectId();

			desktop.addConversation(conversationId, function(err){
				Desktop.findById(desktop._id, function(err, savedDesktop){
					expect(savedDesktop.conversations).toContain(conversationId);

					savedDesktop.addConversation(conversationId, function(err){
						Desktop.findById(desktop._id, function(err, savedDesktop){
							expect(savedDesktop.conversations.length).toBe(1);
							done(err);
						});
					});
				});
			});
		});
	});

	describe('#moveConversation', function(){
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

		it('moves conversation to new location', function(done){
			var convo1 = new mongo.Types.ObjectId();
			var convo2 = new mongo.Types.ObjectId();
			var convo3 = new mongo.Types.ObjectId();

			desktop.conversations.push(convo1);
			desktop.conversations.push(convo2);
			desktop.conversations.push(convo3);

			desktop.save(function(err){
				verifyOrder(convo1, convo2, convo3, function(desktop){
					desktop.moveConversation(0, 1, function(){
						verifyOrder(convo2, convo1, convo3, function(desktop){
							desktop.moveConversation(0, 2, function(){
								verifyOrder(convo1, convo3, convo2, function(desktop){
									desktop.moveConversation(1, 1, function(){
										verifyOrder(convo1, convo3, convo2, function(desktop){
											desktop.moveConversation(1, 2, function(){
												verifyOrder(convo1, convo2, convo3, function(desktop){
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
				expect(savedDesktop.conversations[0].toString()).toBe(first.toString());
				expect(savedDesktop.conversations[1].toString()).toBe(second.toString());
				expect(savedDesktop.conversations[2].toString()).toBe(third.toString());

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
				expect(savedDesktop.conversations).not.toBe(null);
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

		it('has a default empty array of conversations', function(){
			var desktop = new Desktop();
			expect(desktop.conversations).not.toBe(null);
			expect(desktop.conversations.length).toBe(0);
		});
	});
});