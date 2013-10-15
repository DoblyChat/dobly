define(['knockout', 'client/common'], function(ko, common){
	return function(data){
		var self = {};

		self.id = ko.observable(data._id);
		self.content = common.formatUserInput(data.content);
		self.complete = data.complete;

		return self;
	};
});