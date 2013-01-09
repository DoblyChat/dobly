REPORTER = spec

test:
	@NODE_ENV=test ./node_modules/.bin/mocha \
		--reporter $(REPORTER) \
		--require test/test_helper.js \

test-debug:
	@NODE_ENV=test ./node_modules/.bin/mocha \
		debug \
		--reporter $(REPORTER) \
		--require test/test_helper.js \

seed:
	@NODE_ENV=development node seed/index.js

.PHONY: test test-debug seed