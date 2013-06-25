describe('conversation info', function(){
	var info, group;

	beforeEach(function(){
		group = {
			users: ko.observableArray([ 
				{ id: '1', username: 'uno' },
				{ id: '2', username: 'dos' }
			])
		};

		info = createConversationInfo(group);
	});

	it('sets conversation for entire group', function(){
		var conversation = {
			topic: ko.observable('my-topic'),
			createdBy: ko.observable('charlie chalck'),
			timestamp: 'june 23 2011',
			forEntireGroup: true,
			users: []
		};

		info.set(conversation);

		expect(info.topic()).toBe('my-topic');
		expect(info.createdBy()).toBe('charlie chalck');
		expect(info.timestamp()).toBe('june 23 2011');
		expect(info.forEntireGroup()).toBe(true);
		expect(info.users()).toEqual([]);
	});

	it('sets conversation with users', function(){
		var conversation = {
			topic: ko.observable('with users'),
			createdBy: ko.observable('juan gomez'),
			timestamp: 'october 23 2014',
			forEntireGroup: false,
			users: [ '1', '2' ]
		};

		info.set(conversation);

		expect(info.topic()).toBe('with users');
		expect(info.createdBy()).toBe('juan gomez');
		expect(info.timestamp()).toBe('october 23 2014');
		expect(info.forEntireGroup()).toBe(false);
		expect(info.users()).toEqual([ 'uno', 'dos' ]);
	});
});