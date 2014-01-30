define(['squire', 'knockout'], function(Squire, ko){
	'use strict';

	describe("change topic", function() {
		var routingMock, changeTopic, collaborationObjectMock,
			commonMock;

		beforeEach(function() {
			app.socket = createMockSocket();
			
			collaborationObjectMock = {
				topic: ko.observable('last in show'),
				id: "8"
			};

			commonMock = {
				delayedFocus: jasmine.createSpy('delayed-focus'),
				enterKeyPressed: jasmine.createSpy('enter-key-pressed')
			};

			routingMock = {
				subscribe: jasmine.createSpy('subscribe'),
				routeTo: jasmine.createSpy('set-hash')
			};

			var done = false;

			runs(function(){
				var injector = new Squire();
				injector.mock('client/common', commonMock);
				injector.mock('client/routing', routingMock);

				injector.require(['client/changeTopic'], function(createChangeTopic){
					changeTopic = createChangeTopic();
					done = true;
				});
			});

			waitsFor(function(){
				return done;
			});
		});

		it("click", function() {
			expect(changeTopic.click(collaborationObjectMock)).toBe(true);
			expect(changeTopic.collaborationObject).toEqual(collaborationObjectMock);
		});

		it("update", function() {
			changeTopic.collaborationObject = collaborationObjectMock;
			changeTopic.newTopic('some new topic');
			changeTopic.update();

			expect(app.socket.emit).toHaveBeenCalled();
			var arg0 = app.socket.emit.mostRecentCall.args[0];
			var arg1 = app.socket.emit.mostRecentCall.args[1];
			expect(arg0).toEqual('update_topic');
			expect(arg1.collaborationObjectId).toEqual('8');
			expect(arg1.newTopic).toEqual('some new topic');

			expect(changeTopic.newTopic()).toEqual('');
			expect(routingMock.routeTo).toHaveBeenCalledWith('desktop');
		});

		it("update on click", function() {
			spyOn(changeTopic, "update");
			changeTopic.updateOnClick();
			expect(changeTopic.update).toHaveBeenCalled();
		});

		it("update on enter", function() {
			var testEvent = { };
			commonMock.enterKeyPressed.andReturn(true);
			spyOn(changeTopic, "update");
			changeTopic.updateOnEnter(null, testEvent);
			expect(commonMock.enterKeyPressed).toHaveBeenCalledWith(testEvent);
			expect(changeTopic.update).toHaveBeenCalled();
		});

		it("update on enter no update", function() {
			var testEvent = { };
			commonMock.enterKeyPressed.andReturn(false);
			spyOn(changeTopic, "update");
			changeTopic.updateOnEnter(null, testEvent);
			expect(commonMock.enterKeyPressed).toHaveBeenCalledWith(testEvent);
			expect(changeTopic.update).not.toHaveBeenCalled();
		});

		it("cancel", function() {
			changeTopic.cancel();

			expect(changeTopic.newTopic()).toEqual('');
			expect(routingMock.routeTo).toHaveBeenCalledWith('desktop');
		});

		it('subscribes to route', function(){
			expect(routingMock.subscribe).toHaveBeenCalled();
			var args = routingMock.subscribe.mostRecentCall.args;

			expect(args[0]).toBe('change-topic');
			expect(args[1]).toBe(changeTopic.showing);
			args[2]();

			expect(commonMock.delayedFocus).toHaveBeenCalled();
			var delayedArgs = commonMock.delayedFocus.mostRecentCall.args;
			expect(delayedArgs[0]).toBe('#change-topic textarea');
			expect(delayedArgs[1]).toBe(100);
			
			changeTopic.collaborationObject = collaborationObjectMock;
			delayedArgs[2]();
			expect(changeTopic.newTopic()).toBe('last in show');
		});
	});
});
