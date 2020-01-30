'use strict';

const SolrError = require('./solr-error');

const ConfigValidator = require('./config-validator');
const Endpoint = require('./helpers/endpoint');
const Request = require('./helpers/request');
const Schema = require('./helpers/schema');

class Solr {

	constructor(config) {
		this._config = ConfigValidator.validate(config);
	}

	async insert(model, item) {
		return this.multiInsert(model, [item]);
	}

	async multiInsert(model, items) {

		this._validateModel(model);

		const { table } = model.constructor;
		const endpoint = Endpoint.create(Endpoint.presets.update, this._url, table);

		return !!await Request.post(endpoint, items);
	}

	async get(model, params) {

		this._validateModel(model);

		const { table } = model.constructor;
		const endpoint = Endpoint.create(Endpoint.presets.get, this._url, table);

		const res = await Request.get(endpoint, {
			query: '*:*'
			// filters
		});

		return res.response.docs;
	}

	async createSchemas(model) {

		this._validateModel(model);

		const { table } = model.constructor;
		const query = Schema.buildQuery('add', model);
		const endpoint = Endpoint.create(Endpoint.presets.schemas, this._url, table);

		return Request.post(endpoint, query);
	}

	async updateSchemas(model) {

		this._validateModel(model);

		const { table } = model.constructor;
		const query = Schema.buildQueryByModel('replace', model);
		const endpoint = Endpoint.create(Endpoint.presets.schemas, this._url, table);

		return Request.post(endpoint, query);
	}

	_validateModel(model) {

		if(!model)
			throw new SolrError('Invalid or empty model.', SolrError.codes.INVALID_MODEL);

		const { table, fields } = model.constructor;

		if(!table)
			throw new SolrError('Invalid model: Should have an static getter for table name.', SolrError.codes.INVALID_MODEL);

		if((fields && typeof fields !== 'object') || Array.isArray(fields))
			throw new SolrError('Invalid model: Fields should be an object', SolrError.codes.INVALID_MODEL);
	}

	get _url() {
		return this._config.url;
	}
}

module.exports = Solr;
