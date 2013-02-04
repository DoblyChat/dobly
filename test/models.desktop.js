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

			desktop.conversations.should.include(conversationId);
			desktop.removeConversation(conversationId);
			desktop.conversations.should.not.include(conversationId);
		});

		it('does not throw error if conversation list empty', function(){
			(function(){ 
				desktop.removeConversation('dummy');
			}).should.not.throw();
		});

		it('does not remove any conversation if requested conversation is not present in list', function(){
			var conversationId = new mongo.Types.ObjectId();
			var otherId = new mongo.Types.ObjectId();

			desktop.conversations.push(conversationId);
			desktop.conversations.length.should.equal(1);

			desktop.removeConversation(otherId);
			desktop.conversations.length.should.equal(1);
		});
	});

	describe('#findOrCreateByUserId', function(){
		var userId, findOne;

		beforeEach(function(){
			userId = new mongo.Types.ObjectId();
			findOne = sinon.spy();
			Desktop.findOne = findOne;
		});

		it('creates desktop entry if one for user does not exist', function(done){

			Desktop.findOrCreateByUserId(userId, function(err, savedDesktop){ 
				arguments.length.should.eql(2);
				savedDesktop.userId.should.eql(userId);
				savedDesktop.conversations.should.not.be.null;
				done();
			});

			verifyFindOneCall(findOne);
			var findOneCallback = findOne.args[0][1];

			findOneCallback(null, null);
		});

		function verifyFindOneCall(findOne){
			findOne.called.should.equal(true);
			findOne.args[0][0].userId.should.eql(userId);
		}

		it('returns desktop entry if one for user already exists', function(){
			desktop.userId = userId;

			Desktop.findOrCreateByUserId(userId, function(err, savedDesktop){
				savedDesktop.userId.should.eql(userId);
			});

			verifyFindOneCall(findOne);
			var findOneCallback = findOne.args[0][1];

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
			desktop.conversations.should.not.be.null;
			desktop.conversations.length.should.equal(0);
		});
	});
});