describe("desktop", function() {

	var desktop;
	var desktopData;
	var allConversations;

	describe("3 conversations", function() {

		beforeEach(function() {
			desktopData = {
	 			_id: '1',
	 			userId: '2',
	 			conversations: [ 'A', 'C', 'E' ]
	 		};

			allConversations = testDataAllConversations();
			allConversations[0].activateOnTheLeft = jasmine.createSpy('activateOnTheLeft');
			allConversations[2].activateOnTheRight = jasmine.createSpy('activateOnTheRight');

			desktop = createDesktop(desktopData, allConversations);
		});

		describe("creation", function() {

		  	it("id and loading", function() {
		  		expect(desktop.id).toBe('1');
		  		expect(desktop.loading()).toBe(false);
		  	});

		  	it("conversations", function() {
		  		expect(desktop.conversations().length).toBe(3);
		  	  	expect(desktop.conversations()[0]).toEqual(allConversations[0]);
		  	  	expect(desktop.conversations()[1]).toEqual(allConversations[2]);
		  	  	expect(desktop.conversations()[2]).toEqual(allConversations[4]);
		  	});

		  	it("rendered conversations", function() {
		  		expect(desktop.renderedConversations().length).toBe(2);
		  	  	expect(desktop.renderedConversations()[0]).toEqual(allConversations[0]);
		  	  	expect(desktop.renderedConversations()[1]).toEqual(allConversations[2]);
		  	});

		  	it("left conversation", function() {
		  		expect(desktop.leftConversation()).toEqual(allConversations[0]);
		  	  	expect(desktop.leftConversation().activateOnTheLeft).toHaveBeenCalled();
		  	  	expect(desktop.hasLeftConversation()).toBe(true);		  	  	
		  	});

		  	it("right conversations", function() {
		  		expect(desktop.rightConversation()).toEqual(allConversations[2]);
		  	  	expect(desktop.rightConversation().activateOnTheRight).toHaveBeenCalled();		  	  	
		  	  	expect(desktop.hasRightConversation()).toBe(true);		  	  	
		  	});
		});	  	
	});

	describe("1 conversation", function() {

		beforeEach(function() {
			desktopData = {
	 			_id: '1',
	 			userId: '2',
	 			conversations: [ 'B' ]
	 		};

			allConversations = testDataAllConversations();
			allConversations[1].activateOnTheLeft = jasmine.createSpy('activateOnTheLeft');

			desktop = createDesktop(desktopData, allConversations);
		});

		describe("creation", function() {

		  	it("conversations", function() {
		  		expect(desktop.conversations().length).toBe(1);
		  	  	expect(desktop.conversations()[0]).toEqual(allConversations[1]);
		  	});

		  	it("rendered conversations", function() {
		  		expect(desktop.renderedConversations().length).toBe(1);
		  	  	expect(desktop.renderedConversations()[0]).toEqual(allConversations[1]);
		  	});

		  	it("left conversation", function() {
		  		expect(desktop.leftConversation()).toEqual(allConversations[1]);
		  	  	expect(desktop.leftConversation().activateOnTheLeft).toHaveBeenCalled();
		  	  	expect(desktop.hasLeftConversation()).toBe(true);		  	  			  	  	
		  	});

		  	it("right conversations", function() {
		  		expect(desktop.rightConversation()).toBeNull();
		  		expect(desktop.hasRightConversation()).toBe(false);		  	  			  	  	
		  	});
		});	  	
	});

 	function testDataAllConversations() {
 		return [
 			{ id: 'A' },
 			{ id: 'B' },
 			{ id: 'C' },
 			{ id: 'D' },
 			{ id: 'E' }
 		];
 	}
});