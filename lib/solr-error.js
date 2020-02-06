'use strict';

class SolrError extends Error {

	static get codes() {

		return {
			INVALID_CONFIG: 1,
			INVALID_MODEL: 2,
			INVALID_FILTER_TYPE: 3,
			INVALID_FILTER_VALUE: 4,
			UNSUPPORTED_FILTER: 5,
			REQUEST_FAILED: 6,
			INTERNAL_SOLR_ERROR: 7,
			INVALID_PARAMETERS: 8
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
