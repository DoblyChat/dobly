describe("message", function() {
	it("creates message", function() {
		var data = {
			content: "check", 
			conversationId: "123", 
			timestamp: Date.parse('2013.04.09 22:13:34'), 
			createdBy: "someone"
		};

		var message = createMessage(data, true);
		expect(message.lines[0]).toBe('check');
		expect(message.timestamp).toBe(common.formatTimestamp(data.timestamp));
		expect(message.createdBy).toBe('someone');
		expect(message.simpleTimestamp).toBe(common.formatTimestamp(data.timestamp));
		expect(message.confirmedSent()).toBe(true);
	});

	it("creates multi line message", function() {
		var data = {
			content: "line 1\nline 2\nline 3",
			conversationId: "456", 
			timestamp: new Date(), 
			createdBy: "someone"
		};

		var message = createMessage(data, true);
		expect(message.lines[0]).toBe('line 1');
		expect(message.lines[1]).toBe('line 2');
		expect(message.lines[2]).toBe('line 3');
	});
});