define(['knockout', 'client/common'], function(ko, common){
    'use strict';
    
    return function (data, confirmed) {
        var self = {};

        self.id = ko.observable(data._id);
        self.content = common.formatUserInput(data.content);
        self.rawContent = data.content;
        self.timestamp = ko.observable(null);
        self.formattedTimestamp = ko.computed(function() {
            return common.formatTimestamp(self.timestamp());
        });
        self.createdBy = app.groupUsers[data.createdById];
        self.confirmedSent = ko.observable(confirmed);

        return self;
    };
});