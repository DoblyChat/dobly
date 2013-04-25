test:
	@NODE_ENV=test ./node_modules/jasmine-node/bin/jasmine-node --verbose --forceexit --captureExceptions specs/

seed:
	@NODE_ENV=development node seed/index.js

blast:
	@NODE_ENV=development node seed/blast.js	

jasmine:
	@NODE_ENV=test node specs/client/server.js

.PHONY: test test-debug seed blast