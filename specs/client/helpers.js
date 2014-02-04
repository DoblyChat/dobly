(function(global){
	'use strict';

	global.app = {};
	global.app.group = {};

	global.createMockSocket = function() {
		var self = {};

		var handlers = [];

		self.on = function(eventName, handler) {
			handlers[eventName] = handler;
		};

		self.emit = jasmine.createSpy('emit');

		self.mockEmit = function(eventName, param1, param2) {
			handlers[eventName](param1, param2);
		};

		return self;
	};

	var _loadFixtures = global.loadFixtures;

	global.loadFixtures = function(fixture){
		_loadFixtures('../../../specs/client/fixtures/' + fixture);
	};

	global.aproximateDate = function(date) {
        return Math.ceil(date.valueOf() / 1000);
    };

})(window);

