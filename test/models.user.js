var User = require('../models/user')
  , Group = require('../models/group');

describe('User', function() {

	var group, userData;

	beforeEach(function(done) {
		Group.create({ name: 'test'}, function(err, testGroup) {
			group = testGroup;
			userData = { username: 'test', password: 'cleartext', groupId: group._id };
			done(err);
		});
	});

	describe('#password encryption', function(){

		it('encrypts password before save', function(done) {
			User.create(userData, function(err, user){
				user.password.should.not.be.empty;
				user.password.should.not.eql('cleartext');
				done(err);
			});
		});

		it('does not encrypt password on update if password did not change', function(done) {
			User.create(userData, function(err, user){
				user.username = 'test-2';
					
				user.save(function(err){
					User.findOne({ username: 'test-2' }, function(err, updatedUser) {
						updatedUser.username.should.not.eql('test');
						updatedUser.password.should.eql(user.password);
						done(err);
					});
				});
			});
		});

		it('can compare password to determine successfull match', function(done){
			User.create(userData, function(err, user){
					user.comparePassword('cleartext', function(err, isMatch) {
					isMatch.should.be.ok;
					done(err);
				});
			});
		});

		it('can compare password to determine unsuccessfull match', function(done){
			User.create(userData, function(err, user){
				user.comparePassword('wrong', function(err, isMatch) {
					isMatch.should.not.be.ok;
					done(err);
				});
			});
		});
	});

	describe('#indexes', function(){
		
		it('requires usernames to be unique', function(done) {
			User.create(userData, function(err, user) {
				should.not.exist(err);

				userData.password = 'something else'
				User.create(userData, function(err) {
					err.should.not.be.null;
					err.err.should.include('dup key: { : "test" }')

					done();
				});
			});
		});
	});

	describe('#required fields', function() {
		
		it('username', function(done) {
			userData.username = null;
			User.create(userData, function(err) {
				err.should.not.be.null;
				err.errors.username.type.should.eql('required');

				done();
			});
		});

		it('password', function(done) {
			userData.password = null;
			User.create(userData, function(err) {
				err.should.not.be.null;
				err.errors.password.type.should.eql('required');

				done();
			});
		});

		it('group', function(done) {
			userData.groupId = null;
			User.create(userData, function(err) {
				err.should.not.be.null;
				err.errors.groupId.type.should.eql('required');

				done();
			});
		});
	});

	afterEach(function(done){
		User.find({ username: { $in: [ 'test', 'test-2' ] } }).remove(function(err) {
			Group.findOneAndRemove({ name: 'test'}, function(err){
				done(err);
			});
		});
	});
});