define(['squire'], function(Squire){
	'use strict';

	describe('builder', function(){

		var builder, createConversationMock, createTaskListMock,
			createMessageMock, createTaskMock;

		beforeEach(function(){
			var done = false;

			createConversationMock = jasmine.createSpy('create-conversation-mock');
			createTaskListMock = jasmine.createSpy('create-task-list-mock');
			createMessageMock = jasmine.createSpy('create-message-mock');
			createTaskMock = jasmine.createSpy('create-task-mock');

			runs(function(){
				var injector = new Squire();

				injector.mock('client/conversation', function(){
					return createConversationMock;
				});

				injector.mock('client/task-list', function(){
					return createTaskListMock;
				});

				injector.mock('client/message', function(){
					return createMessageMock;
				});

				injector.mock('client/task', function(){
					return createTaskMock;
				});

				injector.require(['client/builder'], function(builderObj){
                    builder = builderObj;
                    done = true;
                });
			});

			waitsFor(function(){
				return done;
			});
		});

		describe('collaboration objects', function(){
			it('builds conversation', function(){
				var data = { type: 'C' };

				builder.collaborationObject(data);

				expect(createConversationMock).toHaveBeenCalledWith(data);
			});

			it('builds task list', function(){
				var data = { type: 'T' };
				var group = { my: 'group' };

				builder.collaborationObject(data, group);

				expect(createTaskListMock).toHaveBeenCalledWith(data, group);
			});
		});

		describe('item', function(){
			it('builds a message', function(){
				var data = { it: 'data' },
					collaborationObjectType = 'C';

				builder.item(collaborationObjectType, data);

				expect(createMessageMock).toHaveBeenCalledWith(data, true);
			});

			it('builds task', function(){
				var data = { it: 'data' },
					collaborationObjectType = 'T';

				builder.item(collaborationObjectType, data);

				expect(createTaskMock).toHaveBeenCalledWith(data);
			});
		});
	});
});