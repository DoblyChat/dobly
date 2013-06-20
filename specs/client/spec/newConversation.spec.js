describe('new conversation', function(){
	var newConvo, navMock, groupMock;

	beforeEach(function(){
		app.socket = createMockSocket();
		navMock = {
			desktop: jasmine.createSpy()
		};

		groupMock = {
			otherUsers: [
				{ id: 'usr-1', username: 'user one' },
				{ id: 'usr-2', username: 'user two' },
			]
		};
		newConvo = createNewConversation(navMock, groupMock);
	});

	it('sets up', function(){
		spyOn($.fn, 'chosen');
		spyOn(common, 'delayedFocus');

		newConvo.setup();

		expect($.fn.chosen).toHaveBeenCalledWith({ placeholder: '' });
		expect(common.delayedFocus).toHaveBeenCalledWith('#new-convo textarea');
	});

	it('populates options', function(){
		var options = newConvo.options();
		expect(options.length).toBe(3);
		expect(options[0]).toEqual({ value: 'usr-1', text: 'user one' });
		expect(options[1]).toEqual({ value: 'usr-2', text: 'user two' });
		expect(options[2]).toEqual({ value: 'g', text: 'Entire Group' });
	});

	it('defaults selection to entire group', function(){
		expect(newConvo.selectedOptions().length).toBe(1);
		expect(newConvo.selectedOptions()[0]).toBe('g');
	});

	describe('create new conversation on enter', function(){
		var event = {};

		beforeEach(function(){
			spyOn(newConvo, 'create');
		});

		it('returns true and does not create if enter not pressed', function(){
			spyOn(common, 'enterKeyPressed').andReturn(false);
			var result = newConvo.createOnEnter(null, event);
			expect(result).toBe(true);
			expect(newConvo.create).not.toHaveBeenCalled();
		});

		it('returns true and does not create if topic not set', function(){
			spyOn(common, 'enterKeyPressed').andReturn(true);
			newConvo.topic('');
			var result = newConvo.createOnEnter(null, event);
			expect(newConvo.create).not.toHaveBeenCalled();	
			expect(result).toBe(true);
		});

		it('returns true and does not create if options not selected', function(){
			spyOn(common, 'enterKeyPressed').andReturn(true);
			newConvo.topic('should not be created');
			newConvo.selectedOptions([]);
			var result = newConvo.createOnEnter(null, event);
			expect(newConvo.create).not.toHaveBeenCalled();	
			expect(result).toBe(true);
		});

		it('creates conversation if enter pressed and topic is filled', function(){
			spyOn(common, 'enterKeyPressed').andReturn(true);
			newConvo.topic('new-convo');

			var result = newConvo.createOnEnter(null, event);

			expect(result).toBe(false);
			expect(newConvo.create).toHaveBeenCalled();			
		});
	});
	
	describe('create new conversation on click', function(){
		beforeEach(function(){
			spyOn(newConvo, 'create');
		});

		it('does not create conversation if topic not set', function(){
			newConvo.topic('');
			newConvo.createOnClick();
			expect(newConvo.create).not.toHaveBeenCalled();
		});

		it('does not create conversation if option not set', function(){
			newConvo.topic('topic');
			newConvo.selectedOptions([]);
			newConvo.createOnClick();
			expect(newConvo.create).not.toHaveBeenCalled();
		});

		it('creates new conversation if topic and selected option are set', function(){
			newConvo.topic('new-convo');
			newConvo.selectedOptions.push('g');

			newConvo.createOnClick();

			expect(newConvo.create).toHaveBeenCalled();
		});
	});

	describe('create', function(){
		beforeEach(function(){
			newConvo.selectedOptions([]);
			newConvo.topic('create-t');
		});

		it('creates new conversation with entire group selected', function(){
			newConvo.selectedOptions.push('g');
			newConvo.create();
			expect(app.socket.emit).toHaveBeenCalledWith('create_conversation', {
				topic: 'create-t',
				forEntireGroup: true,
				selectedMembers: []
			});
		});

		it('creates conversation with only specific users selected', function(){
			newConvo.selectedOptions.push('usr-1');
			newConvo.selectedOptions.push('usr-2');
			newConvo.create();
			expect(app.socket.emit).toHaveBeenCalledWith('create_conversation', {
				topic: 'create-t',
				forEntireGroup: false,
				selectedMembers: ['usr-1', 'usr-2']
			});
		});

		it('creates conversation with entire group and users selected', function(){
			newConvo.selectedOptions.push('usr-1');
			newConvo.selectedOptions.push('usr-2');
			newConvo.selectedOptions.push('g');
			newConvo.create();
			expect(app.socket.emit).toHaveBeenCalledWith('create_conversation', {
				topic: 'create-t',
				forEntireGroup: true,
				selectedMembers: ['usr-1', 'usr-2']
			});
		});

		it('restores defaults after it creates', function(){
			newConvo.selectedOptions.push('usr-1');
			newConvo.create();
			expect(newConvo.topic()).toBe('');
			expect(newConvo.selectedOptions()).toEqual(['g']);
		});
	});

	it('restores defaults and navigates back to desktop on cancel', function(){
		newConvo.topic('clear me!!');
		newConvo.selectedOptions([ '1', '2' ]);

		newConvo.cancel();
		checkDefaults();
		expect(navMock.desktop).toHaveBeenCalled();
	});

	function checkDefaults(){
		expect(newConvo.topic()).toBe('');
		expect(newConvo.selectedOptions()).toEqual(['g']);
	}
})