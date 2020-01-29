'use strict';

const SolrError = require('./solr-error');

const ConfigValidator = require('./config-validator');
const Endpoint = require('./helpers/endpoint');
const Request = require('./helpers/request');

class Solr {

	constructor(config) {
		this._config = ConfigValidator.validate(config);
	}

	async multiInsert(model, items) {

		this._validateModel(model);

		const endpoint = Endpoint.update(this._url, model.constructor.table);

		return !!await Request.post(endpoint, items);
	}

	async get(model, params) {

		this._validateModel(model);

		const endpoint = Endpoint.get(this._url, model.constructor.table);

		// TODO: filters

		const res = await Request.get(endpoint, {
			query: '*:*'
			// filters
		});

		return res.response.docs;
	}

	_validateModel(model) {

		if(!model)
			throw new SolrError('Invalid or empty model.', SolrError.codes.INVALID_MODEL);

		if(!model.constructor.table)
			throw new SolrError('Invalid model: Should have an static getter for table name.', SolrError.codes.INVALID_MODEL);
	}

	get _url() {
		return this._config.url;
	}
}

module.exports = Solr;
