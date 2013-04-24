describe("message", function() {
	beforeEach(function(){
		spyOn(common, 'htmlEncode').andCallFake(function(string){
			return 'e-' + string;
		});
	});

	it("creates message", function() {
		var data = {
			content: "check", 
			conversationId: "123", 
			timestamp: Date.parse('2013.04.09 22:13:34'), 
			createdBy: "someone"
		};

		var message = createMessage(data, true);
		expect(message.content).toBe('e-check');
		expect(message.timestamp).toBe(common.formatTimestamp(data.timestamp));
		expect(message.createdBy).toBe('someone');
		expect(message.simpleTimestamp).toBe(common.formatTimestamp(data.timestamp));
		expect(message.confirmedSent()).toBe(true);
	});

	describe('Content formatting', function(){
		var data;

		beforeEach(function(){
			data = {
				conversationId: "456", 
				timestamp: new Date(), 
				createdBy: "someone"
			};
		});

		it("creates an encoded multi line message", function() {
			data.content = "line 1\nline 2\nline 3";
			var message = createMessage(data, true);
			expect(message.content).toBe('e-line 1<br />e-line 2<br />e-line 3');
		});

		it('parses links within message', function(){
			data.content = "http://www.doblychat.com\nsee: http://www.google.com?query=string\nhello world\ntest https://myurl.com";
			var message = createMessage(data, true);
			var expectedHtml = 'e-<a href="http://www.doblychat.com" target="_blank">http://www.doblychat.com</a>' +
								'<br />' +
								'e-see: <a href="http://www.google.com?query=string" target="_blank">http://www.google.com?query=string</a>' + 
								'<br />' +
								'e-hello world' +
								'<br />' +
								'e-test <a href="https://myurl.com" target="_blank">https://myurl.com</a>';
			expect(message.content).toBe(expectedHtml);
		});
	});
});