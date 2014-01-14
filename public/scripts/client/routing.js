define(function(){
	'use strict';

	var self = {},
		subscriptions = {};

	self.getHash = function(){
		return window.location.hash;
	};

	self.subscribe = function(hash, handler){
		subscriptions[hash] = handler;
	};

	self.route = function(){
		var hash = self.getHash();

		if(subscriptions[hash]){
			subscriptions[hash]();
		}
	};

	self.bind = function(){
		window.addEventListener("hashchange", self.route, false);
	};

	return self;
});