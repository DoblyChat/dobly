var User = require('../models/user')
  , Group = require('../models/group')
  , mongo = require('mongoose');

mongo.connect('mongodb://localhost/proto');

function clean(create) {
	Group.findOne({ name: 'Founders'}, function(err, group){
		if(!err && group){
			group.remove(function(err){
				if(!err){
					console.log('Group and users removed');
					create();
				}
			});
		} else {
			create();
		}
	});
}

function create() {
	Group.create({ name: 'Founders' }, function(err) {
		if(!err) {
			console.log('Group created');
		}

		Group.findOne({ name: 'Founders'}, function(err, group){
			var users = [ 
							{ username: 'Fernando', password: 'pass', groupId: group._id }, 
							{ username: 'Carlos', password: 'pass', groupId: group._id } 
						];

			User.create(users, 
					function(err){
						if(!err){
							console.log('Users added');
						}
						process.exit(0);
					}
				);
			});
	});
}

clean(create);



