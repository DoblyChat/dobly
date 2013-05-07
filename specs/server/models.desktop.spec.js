var Desktop = require('../../models/desktop');

describe('Desktop', function(){

	var desktop;

	beforeEach(function(){
		desktop = new Desktop();
	});

	describe('#removeConversation', function(){

		it('removes a conversation', function(){
			var conversationId = new mongo.Types.ObjectId();
			desktop.conversations.push(conversationId);

			expect(desktop.conversations).toContain(conversationId);
			desktop.removeConversation(conversationId);
			expect(desktop.conversations).not.toContain(conversationId);
		});

		it('does not throw error if conversation list empty', function(){
			function remove(){ 
				desktop.removeConversation('dummy');
			}

			expect(remove).not.toThrow();
		});

		it('does not remove any conversation if requested conversation is not present in list', function(){
			var conversationId = new mongo.Types.ObjectId();
			var otherId = new mongo.Types.ObjectId();

			desktop.conversations.push(conversationId);
			expect(desktop.conversations.length).toBe(1);

			desktop.removeConversation(otherId);
			expect(desktop.conversations.length).toBe(1);
		});
	});

	describe('#addConversation', function(){
		it('adds a conversation', function(){
			desktop.conversations.push(new mongo.Types.ObjectId());
			desktop.conversations.push(new mongo.Types.ObjectId());
			
			var conversationId = new mongo.Types.ObjectId();
			desktop.addConversation(conversationId);
			expect(desktop.conversations.length).toBe(3);
			expect(desktop.conversations).toContain(conversationId);
		});

		it('does not add the same conversation twice', function(){
			var conversationId = new mongo.Types.ObjectId();
			desktop.conversations.push(conversationId);

			desktop.addConversation(conversationId);
			expect(desktop.conversations.length).toBe(1);
		});
	});

	describe('#moveConversation', function(){
		it('moves conversation to new location', function(){
			var convo1 = new mongo.Types.ObjectId();
			var convo2 = new mongo.Types.ObjectId();
			var convo3 = new mongo.Types.ObjectId();

			desktop.conversations.push(convo1);
			desktop.conversations.push(convo2);
			desktop.conversations.push(convo3);

			verifyOrder(convo1, convo2, convo3);

			desktop.moveConversation(0, 1);

			verifyOrder(convo2, convo1, convo3);

			desktop.moveConversation(0, 2);

			verifyOrder(convo1, convo3, convo2);

			desktop.moveConversation(1, 1);

			verifyOrder(convo1, convo3, convo2);

			desktop.moveConversation(1, 2);

			verifyOrder(convo1, convo2, convo3);
		});

		function verifyOrder(first, second, third){
			expect(desktop.conversations[0]).toBe(first);
			expect(desktop.conversations[1]).toBe(second);
			expect(desktop.conversations[2]).toBe(third);
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