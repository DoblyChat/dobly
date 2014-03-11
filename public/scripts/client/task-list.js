define(['knockout', 'client/socket', 'client/collaboration-object', 'client/task'], 
    function(ko, socket, createCollaborationObject, Task){
    'use strict';

    return function(data, group){
        var self = createCollaborationObject(data, 'task-list-template');

        self.init(function(itemData){
            return new Task(itemData);
        });

        self.users = group.users;
        self.iconClass = 'icon-task-list';
        
        function createNewTask(data){
            var taskObj = new Task(data);
            taskObj.processing(true);

            return taskObj;
        }

        function sendTaskToServer(taskData, taskObj){
            socket.emit('add_task', taskData, function(task){
                taskObj.timestamp(task.timestamp);
                taskObj.id(task._id);
                taskObj.processing(false);
            });
        }

        self.addTask = self.addNewItem(createNewTask, sendTaskToServer);

        self.removeTask = function(task){
            if(confirm('Are you sure you would like to remove this task?')){
                self.items.remove(task);

                socket.emit('remove_task', {
                    id: task.id(),
                    collaborationObjectId: self.id
                });
            }
        };

        return self;
    };
});