var app = {};

function createMockSocket() {
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
}