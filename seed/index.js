var User = require('../lib/models/user')
  , Group = require('../lib/models/group')
  , mongo = require('mongoose');

var databaseUri = process.env.MONGOLAB_URI || 'mongodb://localhost/proto';
mongo.connect(databaseUri);

function clean(create) {
	Group.findOne({ name: 'founders'}, function(err, group){
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
	Group.create({ name: 'Founders', rawName: 'Founders' }, function(err, group) {
		if(!err) {
			console.log('Group created');
		}

		var users = [ 
			{ firstName: 'Fernando', lastName: 'Trigoso', email: 'perudise@gmail.com', password: 'pass', groupId: group._id }, 
			{ firstName: 'Carlos', lastName: 'Atencio', email: 'atecarlos@gmail.com', password: 'pass', groupId: group._id } 
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



