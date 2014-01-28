define(['squire'], function(Squire){
	describe('notifications setup', function(){

		var setup, routingMock, notifications;

		beforeEach(function(){
			routingMock = {
				subscribe: jasmine.createSpy('subscribe'),
				setHash: jasmine.createSpy('set-hash')
			};

			var done = false;

			if(!window.webkitNotifications){
				window.webkitNotifications = {
					checkPermission: function(){},
					requestPermission: function(){}
				};
			}

			notifications = window.webkitNotifications;

			runs(function(){
				var injector = new Squire();
				injector.mock('client/routing', routingMock);

				injector.require(['client/notification-setup'], function(notificationSetup){
					setup = notificationSetup;
					done = true;
				})
			});

			waitsFor(function(){
				return done;
			});
		});

		it('is not showing by default', function(){
			expect(setup.showing()).toBe(false);
		});

		it('requests permission if permissions not set', function(){
			spyOn(notifications, 'checkPermission').andReturn(1);
			setup.requestPermission();
			expect(routingMock.setHash).toHaveBeenCalledWith('notification-setup');
		});

		it('allows a request for permission', function(){
			spyOn(notifications, 'requestPermission');
			setup.allow();
			expect(notifications.requestPermission).toHaveBeenCalled();
			expect(routingMock.setHash).toHaveBeenCalledWith('desktop');
		});

		it('cancels request', function(){
			setup.cancel();
			expect(routingMock.setHash).toHaveBeenCalledWith('desktop');
		});

		it('subscribes to route', function(){
			expect(routingMock.subscribe).toHaveBeenCalledWith('notification-setup', setup.showing);
		});
	});
});