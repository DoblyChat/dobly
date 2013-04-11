describe("common", function() {
	it("formats some time stamp", function() {
		var april9 = Date.parse('2013.04.09 22:13:34');
		expect(common.formatTimestamp(april9)).toBe('4/9 10:13 PM');
	});

	it("formats today's time stamp", function() {
		var now = Date.now();  	
		expect(common.formatTimestamp(now)).toBe(now.toString('h:mm tt'));
	});

	it("formats some simple time stamp", function() {
		var april9 = Date.parse('2013.04.09 22:13:34');
		expect(common.formatSimpleTimestamp(april9)).toBe('4/9');
	});

	it("formats today's simple time stamp", function() {
		var now = Date.now();  	
		expect(common.formatSimpleTimestamp(now)).toBe(now.toString('h:mm tt'));
	});

	it("enter key is pressed", function() {
		var testEvent = { keyCode: 13 };
		expect(common.enterKeyPressed(testEvent)).toBe(true);
	});

	it("enter key is not pressed", function() {
		var testEvent = { keyCode: 10 };
		expect(common.enterKeyPressed(testEvent)).toBe(false);
	});
});

describe("browser", function() {
	it("is safari", function() {
		spyOn(browser, 'getUserAgent').andReturn('safari');
		expect(browser.isSafari()).toBe(true);
		expect(browser.isIE()).toBe(false);
	});

	it("is IE", function() {
		spyOn(browser, 'getUserAgent').andReturn('msie');
		expect(browser.isIE()).toBe(true);
		expect(browser.isSafari()).toBe(false);
	});

	it("is not safari, it is chrome", function() {
		spyOn(browser, 'getUserAgent').andReturn('safari chrome');
		expect(browser.isSafari()).toBe(false);
	});
});