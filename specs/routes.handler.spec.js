describe('Routes handler', function(){

	var handler = require('../routes/handler');

	describe('#check user session', function(){
		it('continues processing if user in session', function(){
			var req = { user: {} };
			var next = jasmine.createSpy();

			handler.checkUserIsLoggedIn(req, null, next);

			expect(next).toHaveBeenCalled();
		});

		it('recirects to login route if no current session', function(){
			var req = {};
			var res = { redirect: jasmine.createSpy() };
		});
	});
});