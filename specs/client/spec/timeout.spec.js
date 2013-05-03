describe("timeout", function() {
	var timeout;
	var maxReconnects = 5;
	var testGlobal;

	beforeEach(function() {
		testGlobal = {
			location: {
				href: 'http://testing-dobly.com/conversations',
				host: 'testing-dobly.com',
			},
		};
		app.socket = createMockSocket();

		timeout = createTimeout(maxReconnects, testGlobal);
	});

	describe("reconnecting", function() {

	  	it("attempt 1", function() {
	  		doNotExpectTimeout(1);
	  	});

	  	it("attempt 2", function() {
	  		doNotExpectTimeout(2);
	  	});

	  	it("attempt 3", function() {
	  		doNotExpectTimeout(3);
	  	});

	  	it("attempt 4", function() {
	  		doNotExpectTimeout(4);
	  	});

	  	it("attempt 5", function() {
	  		expectTimeout(5);
	  	});
	});

	function doNotExpectTimeout(attempt) {
		app.socket.mockEmit('reconnecting', null, attempt);
		expect(testGlobal.location.href).toEqual('http://testing-dobly.com/conversations');
	}

	function expectTimeout(attempt) {
		app.socket.mockEmit('reconnecting', null, attempt);
		expect(testGlobal.location.href).toEqual('http://testing-dobly.com/timeout');
	}

	describe("start ping", function() {

		it("emit ping on interval", function() {
			spyOn(window, "setInterval");
			timeout.startPing();

			expect(window.setInterval).toHaveBeenCalledWith(timeout.emitPing, 5000);
		});

		it("handle timeout", function() {
			spyOn(window, "setInterval");
			timeout.startPing();

			app.socket.mockEmit('timeout');
			expectTimeout();
		});

		it("emit ping", function() {
			timeout.emitPing();
			expect(app.socket.emit).toHaveBeenCalledWith('ping');
		});
	});
});