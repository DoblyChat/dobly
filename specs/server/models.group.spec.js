var Group = require('../../models/group'),
	User = require('../../models/user');

describe('Group', function() {

	describe('#name', function(){
		it('is lower cased automatically', function(done){
			Group.create({ name: 'TEST' }, function(err, group){
				expect(group.name).not.toBe('TEST');
				expect(group.name).toBe('test');
				done();
			});
		});
	});

	describe('#remove', function(){
		var group;

		beforeEach(function(done){
			Group.create({ name: 'test'}, function(err, newGroup){
				group = newGroup;
				done();
			});
		});

		it('removes all users associated with group', function(done){
			User.create([
					{ username: 'pepe', password: 'pass1', grpupId: group._id },
					{ username: 'pepe2', password: 'pass2', grpupId: group._id },
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
			group.remove(function(err){
				done();
			});
		});
	});
});