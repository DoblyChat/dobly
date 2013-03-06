REPORTER = spec

test:
	@NODE_ENV=test ./node_modules/.bin/mocha \
		--reporter $(REPORTER) \
		--require test/test_helper.js \
		--timeout 1000 \

test-debug:
	@NODE_ENV=test ./node_modules/.bin/mocha \
		debug \
		--reporter $(REPORTER) \
		--require test/test_helper.js \
		--timeout 1000 \

seed:
	@NODE_ENV=development node seed/index.js

blast:
	@NODE_ENV=development node seed/blast.js	

.PHONY: test test-debug seed blast