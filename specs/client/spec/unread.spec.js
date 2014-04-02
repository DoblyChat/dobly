define(['squire'], function(Squire){
	'use strict';

	describe('unread', function(){

		var unread, titleMock, dbMock, collaborationObjects;

		function createObj(unread){
			var callback = null;
			return {
				unreadCounter: function(){
					return unread;
				},
				subscribeToMarkAsRead: jasmine.createSpy('listen').andCallFake(function(aCallback){
					callback = aCallback;
				}),
				callback: callback
			};
		}

		beforeEach(function(){
			var done = false;

			titleMock = {
				update: jasmine.createSpy('title-update')
			};

			collaborationObjects = [
				createObj(2), createObj(3)
			];

			dbMock = {
				getCollaborationObjects: jasmine.createSpy('get-objs').andReturn(collaborationObjects)
			};

			runs(function(){
				var injector = new Squire();

				injector.mock('client/title', titleMock);
				injector.mock('client/collaboration-object.db', dbMock);

				injector.require(['client/unread'], function(unreadObj){
                    unread = unreadObj;
                    done = true;
                });
			});

			waitsFor(function(){
				return done;
			});
		});

		describe('init', function(){
			it('updates unread', function(){
				expect(unread.hasUnread()).toBe(true);
				expect(titleMock.update).toHaveBeenCalledWith(5);
			});

			it('subscribes to mark as read for all objects', function(){
				expect(collaborationObjects[0].subscribeToMarkAsRead).toHaveBeenCalledWith(unread.update);
				expect(collaborationObjects[1].subscribeToMarkAsRead).toHaveBeenCalledWith(unread.update);
			});
		});

		describe('has unread', function(){
			it('flags that there are unread items', function(){
				collaborationObjects[0] = createObj(0);
				collaborationObjects[1] = createObj(1);
				unread.update();
				expect(unread.hasUnread()).toBe(true);
			});

			it('turns of flag after unread have been read', function(){
				collaborationObjects[0] = createObj(0);
				collaborationObjects[1] = createObj(0);

				unread.update();
				expect(unread.hasUnread()).toBe(false);
			});
		});

		it('updates title with unread', function(){
			collaborationObjects[0] = createObj(67);
			collaborationObjects[1] = createObj(3);
			unread.update();
			expect(titleMock.update).toHaveBeenCalledWith(70);
		});
	});
});