describe("change topic", function() {
	var nav;
	var changeTopic;	

	beforeEach(function() {
		nav = jasmine.createSpyObj('nav', ['desktop', 'changeTopic']);
		app.socket = createMockSocket();
		changeTopic = createChangeTopic(nav);
	});

	it("click", function() {
		var testConversation = createConversation(conversationTestData());
		spyOn(common, "delayedFocus");
		changeTopic.click(testConversation);

		expect(changeTopic.conversation).toEqual(testConversation);
		expect(nav.changeTopic).toHaveBeenCalled();
		expect(common.delayedFocus).toHaveBeenCalled();
	});

	it("update", function() {
		changeTopic.conversation = createConversation(conversationTestData());
		changeTopic.newTopic('some new topic');
		changeTopic.update();

		expect(app.socket.emit).toHaveBeenCalled();
		var arg0 = app.socket.emit.mostRecentCall.args[0];
		var arg1 = app.socket.emit.mostRecentCall.args[1];
		expect(arg0).toEqual('update_topic');
		expect(arg1.conversationId).toEqual('8');
		expect(arg1.newTopic).toEqual('some new topic');

		expect(changeTopic.newTopic()).toEqual('');
		expect(nav.desktop).toHaveBeenCalled();
	})

	it("update on click", function() {
		spyOn(changeTopic, "update");
		changeTopic.updateOnClick();
		expect(changeTopic.update).toHaveBeenCalled();
	});

	it("update on enter", function() {
		var testEvent = { keyCode: 13 };
		spyOn(changeTopic, "update");
		changeTopic.updateOnEnter(null, testEvent);
		expect(changeTopic.update).toHaveBeenCalled();
	});

	it("update on enter no update", function() {
		var testEvent = { keyCode: 10 };
		spyOn(changeTopic, "update");
		changeTopic.updateOnEnter(null, testEvent);
		expect(changeTopic.update).not.toHaveBeenCalled();
	})

	it("cancel", function() {
		changeTopic.cancel();

		expect(changeTopic.newTopic()).toEqual('');
		expect(nav.desktop).toHaveBeenCalled();
	});

	function conversationTestData() {
		return {
			_id: "8",
			createdBy: "fernando",
			groupId: "5",
			messages: [],
			timestamp: "2013-02-15T14:36:43.296Z",
			topic: "last in show",
			unread: 0,
			members: {
				forEntireGroup: true,
				users: []
			}
		};
	}
});