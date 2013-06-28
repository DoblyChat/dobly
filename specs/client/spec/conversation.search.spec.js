describe("conversation search", function() {

	var testData;
	var conversation;
	var search;

	beforeEach(function() {
	    testData = testDataConversation();
	});

	it("creation", function() {
	  	conversation = createConversation(testData);
	  	search = createConversationSearch(conversation);

	  	expect(search.matches.length).toBe(0);
	  	expect(search.query()).toEqual('');
	  	expect(search.exhausted()).toBe(false);
	  	expect(search.searching()).toBe(false);
	});

	describe("next", function() {

		beforeEach(function() {
		    conversation = createConversation(testData);
		    search = createConversationSearch(conversation);
		});

	  	it("does not search when empty", function() {	  		
	  		search.query('');
	  		search.next();

	  		expect(search.exhausted()).toBe(false);
	  		expect(search.matches.length).toBe(0);
	  	});

	  	it("resets", function() {
	  	  
	  	});

	  	it("does not reset", function() {
	  	  
	  	});

	  	it("finds next", function() {
	  	  	spyOn(search, "scrollToMatchAndHighlight");
	  	  	spyOn(conversation.ui, "resizeBodyFromHeaderChange");

	  	  	search.query('beta');
	  	  	search.next();

	  	  	expect(search.scrollToMatchAndHighlight).toHaveBeenCalled();
	  	  	expect(conversation.ui.resizeBodyFromHeaderChange).toHaveBeenCalled();
	  	  	expect(search.searching()).toBe(false);
	  	  	expect(search.foundMessage.id).toEqual('b');
	  	  	expect(search.foundMessage.offset).toBe(3);
	  	});

	  	it("does not find next", function() {
	  	  
	  	});

	  	it("scrolls to match when next found", function() {
	  	  
	  	});

	  	it("highlights match when next found", function() {
	  	  
	  	});

	  	it("pages if next not found", function() {
	  	  
	  	});

	  	it("does not page", function() {
	  	  
	  	});

	  	it("pages", function() {
	  	  
	  	});
	});

	function testDataConversation() {
        return {
            _id: "8",
            createdBy: "fernando",
            groupId: "5",
            messages: [ testDataMessageAlpha(), testDataMessageBeta(), testDataMessageCharlie(), testDataMessageDelta() ],
            timestamp: "2013-02-15T14:36:43.296Z",
            topic: "some topic",
            unread: 1,
            totalMessages: 3,
            members: {
                entireGroup: true,
                users: []
            }
        };
    }

    function testDataMessageAlpha() {
        return {
        	_id: 'a',
            content: "alpha", 
            conversationId: "8", 
            timestamp: Date.parse('2013.04.09 22:13:34'), 
            createdBy: "carlos"
        };
    }

    function testDataMessageBeta() {
        return {
        	_id: 'b',
            content: "beta", 
            conversationId: "8", 
            timestamp: Date.parse('2013.04.09 22:14:14'), 
            createdBy: "fernando"
        };
    }

    function testDataMessageCharlie() {
        return {
        	_id: 'c',
            content: "charlie", 
            conversationId: "8", 
            timestamp: Date.parse('2013.04.09 22:15:23'), 
            createdBy: "carlos"
        };
    }

    function testDataMessageDelta() {
        return {
        	_id: 'd',
            content: "delta", 
            conversationId: "8", 
            timestamp: Date.parse('2013.04.09 23:18:44'), 
            createdBy: "fernando"
        };
    }
});