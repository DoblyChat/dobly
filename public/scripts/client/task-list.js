define(['knockout', 'client/socket', 'client/collaboration-object', 'client/task', 'client/group'], 
    function(ko, socket, createCollaborationObject, Task, group){
    'use strict';
    
    return function(data){
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