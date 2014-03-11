define(['knockout', 'client/group', 'client/common'], function(ko, group, common){
    'use strict';
    
    function Message(data, confirmed) {
        this.id = ko.observable(data._id);
        this.content = common.formatUserInput(data.content);
        this.rawContent = data.content;
        this.timestamp = ko.observable(data.timestamp ? data.timestamp : null);
        this.formattedTimestamp = ko.computed(function() {
            return common.formatTimestamp(this.timestamp());
        }, this);
        this.createdBy = group.getUserFullName(data.createdById);
        this.confirmedSent = ko.observable(confirmed);
    }

    Message.prototype.getNotificationText = function(){
        return this.createdBy + ': ' + this.content;
    };

    return Message;
});