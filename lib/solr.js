'use strict';

const SolrError = require('./solr-error');

const ConfigValidator = require('./config-validator');

class Solr {

	constructor(config) {
		this._config = ConfigValidator.validate(config);
	}


}

module.exports = Solr;
