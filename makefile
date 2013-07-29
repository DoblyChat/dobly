seed:
	@NODE_ENV=development node seed/index.js

blast:
	@NODE_ENV=development node seed/blast.js

.PHONY: test test-debug seed blast
