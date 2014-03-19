define(['squire'], function(Squire){
	'use strict';

	describe('builder', function(){

		var builder, ConversationMock, TaskListMock,
			MessageMock, TaskMock;

		beforeEach(function(){
			var done = false;

			ConversationMock = jasmine.createSpy('create-conversation-mock');
			TaskListMock = jasmine.createSpy('create-task-list-mock');
			MessageMock = jasmine.createSpy('create-message-mock');
			TaskMock = jasmine.createSpy('create-task-mock');

			runs(function(){
				var injector = new Squire();

				injector.mock('client/conversation', function(){
					return ConversationMock;
				});

				injector.mock('client/task-list', function(){
					return TaskListMock;
				});

				injector.mock('client/message', function(){
					return MessageMock;
				});

				injector.mock('client/task', function(){
					return TaskMock;
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

				expect(ConversationMock).toHaveBeenCalledWith(data);
			});

			it('builds task list', function(){
				var data = { type: 'T' };
				var group = { my: 'group' };

				builder.collaborationObject(data, group);

				expect(TaskListMock).toHaveBeenCalledWith(data, group);
			});
		});

		describe('item', function(){
			it('builds a message', function(){
				var data = { it: 'data' },
					collaborationObjectType = 'C';

				builder.item(collaborationObjectType, data);

				expect(MessageMock).toHaveBeenCalledWith(data, true);
			});

			it('builds task', function(){
				var data = { it: 'data' },
					collaborationObjectType = 'T';

				builder.item(collaborationObjectType, data);

				expect(TaskMock).toHaveBeenCalledWith(data);
			});
		});
	});
});