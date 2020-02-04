'use strict';

class SolrError extends Error {

	static get codes() {

		return {
			INVALID_CONFIG: 1,
			INVALID_MODEL: 2,
			INVALID_FILTER_TYPE: 3,
			INVALID_FILTER_VALUE: 4,
			REQUEST_FAILED: 5,
			INTERNAL_SOLR_ERROR: 6,
			INVALID_PARAMETERS: 7
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
