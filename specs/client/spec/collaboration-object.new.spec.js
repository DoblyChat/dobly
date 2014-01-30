define(['squire'], function(Squire){
	'use strict';

	describe('new collaboration object', function(){
		var newCollaborationObject, groupMock, commonMock, routingMock;

		beforeEach(function(){
			app.socket = createMockSocket();

			groupMock = {
				otherUsers: [
					{ id: 'usr-1', fullName: 'user one' },
					{ id: 'usr-2', fullName: 'user two' },
				]
			};

			routingMock = {
				subscribe: jasmine.createSpy('subscribe'),
				routeTo: jasmine.createSpy('set-hash')
			};

			commonMock = {
				delayedFocus: jasmine.createSpy('delayed-focus'),
				enterKeyPressed: jasmine.createSpy('enter-key-pressed')
			};

			var done = false;

			runs(function(){
				var injector = new Squire();

				injector.mock('client/routing', routingMock);
				injector.mock('client/common', commonMock);

				injector.require(['client/collaboration-object.new'], function(createNewCollaborationObject){
					spyOn($.fn, 'trigger');
					newCollaborationObject = createNewCollaborationObject(groupMock);
					done = true;
				});
			});

			waitsFor(function(){
				return done;
			});
		});

		it('sets up', function(){
			spyOn($.fn, 'chosen');

			newCollaborationObject.setup();

			expect($.fn.chosen).toHaveBeenCalledWith({ placeholder: '' });
			expect(commonMock.delayedFocus).toHaveBeenCalledWith('#new-collaboration-object textarea');
		});

		it('populates options', function(){
			var options = newCollaborationObject.options();
			expect(options.length).toBe(3);
			expect(options[0]).toEqual({ value: 'usr-1', text: 'user one' });
			expect(options[1]).toEqual({ value: 'usr-2', text: 'user two' });
			expect(options[2]).toEqual({ value: 'g', text: 'Entire Group' });
		});

		it('defaults selection to entire group', function(){
			expect(newCollaborationObject.selectedOptions().length).toBe(1);
			expect(newCollaborationObject.selectedOptions()[0]).toBe('g');
		});

		it('defaults type to conversation', function(){
			expect(newCollaborationObject.type()).toBe('C');
		});

		it('defaults topic to nothing', function(){
			expect(newCollaborationObject.topic()).toBe('');
		});

		it('defaults to not visible', function(){
			expect(newCollaborationObject.showing()).toBe(false);
		});

		describe('create new collaboration object on enter', function(){
			var event = {};

			beforeEach(function(){
				spyOn(newCollaborationObject, 'create');
			});

			it('returns true and does not create if enter not pressed', function(){
				commonMock.enterKeyPressed.andReturn(false);
				var result = newCollaborationObject.createOnEnter(null, event);
				expect(result).toBe(true);
				expect(newCollaborationObject.create).not.toHaveBeenCalled();
			});

			it('returns true and does not create if topic not set', function(){
				commonMock.enterKeyPressed.andReturn(true);
				newCollaborationObject.topic('');
				var result = newCollaborationObject.createOnEnter(null, event);
				expect(newCollaborationObject.create).not.toHaveBeenCalled();	
				expect(result).toBe(true);
			});

			it('returns true and does not create if options not selected', function(){
				commonMock.enterKeyPressed.andReturn(true);
				newCollaborationObject.topic('should not be created');
				newCollaborationObject.selectedOptions([]);
				var result = newCollaborationObject.createOnEnter(null, event);
				expect(newCollaborationObject.create).not.toHaveBeenCalled();	
				expect(result).toBe(true);
			});

			it('creates collaboration object if enter pressed and topic is filled', function(){
				commonMock.enterKeyPressed.andReturn(true);
				newCollaborationObject.topic('new-collaboration-object');

				var result = newCollaborationObject.createOnEnter(null, event);

				expect(result).toBe(false);
				expect(newCollaborationObject.create).toHaveBeenCalled();			
			});
		});
		
		describe('create new collaboration object on click', function(){
			beforeEach(function(){
				spyOn(newCollaborationObject, 'create');
			});

			it('does not create collaboration object if topic not set', function(){
				newCollaborationObject.topic('');
				newCollaborationObject.createOnClick();
				expect(newCollaborationObject.create).not.toHaveBeenCalled();
			});

			it('does not create collaboration object if option not set', function(){
				newCollaborationObject.topic('topic');
				newCollaborationObject.selectedOptions([]);
				newCollaborationObject.createOnClick();
				expect(newCollaborationObject.create).not.toHaveBeenCalled();
			});

			it('creates new collaboration object if topic and selected option are set', function(){
				newCollaborationObject.topic('new-collaboration-object');
				newCollaborationObject.selectedOptions.push('g');

				newCollaborationObject.createOnClick();

				expect(newCollaborationObject.create).toHaveBeenCalled();
			});
		});

		describe('create', function(){
			beforeEach(function(){
				newCollaborationObject.selectedOptions([]);
				newCollaborationObject.topic('create-t');
			});

			it('creates new collaboration object with entire group selected', function(){
				newCollaborationObject.selectedOptions.push('g');
				newCollaborationObject.create();
				expect(app.socket.emit).toHaveBeenCalledWith('create_collaboration_object', {
					topic: 'create-t',
					forEntireGroup: true,
					selectedMembers: [],
					type: 'C'
				});
				expect(routingMock.routeTo).toHaveBeenCalledWith('desktop');
			});

			it('creates collaboration object with only specific users selected', function(){
				newCollaborationObject.selectedOptions.push('usr-1');
				newCollaborationObject.selectedOptions.push('usr-2');
				newCollaborationObject.create();
				expect(app.socket.emit).toHaveBeenCalledWith('create_collaboration_object', {
					topic: 'create-t',
					forEntireGroup: false,
					selectedMembers: ['usr-1', 'usr-2'],
					type: 'C'
				});
				expect(routingMock.routeTo).toHaveBeenCalledWith('desktop');
			});

			it('creates collaboration object with entire group and users selected', function(){
				newCollaborationObject.selectedOptions.push('usr-1');
				newCollaborationObject.selectedOptions.push('usr-2');
				newCollaborationObject.selectedOptions.push('g');
				newCollaborationObject.create();
				expect(app.socket.emit).toHaveBeenCalledWith('create_collaboration_object', {
					topic: 'create-t',
					forEntireGroup: true,
					selectedMembers: ['usr-1', 'usr-2'],
					type: 'C'
				});
				expect(routingMock.routeTo).toHaveBeenCalledWith('desktop');
			});

			it('restores defaults after it creates', function(){
				newCollaborationObject.selectedOptions.push('usr-1');
				newCollaborationObject.create();
				checkDefaults();
			});

			it('creates a collaboraton object with a different type than default', function(){
				newCollaborationObject.type('T');
				newCollaborationObject.create();
				expect(newCollaborationObject.type()).toBe('C');
				expect(app.socket.emit).toHaveBeenCalledWith('create_collaboration_object', {
					topic: 'create-t',
					forEntireGroup: false,
					selectedMembers: [],
					type: 'T'
				});
			});
		});

		it('restores defaults and navigates back to desktop on cancel', function(){
			newCollaborationObject.topic('clear me!!');
			newCollaborationObject.selectedOptions([ '1', '2' ]);

			newCollaborationObject.cancel();
			checkDefaults();
			expect(routingMock.routeTo).toHaveBeenCalledWith('desktop');
		});

		it('subscribes to route', function(){
			spyOn(newCollaborationObject, 'setup');
			expect(routingMock.subscribe).toHaveBeenCalled();

			var args = routingMock.subscribe.mostRecentCall.args;

			expect(args[0]).toBe('new');
			expect(args[1]).toBe(newCollaborationObject.showing);
			args[2]();
			expect(newCollaborationObject.setup).toHaveBeenCalled();
		});

		function checkDefaults(){
			expect(newCollaborationObject.topic()).toBe('');
			expect(newCollaborationObject.type()).toBe('C');
			expect(newCollaborationObject.selectedOptions()).toEqual(['g']);
			expect($.fn.trigger).toHaveBeenCalledWith('liszt:updated');
		}
	});
});