define(['client/routing'], function(routing){
	'use strict';

	describe('routing', function(){
		var called;

		beforeEach(function(){
			called = false;
			spyOn(routing, 'getHash').andReturn('test');
		});

		function handler(){
			called = true;
		}

		it('can subscribe and route', function(){
			routing.subscribe('test', handler);
			
			routing.route();

			expect(called).toBe(true);
		});

		it('does nothing if routing to unsubscribed hash', function(){
			expect(function(){
				routing.route();
			}).not.toThrow();
		});

		it('binds to window event', function(){
			spyOn(window, 'addEventListener');
			routing.bind();

			expect(window.addEventListener).toHaveBeenCalled();
			var args = window.addEventListener.mostRecentCall.args;
			expect(args[0]).toBe('hashchange');
			expect(args[1]).toBe(routing.route);
			expect(args[2]).toBe(false);
		});
	});
});