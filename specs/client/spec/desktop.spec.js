describe("desktop", function() {

	var desktop;
	var desktopData;
	var allConversations;
	var testConversation;

	describe("3 conversations", function() {

		beforeEach(function() {
			desktopData = {
	 			_id: '1',
	 			userId: '2',
	 			conversations: [ 'A', 'C', 'E' ]
	 		};

			allConversations = testDataAllConversations();
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

		describe("add", function() {
			
			it("adds but does not activate", function() {
				spyDesktopUi(desktop);
				app.socket = createMockSocket();
				testConversation = allConversations[1];
				expect(desktop.conversations()).not.toContain(testConversation);

			  	desktop.add(testConversation);

			  	expect(desktop.hasLeftConversation()).toBe(true);
			  	expect(desktop.hasRightConversation()).toBe(true);
			  	expect(desktop.leftConversation()).not.toEqual(testConversation);
			  	expect(desktop.rightConversation()).not.toEqual(testConversation);
			  	expect(desktop.renderedConversations()).not.toContain(testConversation);
			  	expect(desktop.conversations()).toContain(testConversation);

			  	expect(desktop.ui.scroll.tiles).toHaveBeenCalled();
			  	expectSocketEmitAddToDesktop('1','B');
			});

			it("does not add same conversation", function() {
				app.socket = createMockSocket();
			  	testConversation = allConversations[0];
			  	expect(desktop.conversations()).toContain(testConversation);
			  	expect(desktop.conversations().length).toBe(3);

			  	desktop.add(testConversation);

			  	expect(desktop.conversations().length).toBe(3);
			  	expect(app.socket.emit).not.toHaveBeenCalled();
			});
		}); 

		describe("add and activate", function() {
			it("adds and activates", function() {
				spyOn(desktop, "add");
				spyOn(desktop, "activate");
				testConversation = allConversations[0];

				desktop.addAndActivate(testConversation);

				expect(desktop.add).toHaveBeenCalledWith(testConversation);
				expect(desktop.activate).toHaveBeenCalledWith(testConversation);
			}); 	  
		});

		describe("activate", function() {
			it("activates", function() {
				spyDesktopUi(desktop);
				desktop.add(allConversations[1]);
				expect(desktop.conversations().length).toBe(4);
			  	expect(desktop.conversations()[0]).toEqual(allConversations[0]);
			  	expect(desktop.conversations()[1]).toEqual(allConversations[2]);
			  	expect(desktop.conversations()[2]).toEqual(allConversations[4]);
			  	expect(desktop.conversations()[3]).toEqual(allConversations[1]);

				expect(desktop.leftConversation()).toEqual(allConversations[0]);
				expect(desktop.rightConversation()).toEqual(allConversations[2]);

				var testConversation = desktop.conversations()[2];

				runs(function() {
				  	desktop.activate(testConversation);
				});

				waitsFor(function() {
					return testConversation.hasFocus() === true;
				}, "test conversation should have focus", 450);

				runs(function() {
					expect(desktop.conversations()[0].deactivate).toHaveBeenCalled();
					expect(desktop.conversations()[1].deactivate).toHaveBeenCalled();
					expect(desktop.conversations()[2].deactivate).toHaveBeenCalled();
					expect(desktop.conversations()[3].deactivate).toHaveBeenCalled();

					expect(desktop.conversations()[0].hasFocus()).toBe(false);
					expect(desktop.conversations()[1].hasFocus()).toBe(false);
					expect(desktop.conversations()[2].hasFocus()).toBe(true);
					expect(desktop.conversations()[3].hasFocus()).toBe(true);

					expect(desktop.leftConversation()).toEqual(testConversation);
					expect(desktop.rightConversation()).toEqual(desktop.conversations()[3]);

					expect(desktop.renderedConversations()).toContain(testConversation);
					expect(desktop.renderedConversations()).toContain(desktop.conversations()[3]);

					expect(testConversation.activateOnTheLeft).toHaveBeenCalled();
					expect(desktop.conversations()[3].activateOnTheRight).toHaveBeenCalled();

					expect(desktop.loading()).toBe(false);
					expect(desktop.ui.updateConversationUi).toHaveBeenCalled();					
				});
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

		describe("add", function() {
			
			it("activates on the right", function() {
				spyDesktopUi(desktop);
				app.socket = createMockSocket();
				testConversation = allConversations[4];
				expect(desktop.conversations()).not.toContain(testConversation);

			  	desktop.add(testConversation);

			  	expect(desktop.hasLeftConversation()).toBe(true);
			  	expect(desktop.hasRightConversation()).toBe(true);
			  	expect(desktop.rightConversation()).toEqual(testConversation);
			  	expect(desktop.renderedConversations()[1]).toEqual(testConversation);

			  	expectDesktopUiToHaveBeenCalled(desktop);
			  	expectSocketEmitAddToDesktop('1','E');
			});
		});
	});

	describe("0 conversations", function() {

		beforeEach(function() {
			desktopData = {
	 			_id: '1',
	 			userId: '2',
	 			conversations: [ ]
	 		};

			allConversations = testDataAllConversations();
			desktop = createDesktop(desktopData, allConversations);
		});

		describe("creation", function() {

		  	it("conversations", function() {
		  		expect(desktop.conversations().length).toBe(0);
		  	});

		  	it("rendered conversations", function() {
		  		expect(desktop.renderedConversations().length).toBe(0);
		  	});

		  	it("left conversation", function() {
		  		expect(desktop.leftConversation()).toBeNull();
		  	  	expect(desktop.hasLeftConversation()).toBe(false);
		  	});

		  	it("right conversations", function() {
		  		expect(desktop.rightConversation()).toBeNull();
		  		expect(desktop.hasRightConversation()).toBe(false);
		  	});
		});

		describe("add", function() {
			
			it("activates on the left", function() {
				spyDesktopUi(desktop);
				app.socket = createMockSocket();
				testConversation = allConversations[2];
				expect(desktop.conversations()).not.toContain(testConversation);

			  	desktop.add(testConversation);

			  	expect(desktop.hasLeftConversation()).toBe(true);
			  	expect(desktop.hasRightConversation()).toBe(false);
			  	expect(desktop.leftConversation()).toEqual(testConversation);
			  	expect(desktop.renderedConversations()[0]).toEqual(testConversation);			  	

			  	expectDesktopUiToHaveBeenCalled(desktop);
			  	expectSocketEmitAddToDesktop('1','C');
			});
		});  	
	});

 	function testDataAllConversations() {
 		var conversationsTestData = [
 			{ id: 'A' },
 			{ id: 'B' },
 			{ id: 'C' },
 			{ id: 'D' },
 			{ id: 'E' }
 		];

 		var mockConversation;
 		for (var i = conversationsTestData.length - 1; i >= 0; i--) {
 			mockConversation = conversationsTestData[i];
 			mockConversation.activateOnTheLeft = jasmine.createSpy('activateOnTheLeft');
 			mockConversation.activateOnTheRight = jasmine.createSpy('activateOnTheRight');
 			mockConversation.deactivate = jasmine.createSpy('deactivate');
 			mockConversation.hasFocusValue = false;
 			mockConversation.hasFocus = function(value) {
 				if (value === undefined) {
 					return mockConversation.hasFocusValue;
 				} else { 					
 					mockConversation.hasFocusValue = value;
 				}
 			};
 		};

 		return conversationsTestData;
 	}

 	function spyDesktopUi(desktop) {
 		desktop.ui = jasmine.createSpyObj('ui', ['scroll','updateConversationUi']);
 		desktop.ui.scroll = jasmine.createSpyObj('scroll', ['tiles']);
 	}

 	function expectDesktopUiToHaveBeenCalled(desktop) {
 		expect(desktop.ui.updateConversationUi).toHaveBeenCalled();
 		expect(desktop.ui.scroll.tiles).toHaveBeenCalled();
 	}

 	function expectSocketEmitAddToDesktop(id, conversationId) {
 		expect(app.socket.emit).toHaveBeenCalled();

 		var arg0 = app.socket.emit.mostRecentCall.args[0];
 		var arg1 = app.socket.emit.mostRecentCall.args[1];

 		expect(arg0).toEqual('add_to_desktop');
 		expect(arg1.id).toEqual(id);
 		expect(arg1.conversationId).toEqual(conversationId);
 	}
});