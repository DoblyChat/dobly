var User = require('../models/user');

describe('User', function() {

	describe('#password encryption', function(){

		var user;

		beforeEach(function() {
			user = new User({ username: 'test', password: 'cleartext' });
		});

		it('encrypts password before save', function(done) {
			user.save(function(err) {
				User.findOne({ username: 'test'}, function(err, savedUser) {
					savedUser.password.should.not.be.empty;
					savedUser.password.should.not.eql('cleartext');
					done(err);
				});
			});
		});

		it('does not encrypt password on update if password did not change', function(done) {
			user.save(function(err) {

				User.findOne({ username: 'test' }, function(err, savedUser) {
					savedUser.username = 'test-2';
					
					savedUser.save(function(err){
						User.findOne({ username: 'test-2' }, function(err, updatedUser) {
							updatedUser.username.should.not.eql('test');
							updatedUser.password.should.eql(savedUser.password);

							done(err);
						});
					});

				});
			});
		});

		it('can compare password to determine successfull match', function(done){
			user.save(function(err) {
				User.findOne({ username: 'test'}, function(err, savedUser) {
					savedUser.comparePassword('cleartext', function(err, isMatch) {
						isMatch.should.be.ok;
						done(err);
					});
				});
			});
		});

		it('can compare password to determine unsuccessfull match', function(done){
			user.save(function(err) {
				User.findOne({ username: 'test'}, function(err, savedUser) {
					savedUser.comparePassword('wrong', function(err, isMatch) {
						isMatch.should.not.be.ok;
						done(err);
					});
				});
			});
		});
	});

	describe('#indexes', function(){
		it('has a unique index for usernames', function(done) {
			var user = new User({ username: 'username', password: 'something' });
			
			user.save(function(err) {
				var anotherUser = new User({ username: 'username', password: 'something else'});

				anotherUser.save(function(err) {
					err.should.not.be.null;
					err.err.should.include('dup key: { : "username" }')

					done();
				});
			});
		});
	});

	afterEach(function(done){
		User.find({ username: { $in: [ 'test', 'test-2' ] } }).remove(function(err) {
			done(err);
		});
	});
});