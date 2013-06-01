describe('new conversation', function(){
	var newConvo, navMock;

	beforeEach(function(){
		app.socket = createMockSocket();
		navMock = {
			desktop: jasmine.createSpy()
		};
		newConvo = createNewConversation(navMock);
	});

	it('sets up', function(){
		spyOn($.fn, 'placeholder');
		spyOn(common, 'delayedFocus');

		newConvo.setup();

		expect($.fn.placeholder).toHaveBeenCalled();
		expect(common.delayedFocus).toHaveBeenCalledWith('#new-convo textarea');
	});

	describe('create new conversation on enter', function(){
		var event = {};

		it('returns true and does not create if enter not pressed', function(){
			spyOn(common, 'enterKeyPressed').andReturn(false);
			var result = newConvo.createOnEnter(null, event);
			expect(app.socket.emit).not.toHaveBeenCalled();	
			expect(result).toBe(true);
		});

		it('returns true and does not create if topic not set', function(){
			spyOn(common, 'enterKeyPressed').andReturn(true);
			newConvo.topic('');
			var result = newConvo.createOnEnter(null, event);
			expect(app.socket.emit).not.toHaveBeenCalled();	
			expect(result).toBe(true);
		});

		it('creates conversation if enter pressed and topic is filled', function(){
			var selectedMembers = [ 'hello', 'world' ];
			
			spyOn(common, 'enterKeyPressed').andReturn(true);
			newConvo.topic('new-convo');
			newConvo.forEntireGroup(true);
			newConvo.selectedMembers(selectedMembers);

			var result = newConvo.createOnEnter(null, event);

			expect(result).toBe(false);
			expect(app.socket.emit).toHaveBeenCalledWith('create_conversation', { topic: 'new-convo', forEntireGroup: true, selectedMembers: selectedMembers });
			checkCleared();
			expect(navMock.desktop).toHaveBeenCalled();
		});
	});
	
	describe('create new conversation on click', function(){
		it('does not create conversation if topic not set', function(){
			newConvo.topic('');
			newConvo.createOnClick();
			expect(app.socket.emit).not.toHaveBeenCalled();
		});

		it('creates new conversation if topic is set', function(){
			var selectedMembers = [ 'hello', 'world' ];
			
			newConvo.topic('new-convo');
			newConvo.forEntireGroup(true);
			newConvo.selectedMembers(selectedMembers);

			newConvo.createOnClick();

			expect(app.socket.emit).toHaveBeenCalledWith('create_conversation', { topic: 'new-convo', forEntireGroup: true, selectedMembers: selectedMembers });
			checkCleared();
			expect(navMock.desktop).toHaveBeenCalled();
		});
	});

	it('clears and navigates back to desktop on cancel', function(){
		newConvo.topic('clear me!!');
		newConvo.forEntireGroup(true);
		newConvo.selectedMembers([ 'pepe', 'juan' ]);

		newConvo.cancel();
		checkCleared();
		expect(navMock.desktop).toHaveBeenCalled();
	});

	function checkCleared(){
		expect(newConvo.topic()).toBe('');
		expect(newConvo.forEntireGroup()).toBe(false);
		expect(newConvo.selectedMembers()).toEqual([]);
	}
})