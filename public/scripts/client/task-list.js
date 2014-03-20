define(['knockout', 'client/socket', 'client/collaboration-object', 'client/task', 'client/group'], 
    function(ko, socket, CollaborationObject, Task, group){
    'use strict';

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

    function TaskList(data){
        var self = this;

        CollaborationObject.call(self, data, 'task-list-template');

        self.init(function(itemData){
            return new Task(itemData);
        });

        self.users = group.users;
        self.iconClass = 'icon-task-list';

        self.addTask = self.bindAddNewItem(createNewTask, sendTaskToServer);
    }

    function Surrogate() {}
 
    function extend(base, sub) {
        Surrogate.prototype = base.prototype;
        sub.prototype = new Surrogate();
        sub.prototype.constructor = sub;
    }

    extend(CollaborationObject, TaskList);

    TaskList.prototype.removeTask = function(task){
        if(confirm('Are you sure you would like to remove this task?')){
            this.items.remove(task);

            socket.emit('remove_task', {
                id: task.id(),
                collaborationObjectId: this.id
            });
        }
    };

    return TaskList;
});