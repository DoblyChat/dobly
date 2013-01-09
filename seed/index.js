var User = require('../models/user')
  , mongo = require('mongoose');

mongo.connect('mongodb://localhost/proto');

var users = [ { username: 'Fernando', password: 'pass' }, { username: 'Carlos', password: 'pass' } ];

User.create(users, 
		function(err){
			if(!err){
				console.log('Users added');
			}
			process.exit(0);
		}
	);