define(['knockout'], function(ko){
	'use strict';

	return function(data){
		return {
			description: ko.observable(data.description),
			complete: ko.observable(data.complete),
		};
	};
});