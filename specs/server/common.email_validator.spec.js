describe("email validator", function() {

	var emailValidator = require('../../lib/common/email_validator');

	it("valid", function() {
		expect(emailValidator.isValid('a@b.com')).toBe(true);
	});

	it("invalid", function() {
		expect(emailValidator.isValid('b-b.com')).toBe(false);
	});
});