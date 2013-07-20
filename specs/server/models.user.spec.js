var User = require('../../models/user'),
	Group = require('../../models/group');

describe('User', function() {

	var group, userData;

	beforeEach(function(done) {
		Group.create({ name: 'test'}, function(err, testGroup) {
			group = testGroup;
			userData = { name: 'test me', email: 'model-test@dobly.com', password: 'cleartext', groupId: group._id };
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
				user.email = 'test-2@email.com';
					
				user.save(function(err){
					User.findOne({ email: 'test-2@email.com' }, function(err, updatedUser) {
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

	describe('#name', function(){
		it('is lower cased automatically', function(done){
			userData.name = 'TEST ME';

			User.create(userData, function(err, user){
				expect(user.name).not.toBe('TEST ME');
				expect(user.name).toBe('test me');
				done();
			});
		});
	});

	describe('#email', function(){
		
		it('must be unique', function(done) {
			User.create(userData, function(err, user) {
				expect(err).toBeNull();

				userData.password = 'something else';
				User.create(userData, function(err) {
					expect(err).not.toBe(null);
					expect(err.err).toContain('dup key: { : "model-test@dobly.com" }');

					done();
				});
			});
		});

		it('is lower cased automatically', function(done){
			userData.email = 'UPPER.CASE@EMAIL.COM';

			User.create(userData, function(err, user){
				expect(user.email).not.toBe('UPPER.CASE@EMAIL.COM');
				expect(user.email).toBe('upper.case@email.com');
				done();
			});
		});

		it('must be formatted as an email', function(){
			userData.email = 'not.an.email';

			User.create(userData, function(err, user){
				expect(err).not.toBeNull();
				expect(err.errors.email.type).toBe('Invalid email');
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
		}

		it('name', function(done) {
			requiredFieldTest('name', done);
		});

		it('email', function(done){
			requiredFieldTest('email', done);
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
					name: 'find-1',
					email: 'em-1@dobly.com',
					password: 'pass'
				},
				{
					groupId: group._id,
					name: 'find-2',
					email: 'em-2@dobly.com',
					password: 'pass'
				},
				{
					groupId: group._id,
					name: 'find-3',
					email: 'em-3@dobly.com',
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
				expect(foundUsers[0].email).toBe(firstUser.email);
				expect(foundUsers[1].email).toBe(thirdUser.email);
				done(err);
			});
		});
	});

	afterEach(function(done){
		group.remove(done);
	});
});