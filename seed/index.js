var User = require('../models/user')
  , Group = require('../models/group')
  , mongo = require('mongoose');

var databaseUri = process.env.MONGOLAB_URI || 'mongodb://localhost/proto';
mongo.connect(databaseUri);

function clean(create) {
	Group.findOne({ name: 'Founders'}, function(err, group){
		if (err) {
			console.log(err);
		}
		if(!err && group){
			group.remove(function(err){
				if(!err){
					console.log('Group and users removed');
					create();
				} else {
					console.log(err);
				}
			});
		} else {
			create();
		}
	});
}

function create() {
	Group.create({ name: 'Founders' }, function(err, group) {
		if(!err) {
			console.log('Group created');
		}

		var users = [ 
			{ username: 'Fernando', password: 'pass', groupId: group._id }, 
			{ username: 'Carlos', password: 'pass', groupId: group._id } 
		];

		User.create(users, 
				function(err){
					if(!err){
						console.log('Users added');
					} else {
						console.log(err);
					}
					process.exit(0);
				}
		);
	});
}

clean(create);



