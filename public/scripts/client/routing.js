define(function(){
	'use strict';

	var self = {},
		subscriptions = [];

	self.getHash = function(){
		return window.location.hash;
	};

	self.setHash = function(hash){
		window.location.hash = hash;
	};

	self.subscribe = function(hash, show, handler, isDefaultRoute){
		subscriptions.push({
			hash: hash,
			onload: handler,
			show: show
		});

		if(isDefaultRoute){
			subscriptions.push({
				hash: '',
				onload: function(){
					self.setHash(hash);
				}, 
				show: function(){}
			});
		}
	};

	self.route = function(){
		var hash = self.getHash();

		if(hash.length > 0){
			hash = hash.substring(1);
		}

		subscriptions.forEach(function(route){
			if(route.hash === hash){
				route.show(true);
				route.onload();
			}else{
				route.show(false);
			}
		});
	};

	self.bind = function(){
		window.addEventListener("hashchange", self.route, false);
	};

	return self;
});