var User = require('../../models/user')
  , Group = require('../../models/group');

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
				expect(user.password).not.toBe('');
				expect(user.password).not.toBe('cleartext');
				done(err);
			});
		});

		it('does not encrypt password on update if password did not change', function(done) {
			User.create(userData, function(err, user){
				user.username = 'test-2';
					
				user.save(function(err){
					User.findOne({ username: 'test-2' }, function(err, updatedUser) {
						expect(updatedUser.username).not.toBe('test');
						expect(updatedUser.password).toBe(user.password);
						done(err);
					});
				});
			});
		});

		it('can compare password to determine successfull match', function(done){
			User.create(userData, function(err, user){
					user.comparePassword('cleartext', function(err, isMatch) {
					expect(isMatch).toBeTruthy();
					done(err);
				});
			});
		});

		it('can compare password to determine unsuccessfull match', function(done){
			User.create(userData, function(err, user){
				user.comparePassword('wrong', function(err, isMatch) {
					expect(isMatch).not.toBeTruthy();
					done(err);
				});
			});
		});
	});

	describe('#username', function(){
		
		it('must be unique', function(done) {
			User.create(userData, function(err, user) {
				expect(err).toBeNull();

				userData.password = 'something else'
				User.create(userData, function(err) {
					expect(err).not.toBe(null);
					expect(err.err).toContain('dup key: { : "test" }')

					done();
				});
			});
		});

		it('is lower cased automatically', function(done){
			userData.username = 'TEST';

			User.create(userData, function(err, user){
				expect(user.username).not.toBe('TEST');
				expect(user.username).toBe('test');
				done();
			});
		});
	});

	describe('#required fields', function() {
		
		function requiredFieldTest(field, done) {
			userData[field] = null;
			User.create(userData, function(err) {
				checkRequiredFieldError(err, field);
				done();
			});
		};

		it('username', function(done) {
			requiredFieldTest('username', done);
		});

		it('password', function(done) {
			requiredFieldTest('password', done);
		});

		it('group', function(done) {
			requiredFieldTest('groupId', done);
		});
	});

	describe('#findExcept', function(){
		var firstUser, secondUser, thirdUser;

		beforeEach(function(done){
			User.create([
				{ 
					groupId: group._id,
					username: 'find-1',
					password: 'pass'
				},
				{
					groupId: group._id,
					username: 'find-2',
					password: 'pass'
				},
				{
					groupId: group._id,
					username: 'find-3',
					password: 'pass'
				}
			], function(err){
				firstUser = arguments[1];
				secondUser = arguments[2];
				thirdUser = arguments[3];
				done(err);
			});
		});

		it('finds user excluding middle', function(done){
			User.findExcept(secondUser._id, group._id, function(err, foundUsers){
				expect(foundUsers.length).toBe(2);
				expect(foundUsers[0].username).toBe(firstUser.username);
				expect(foundUsers[1].username).toBe(thirdUser.username);
				done(err);
			});
		});
	});

	afterEach(function(done){
		group.remove(done);
	});
});