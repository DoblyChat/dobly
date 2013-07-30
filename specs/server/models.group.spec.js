var Group = require('../../lib/models/group'),
	User = require('../../lib/models/user');

describe('Group', function() {

	describe('#required fields', function(){
		afterEach(function(done){
			Group.findOneAndRemove({ name: 'test' }, done);
		});

		it('name is lower cased and rawName is not', function(done){
			Group.create({ name: 'TEST', rawName: 'TEST' }, function(err, group){
				expect(group.name).not.toBe('TEST');
				expect(group.name).toBe('test');
				expect(group.rawName).toBe('TEST');
				done();
			});
		});
	});

	describe('#remove', function(){
		var group;

		beforeEach(function(done){
			Group.create({ name: 'test', rawName: 'Test'}, function(err, newGroup){
				group = newGroup;
				done();
			});
		});

		it('removes all users associated with group', function(done){
			User.create([
					{ name: 'pepe', email: 'pepe@test.com', password: 'pass1', grpupId: group._id },
					{ name: 'pepe2', email: 'pepe2@test.com', password: 'pass2', grpupId: group._id },
				], 
				function(err, users){
					group.remove(function(err){
						User.count({ groupId: group._id }, function(err, count){
							expect(count).toBe(0);
							done();
						});
					});
				});
		});

		afterEach(function(done){
			group.remove(done);
		});
	});
});