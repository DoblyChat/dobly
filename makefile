test:
	@NODE_ENV=test ./node_modules/jasmine-node/bin/jasmine-node --forceexit --captureExceptions specs/server/

seed:
	@NODE_ENV=development node seed/index.js

blast:
	@NODE_ENV=development node seed/blast.js	

.PHONY: test test-debug seed blast