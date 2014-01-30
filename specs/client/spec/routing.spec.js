define(['client/routing'], function(routing){
	'use strict';

	describe('routing', function(){
		var routes;

		beforeEach(function(){
			routes = {
				test: {
					called: false,
					shown: false
				},
				'other-test': {
					called: false,
					shown: false
				}
			};
		});

		describe('subscribe and route', function(){
			beforeEach(function(){
				spyOn(routing, 'getHash').andReturn('#test');
				spyOn(routing, 'routeTo');

				routing.subscribe('test', 
					function(show){
						routes.test.shown = show;
					}, 
					function(){
						routes.test.called = true;
					}
				);
			});

			it('single route', function(){
				routing.route();

				expect(routes.test.called).toBe(true);
				expect(routes.test.shown).toBe(true);
			});

			it('multiple routes', function(){
				routing.subscribe('other-test', 
					function(show){
						routes['other-test'].shown = show;
					}, 
					function(){
						routes['other-test'].called = true;
					}
				);

				routing.route();

				expect(routes.test.called).toBe(true);
				expect(routes.test.shown).toBe(true);
				expect(routes['other-test'].called).toBe(false);
				expect(routes['other-test'].shown).toBe(false);

				routes.test.called = false;
				routing.getHash.andReturn('#other-test');
				routing.route();

				expect(routes.test.called).toBe(false);
				expect(routes.test.shown).toBe(false);
				expect(routes['other-test'].called).toBe(true);
				expect(routes['other-test'].shown).toBe(true);

				routes['other-test'].called = false;
				routes['other-test'].shown = false;
				routing.getHash.andReturn('#test');
				routing.route();

				expect(routes.test.called).toBe(true);
				expect(routes.test.shown).toBe(true);
				expect(routes['other-test'].called).toBe(false);
				expect(routes['other-test'].shown).toBe(false);
			});

			it('can subscribe without providing an onload', function(){
				routing.subscribe('other-test', 
					function(show){
						routes['other-test'].shown = show;
					}
				);

				routing.getHash.andReturn('#other-test');

				expect(function(){
					routing.route();
				}).not.toThrow();

				expect(routes['other-test'].shown).toBe(true);
			});
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

		describe('routes to different routes', function(){
			beforeEach(function(){
				spyOn(routing, 'setHash');
				spyOn(routing, 'getHash').andReturn('#my-hash');
				spyOn(routing, 'route');
			});

			it('sets hash', function(){
				routing.routeTo('another-hash');
				expect(routing.setHash).toHaveBeenCalledWith('another-hash');
			});

			it('routes if current hash', function(){
				routing.routeTo('my-hash');
				expect(routing.route).toHaveBeenCalled();
			});
		});
	});
});