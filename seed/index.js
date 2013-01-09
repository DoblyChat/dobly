var User = require('../models/user');

exports.set = function(){
	User.create(
		{ username: 'Carlos', password: 'pass' }, 
		function(err){
			if(!err){
				console.log('User Carlos added')

			}
		}
	);

	User.create(
		{ username: 'Fernando', password: 'pass' }, 
		function(err){
			if(!err){
				console.log('User Fernando added')

			}
		}
	);
};