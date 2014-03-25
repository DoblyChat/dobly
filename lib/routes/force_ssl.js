'use strict';

exports.config = function(app) {
	
	var requestShouldBeSecured = function(req) {
		var isDevelopment = process.env.NODE_ENV && process.env.NODE_ENV === "development";
		return req.headers['x-forwarded-proto'] != 'https' && !isDevelopment;
	};

	app.get('*', function(req, res, next) {
		if (requestShouldBeSecured(req)) {
			res.redirect('https://' + process.env.DOMAIN_NAME + req.url);
		}
		else {
			next();
		}
	});

	app.post('*', function(req, res, next) {
		if (requestShouldBeSecured(req)) {
			var badRequest = 400;
			res.send(badRequest);
		} else {
			next();
		}
	});
};