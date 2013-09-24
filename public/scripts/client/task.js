define(['knockout', 'client/common'], function(ko, common){
	return function(data){
		var self = {};

		self.id = ko.observable(data._id);
		self.description = common.formatUserInput(data.description);
		self.complete = data.complete;

		return self;
	};
});