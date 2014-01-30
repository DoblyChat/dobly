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

	self.routeTo = function(hash){
		if(self.getHash() === '#' + hash){
			self.route();
		}else{
			self.setHash(hash);
		}
	};

	self.subscribe = function(hash, show, handler){
		subscriptions.push({
			hash: hash,
			onload: handler,
			show: show
		});
	};

	self.route = function(){
		var hash = self.getHash();

		if(hash.length > 0){
			hash = hash.substring(1);
		}

		subscriptions.forEach(function(route){
			if(route.hash === hash){
				route.show(true);
				if(route.onload){
					route.onload();
				}
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