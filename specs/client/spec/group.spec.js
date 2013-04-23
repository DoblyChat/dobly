describe("group", function() {
	var group;
	var testData;
	var fernando, carlos, fido;

	beforeEach(function() {
		app.socket = createMockSocket();
		testData = {
			name: 'some test group',
			users: [ 
				{ username: 'fernando', _id: '123' }, 
				{ username: 'carlos', _id: '456'},
				{ username: 'fido', _id: '789'}
			],
		};

		group = createGroup(testData);

		fernando = group.users()[0];
		carlos = group.users()[1];
		fido = group.users()[2];
	});

	function createMockSocket() {
		var self = {};

		var handlers = [];

		self.on = function(eventName, handler) {
			handlers[eventName] = handler;
		};

		self.emit = jasmine.createSpy();

		self.mockEmit = function(eventName, param) {
			handlers[eventName](param);
		};

		return self;
	}

	it("create group", function() {
		expect(group.name).toBe('some test group');
		expect(group.users().length).toBe(3);
		expect(app.socket.emit).toHaveBeenCalledWith('request_online_users');

		expect(fernando.username).toEqual('fernando');
		expect(fernando.online()).toBe(false);
		expect(fernando.id).toBe('123');
		expect(carlos.online()).toBe(false);
		expect(fido.online()).toBe(false);
	});

	it("receive online users", function() {
		var onlineUsers = [ '123', '789' ];
		app.socket.mockEmit('receive_online_users',onlineUsers);

		expect(fernando.online()).toBe(true);
		expect(carlos.online()).toBe(false);
		expect(fido.online()).toBe(true);
	});

	it("user connected", function() {
		app.socket.mockEmit('user_connected', '456');

		expect(fernando.online()).toBe(false);
		expect(carlos.online()).toBe(true);
		expect(fido.online()).toBe(false);
	});

	it("user disconnected", function() {		
		app.socket.mockEmit('user_connected', '123');
		expect(fernando.online()).toBe(true);

		app.socket.mockEmit('user_disconnected', '123');
		expect(fernando.online()).toBe(false);
	});
});