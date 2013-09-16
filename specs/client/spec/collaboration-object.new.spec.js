define(['client/collaboration-object.new', 'client/common'], function(createNewCollaborationObject, common){
	'use strict';

	describe('new collaboration object', function(){
		var newCollaborationObject, navMock, groupMock;

		beforeEach(function(){
			spyOn($.fn, 'trigger');
			app.socket = createMockSocket();
			navMock = {
				desktop: jasmine.createSpy()
			};

			groupMock = {
				otherUsers: [
					{ id: 'usr-1', fullName: 'user one' },
					{ id: 'usr-2', fullName: 'user two' },
				]
			};
			newCollaborationObject = createNewCollaborationObject(navMock, groupMock);
		});

		it('sets up', function(){
			spyOn($.fn, 'chosen')
			spyOn(common, 'delayedFocus');

			newCollaborationObject.setup();

			expect($.fn.chosen).toHaveBeenCalledWith({ placeholder: '' });
			expect(common.delayedFocus).toHaveBeenCalledWith('#new-collaboration-object textarea');
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

		describe('create new collaboration object on enter', function(){
			var event = {};

			beforeEach(function(){
				spyOn(newCollaborationObject, 'create');
			});

			it('returns true and does not create if enter not pressed', function(){
				spyOn(common, 'enterKeyPressed').andReturn(false);
				var result = newCollaborationObject.createOnEnter(null, event);
				expect(result).toBe(true);
				expect(newCollaborationObject.create).not.toHaveBeenCalled();
			});

			it('returns true and does not create if topic not set', function(){
				spyOn(common, 'enterKeyPressed').andReturn(true);
				newCollaborationObject.topic('');
				var result = newCollaborationObject.createOnEnter(null, event);
				expect(newCollaborationObject.create).not.toHaveBeenCalled();	
				expect(result).toBe(true);
			});

			it('returns true and does not create if options not selected', function(){
				spyOn(common, 'enterKeyPressed').andReturn(true);
				newCollaborationObject.topic('should not be created');
				newCollaborationObject.selectedOptions([]);
				var result = newCollaborationObject.createOnEnter(null, event);
				expect(newCollaborationObject.create).not.toHaveBeenCalled();	
				expect(result).toBe(true);
			});

			it('creates collaboration object if enter pressed and topic is filled', function(){
				spyOn(common, 'enterKeyPressed').andReturn(true);
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
			expect(navMock.desktop).toHaveBeenCalled();
		});

		function checkDefaults(){
			expect(newCollaborationObject.topic()).toBe('');
			expect(newCollaborationObject.type()).toBe('C');
			expect(newCollaborationObject.selectedOptions()).toEqual(['g']);
			expect($.fn.trigger).toHaveBeenCalledWith('liszt:updated');
		}
	});
});