describe("message", function() {
	beforeEach(function(){
		spyOn(common, 'htmlEncode').andCallFake(function(string){
			return 'e-' + string;
		});
	});

	it("creates message", function() {
		var data = {
			_id: "5130abb8cc5e23dd79000184",
			content: "check", 
			conversationId: "123", 
			timestamp: Date.parse('2013.04.09 22:13:34'), 
			createdBy: "someone",
			_id: 'm-id'
		};

		var message = createMessage(data, true);
		expect(message.id).toBe('5130abb8cc5e23dd79000184');
		expect(message.content).toBe('e-check');
		expect(message.rawContent).toBe('check');
		expect(message.timestamp).toBe(common.formatTimestamp(data.timestamp));
		expect(message.createdBy).toBe('someone');
		expect(message.simpleTimestamp).toBe(common.formatTimestamp(data.timestamp));
		expect(message.confirmedSent()).toBe(true);
		expect(message.id).toBe('m-id');
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
			data.content = 'http://www.doblychat.com\n' +
							'see: http://www.google.com?query=string\n' +
							'hello world\n' + 
							'test https://myurl.com\n' +
							'another test www.yahoo.com';
			var message = createMessage(data, true);
			var expectedHtml = 'e-<a href="http://www.doblychat.com" target="_blank">http://www.doblychat.com</a>' +
								'<br />' +
								'e-see: <a href="http://www.google.com?query=string" target="_blank">http://www.google.com?query=string</a>' + 
								'<br />' +
								'e-hello world' +
								'<br />' +
								'e-test <a href="https://myurl.com" target="_blank">https://myurl.com</a>' +
								'<br />' +
								'e-another test <a href="http://www.yahoo.com" target="_blank">www.yahoo.com</a>';
			expect(message.content).toBe(expectedHtml);
		});
	});
});