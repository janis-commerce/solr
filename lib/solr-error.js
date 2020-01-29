'use strict';

class SolrError extends Error {

	static get codes() {

		return {
			INVALID_CONFIG: 1,
			INVALID_MODEL: 2
		};

	}

	constructor(err, code) {
		super(err);
		this.message = err.message || err;
		this.code = code;
		this.name = 'SolrError';
	}
}

module.exports = SolrError;
