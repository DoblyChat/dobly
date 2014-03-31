define(['squire'], function(Squire){
	'use strict';

	describe('collaboration object db', function(){
		var db, dataMock, builderMock;

		beforeEach(function(){
			var done = false;

			dataMock = {
				collaborationObjects: [ { one: '1' }, { two: '2' }]
			};

			builderMock = {
				collaborationObject: jasmine.createSpy('collaborationObject').andCallFake(function(data){
					return { data: data };
				})
			};

			runs(function(){
				var injector = new Squire();

				injector.mock('client/builder', builderMock);
				injector.mock('client/data', dataMock);

				injector.require(['client/collaboration-object.db'], function(myDb){
					db = myDb;
					done = true;
				});
			});

			waitsFor(function(){
				return done;
			});
		});

		it('populates collaboration objects', function(){
			expect(builderMock.collaborationObject.calls.length).toBe(2);

			var objs = db.getCollaborationObjects();
			expect(objs.length).toBe(2);

			expect(objs[0].data.one).toBe('1');
			expect(objs[1].data.two).toBe('2');
		});

		it('adds a collaboration object', function(){
			var objs = db.getCollaborationObjects();
			expect(objs.length).toBe(2);
			var data = { three: '3' };

			var response = db.addCollaborationObject(data);
			expect(builderMock.collaborationObject).toHaveBeenCalledWith(data);
			expect(response.data).toBe(data);
			
			objs = db.getCollaborationObjects();
			expect(objs.length).toBe(3);
		});
	});
});