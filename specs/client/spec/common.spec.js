describe("common", function() {
	it("formats time stamp when date", function() {
		var april9 = Date.parse('2013.04.09 22:13:34');
		expect(common.formatTimestamp(april9)).toBe('4/9 10:13 PM');
	});

	it("formats time stamp when string", function() {
		var april9 = '2013.04.09 22:13:34';
		expect(common.formatTimestamp(april9)).toBe('4/9 10:13 PM');
	});

	it("formats today's time stamp", function() {
		var now = Date.now();  	
		expect(common.formatTimestamp(now)).toBe(now.toString('h:mm tt'));
	});

	it("formats simple time stamp when date", function() {
		var april9 = Date.parse('2013.04.09 22:13:34');
		expect(common.formatSimpleTimestamp(april9)).toBe('4/9');
	});

	it("formats simple time stamp when string", function() {
		var april9 = '2013.04.09 22:13:34';
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

	it("delayed focus", function() {
	  	spyOn(window, 'setTimeout');
	  	common.delayedFocus('.some-selector');
	  	expect(window.setTimeout).toHaveBeenCalled();
	  	expect(window.setTimeout.mostRecentCall.args[1]).toBe(400);
	});

	it("delayed focus with delay", function() {
	  	spyOn(window, 'setTimeout');
	  	common.delayedFocus('.some-selector', 1000);
	  	expect(window.setTimeout).toHaveBeenCalled();
	  	expect(window.setTimeout.mostRecentCall.args[1]).toBe(1000);
	});

	describe("focus", function() {

		beforeEach(function() {
		  	loadFixtures('focus.fixture.html');
		});

		it("when chrome", function() {
		  	spyOn(browser, 'isSafari').andReturn(false);
		  	spyOn(browser, 'isIE').andReturn(false);

		  	common.focus('textarea');

		  	expect($('textarea')).toBeFocused();
		});

		it("when safari", function() {
		  	spyOn(browser, 'isSafari').andReturn(true);
		  	spyOn(browser, 'isIE').andReturn(false);

		  	common.focus('textarea');

		  	expect($('textarea')).not.toBeFocused();
		});

		it("when ie", function() {
		  	spyOn(browser, 'isSafari').andReturn(false);
		  	spyOn(browser, 'isIE').andReturn(true);

		  	common.focus('textarea');

		  	expect($('textarea')).not.toBeFocused();
		});
	});
});

describe("browser", function() {
	it("is safari", function() {
		spyOn(browser, 'getUserAgent').andReturn('safari');
		expect(browser.isSafari()).toBe(true);
		expect(browser.isIE()).toBe(false);
	});

	it("is ie", function() {
		spyOn(browser, 'getUserAgent').andReturn('msie');
		expect(browser.isIE()).toBe(true);
		expect(browser.isSafari()).toBe(false);
	});

	it("is not safari, it is chrome", function() {
		spyOn(browser, 'getUserAgent').andReturn('safari chrome');
		expect(browser.isSafari()).toBe(false);
	});
});