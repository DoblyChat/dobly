define(['knockout', 'client/conversation.search', 'client/conversation', 'client/common'], function(ko, createConversationSearch, createConversation, common){
	describe("conversation search", function() {

		var testData;
		var conversation;
		var search;

		beforeEach(function() {
			app.topicSearch = ko.observable('');
		    testData = testDataConversation();
		    conversation = createConversation(testData);
		  	search = createConversationSearch(conversation);
		});

		afterEach(function(){
			app.topicSearch = undefined;
		});

		it("creation", function() {
		  	expect(search.matches.length).toBe(0);
		  	expect(search.query()).toEqual('');
		  	expect(search.exhausted()).toBe(false);
		  	expect(search.searching()).toBe(false);
		});

		it("done", function() {
			spyOn(search, "reset");
			spyOn(conversation.ui, "hideSearch");

		  	search.done();

		  	expect(search.query()).toEqual('');
		  	expect(search.reset).toHaveBeenCalled();
		  	expect(conversation.ui.hideSearch).toHaveBeenCalled();
		});

		it("show", function() {
			spyOn(conversation.ui, "showSearch");

			search.show();

			expect(conversation.ui.showSearch).toHaveBeenCalled();
		});

		describe("next", function() {

			beforeEach(function() {
			    spyOn(conversation.ui, "resizeBodyFromHeaderChange");
			});

		  	it("does not search when empty", function() {	  		
		  		search.query('');
		  		search.next();

		  		expect(search.exhausted()).toBe(false);
		  		expect(search.matches.length).toBe(0);
		  	});

		  	it("resets", function() {
		  	  	search.query('some');
		  	  	var match = jasmine.createSpyObj('match', ['removeClass', 'removeHighlight']);
		  	  	search.matches.push(match);
		  	  	search.foundMessage.id = 'z';
		  	  	search.foundMessage.offset = 10;
		  	  	spyOn(search, "reset").andCallThrough();

		  	  	search.next();

		  	  	expect(search.matches.length).toBe(0);
		  	  	expect(match.removeClass).toHaveBeenCalled();
		  	  	expect(match.removeHighlight).toHaveBeenCalled();
		  	  	expect(search.foundMessage.id).toEqual('');
		  	  	expect(search.foundMessage.offset).toBe(-1);
		  	  	expect(conversation.ui.resizeBodyFromHeaderChange).toHaveBeenCalled();
		  	  	expect(search.reset).toHaveBeenCalled();
		  	});

		  	it("does not reset", function() {
		  		spyOn(search, "scrollToMatchAndHighlight");

		  	  	search.query('beta');
		  	  	search.next();

		  	  	spyOn(search, "reset");
		  	  	search.next();

		  	  	expect(search.reset).not.toHaveBeenCalled();
		  	});

		  	it("finds next", function() {
		  	  	spyOn(search, "scrollToMatchAndHighlight");

		  	  	search.query('beta');
		  	  	search.next();

		  	  	expect(search.scrollToMatchAndHighlight).toHaveBeenCalled();
		  	  	expect(conversation.ui.resizeBodyFromHeaderChange).toHaveBeenCalled();
		  	  	expect(search.searching()).toBe(false);
		  	  	expect(search.foundMessage.id).toEqual('b');
		  	  	expect(search.foundMessage.offset).toBe(3);
		  	});

		  	it("does not find next", function() {
		  	  	search.query('zeta');
		  	  	search.next();

		  	  	expect(search.matches.length).toBe(0);
		  	  	expect(search.foundMessage.id).toEqual('');
		  	  	expect(search.foundMessage.offset).toBe(-1);
		  	});

		  	it("pages if next not found", function() {
		  		spyOn(search, "page");
		  		spyOn(conversation, "allMessagesLoaded").andReturn(false);

		  	  	search.query('zeta');
		  	  	search.next();

		  	  	expect(search.page).toHaveBeenCalled();
		  	});

		  	it("does not page", function() {
		  		spyOn(search, "page");
		  		spyOn(conversation, "allMessagesLoaded").andReturn(true);

		  	  	search.query('zeta');
		  	  	search.next();

		  	  	expect(search.page).not.toHaveBeenCalled();
		  	});

		  	it("pages", function() {
		  		spyOn(search, "next");
		  		spyOn(conversation.ui.scroll, "adjust");

		  	  	app.socket = createMockSocket();

		  	  	search.page();

		  	  	expect(app.socket.emit).toHaveBeenCalled();

		  	  	var operation = app.socket.emit.mostRecentCall.args[0];
		  	  	expect(operation).toEqual('read_next_messages');

		  	  	var params = app.socket.emit.mostRecentCall.args[1];
		  	  	expect(params.page).toBe(1);
		  	  	expect(params.conversationId).toEqual("8");

		  	  	var callback = app.socket.emit.mostRecentCall.args[2];
		  	  	var newMessages = [ testDataMessageEcho(), testDataMessageFoxtrot() ];
		  	  	callback(newMessages);

		  	  	expect(search.next).toHaveBeenCalled();
		  	  	expect(conversation.ui.scroll.adjust).toHaveBeenCalled();
		  	});

		  	it("next on enter false", function() {
		  	  	spyOn(common, 'enterKeyPressed').andReturn(false);
		  	  	spyOn(search, "next");

		  	  	var returnValue = search.nextOnEnter(null, {});

		  	  	expect(search.next).not.toHaveBeenCalled();
		  	  	expect(returnValue).toBe(true);
		  	});

		  	it("next on enter true", function() {
		  	  	spyOn(common, 'enterKeyPressed').andReturn(true);
		  	  	spyOn(search, "next");

		  	  	var returnValue = search.nextOnEnter(null, {});

		  	  	expect(search.next).toHaveBeenCalled();
		  	  	expect(returnValue).toBe(false);
		  	});
		});

		describe("previous", function() {
		  	beforeEach(function() {
			    testData = testDataConversationForPrevious();
		  		conversation = createConversation(testData);
		  		search = createConversationSearch(conversation);
		  		spyOn(conversation.ui, "resizeBodyFromHeaderChange");
		  	  	spyOn(search, "scrollToMatchAndHighlight");
			});

		  	it("does not search when empty", function() {	  		
		  		search.query('');
		  		search.prev();

		  		expect(search.exhausted()).toBe(false);
		  		expect(search.matches.length).toBe(0);
		  	});

		  	it("resets", function() {
		  	  	search.query('some');
		  	  	spyOn(search, "reset");

		  	  	search.prev();
		  	  	expect(search.reset).toHaveBeenCalled();
		  	});

		  	it("does not reset", function() {
		  	  	search.query('beta');
		  	  	search.prev();

		  	  	spyOn(search, "reset");
		  	  	search.prev();

		  	  	expect(search.reset).not.toHaveBeenCalled();
		  	});

		  	it("finds previous", function() {	  	  	
		  	  	search.query('alpha');

		  	  	search.next();
		  	  	expect(search.foundMessage.id).toEqual('a2');

		  	  	search.next();
		  	  	expect(search.foundMessage.id).toEqual('a');

		  	  	search.prev();
		  	  	expect(search.foundMessage.id).toEqual('a2')
		  	});

		  	it("does not find previous", function() {	  	  	
		  	  	search.query('alpha');

		  	  	search.next();
		  	  	expect(search.foundMessage.id).toEqual('a2');

		  	  	search.prev();
		  	  	expect(search.foundMessage.id).toEqual('a2');
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

	    function testDataConversationForPrevious() {
	    	return {
	            _id: "8",
	            createdBy: "fernando",
	            groupId: "5",
	            messages: [ testDataMessageAlpha(), testDataMessageAlpha2(), testDataMessageCharlie(), testDataMessageDelta() ],
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

	    function testDataMessageAlpha2() {
	        return {
	        	_id: 'a2',
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

	    function testDataMessageEcho() {
	        return {
	        	_id: 'e',
	            content: "echo", 
	            conversationId: "8", 
	            timestamp: Date.parse('2013.04.09 22:15:23'), 
	            createdBy: "carlos"
	        };
	    }

	    function testDataMessageFoxtrot() {
	        return {
	        	_id: 'f',
	            content: "foxtrot", 
	            conversationId: "8", 
	            timestamp: Date.parse('2013.04.09 23:18:44'), 
	            createdBy: "fernando"
	        };
	    }
	});
});