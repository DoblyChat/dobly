var Desktop = require('../models/desktop');

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

	describe('#findOrCreateByUserId', function(){
		var userId, findOne;

		beforeEach(function(){
			userId = new mongo.Types.ObjectId();
			findOne = jasmine.createSpy();
			Desktop.findOne = findOne;
		});

		it('creates desktop entry if one for user does not exist', function(done){

			Desktop.findOrCreateByUserId(userId, function(err, savedDesktop){ 
				expect(arguments.length).toBe(2);
				expect(savedDesktop.userId).toBe(userId);
				expect(savedDesktop.conversations).not.toBe(null);
				done();
			});

			verifyFindOneCall(findOne);
			var findOneCallback = findOne.mostRecentCall.args[1];

			findOneCallback(null, null);
		});

		function verifyFindOneCall(findOne){
			expect(findOne).toHaveBeenCalled();
			expect(findOne.mostRecentCall.args[0].userId).toBe(userId);
		}

		it('returns desktop entry if one for user already exists', function(){
			desktop.userId = userId;

			Desktop.findOrCreateByUserId(userId, function(err, savedDesktop){
				expect(savedDesktop.userId).toBe(userId);
			});

			verifyFindOneCall(findOne);
			var findOneCallback = findOne.mostRecentCall.args[1];

			findOneCallback(null, desktop);
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