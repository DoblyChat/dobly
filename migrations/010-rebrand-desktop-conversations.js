exports.up = function(next){

	var Desktop = require('../lib/models/desktop'),
		async = require('async'),
		helper = require('./helper');

	helper.connect(function() {
		execute();
	});

	function execute() {
		Desktop.find({}, function(err, desktops) {
			helper.logError(err);

			async.each(desktops, update, function(err) {
				helper.logError(err);
				helper.disconnect(next);
			});

			function update(desktop, callback) {
				if (desktop._doc.conversations) {
					desktop.collaborationObjects = desktop._doc.conversations;
					desktop.save(callback);
				} else {
					callback();
				}
			}
		});
	}
};

exports.down = function(next){
	next();
};
