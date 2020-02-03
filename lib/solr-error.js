'use strict';

class SolrError extends Error {

	static get codes() {

		return {
			INVALID_CONFIG: 1,
			INVALID_MODEL: 2,
			INVALID_FILTER_TYPE: 3,
			REQUEST_FAILED: 4,
			INTERNAL_SOLR_ERROR: 5
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
