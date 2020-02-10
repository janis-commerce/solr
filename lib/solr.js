'use strict';

const UUID = require('uuid/v4');

const { isObject } = require('./helpers/utils');

const SolrError = require('./solr-error');

const ConfigValidator = require('./config-validator');

const Response = require('./helpers/response');
const Endpoint = require('./helpers/endpoint');
const Request = require('./helpers/request');
const Schema = require('./helpers/schema');
const Query = require('./helpers/query');

const DEFAULT_LIMIT = 500;

class Solr {

	constructor(config) {
		this._config = ConfigValidator.validate(config);
	}

	/**
	 * Inserts an item into Solr
	 * @param {Model} model Model instance (not used but required for @janiscommerce/model compatibilty)
	 * @param {Object} item The item to insert
	 * @returns {String} The ID of the inserted item
	 * @throws When something goes wrong
	 * @example
	 * await insert(model, { field: 'value' });
	 * // Expected result
	 * 'f429592c-8318-4507-a2ea-1b7fc388162a'
	 */
	async insert(model, item) {

		if(!isObject(item))
			throw new SolrError('Invalid item: Should be an object, also not an array.', SolrError.codes.INVALID_PARAMETERS);

		item = this._prepareItem(item);

		const endpoint = Endpoint.create(Endpoint.presets.update, this._url, this._core);

		const res = await Request.post(endpoint, item);

		this._validateResponse(res);

		return item.id;
	}

	/**
	 * Inserts multiple items into Solr
	 * @param {Model} model Model instance (not used but required for @janiscommerce/model compatibilty)
	 * @param {Array.<object>} items The items to insert
	 * @returns {Array.<object>} The inserted items
	 * @throws When something goes wrong
	 * @example
	 * await multiInsert(model, [
	 * 	{ field: 'value' },
	 * 	{ field: 'other value' }
	 * ]);
	 * // Expected result
	 * [
	 * 	{ id: '699ff4c9-ec23-44ab-adb6-36f19b1712f6', field: 'value' },
	 * 	{ id: 'f429592c-8318-4507-a2ea-1b7fc388162a', field: 'other value' }
	 * ]
	 */
	async multiInsert(model, items) {

		if(!Array.isArray(items))
			throw new SolrError('Invalid items: Should be an array.', SolrError.codes.INVALID_PARAMETERS);

		items = items.map(this._prepareItem);

		const endpoint = Endpoint.create(Endpoint.presets.update, this._url, this._core);

		const res = await Request.post(endpoint, items);

		this._validateResponse(res);

		return items;
	}

	/**
	 * Get data from Solr database
	 * @param {Model} model Model instance
	 * @param {Object} params Get parameters (limit, filters, order, page)
	 * @returns {Array.<object>} Solr get result
	 * @throws When something goes wrong
	 * @example
	 * await get(model, {
	 * 	limit: 10,
	 * 	page: 2,
	 * 	order: { field: 'asc' },
	 * 	filters: {
	 * 		field: { type: 'greater', value: 32 }
	 * 	}
	 * });
	 * // Expected result
	 * [
	 * 	{
	 * 		id: '699ff4c9-ec23-44ab-adb6-36f19b1712f6'
	 * 		field: 34
	 * 	},
	 * 	{
	 * 		id: 'f429592c-8318-4507-a2ea-1b7fc388162a',
	 * 		field: 33
	 * 	}
	 * ]
	 */
	async get(model, params = {}) {

		this._validateModel(model);

		const { fields } = model.constructor;

		const endpoint = Endpoint.create(Endpoint.presets.get, this._url, this._core);

		const page = params.page || 1;
		const limit = params.limit || DEFAULT_LIMIT;

		const query = Query.build({ ...params, page, limit, fields });

		const res = await Request.get(endpoint, query);

		this._validateResponse(res);

		const { docs } = res.response;

		model.lastQueryHasResults = !!docs.length;
		model.totalsParams = { page, limit, query };

		return Response.format(docs);
	}

	/**
	 * Get the paginated totals from the latest get query
	 * @param {Model} model Model instance
	 * @returns {Object} total, page size, pages and page from the results
	 */
	async getTotals(model) {

		this._validateModel(model);

		if(!model.lastQueryHasResults)
			return { total: 0, pages: 0 };

		const { page, limit, query } = model.totalsParams;

		const endpoint = Endpoint.create(Endpoint.presets.get, this._url, this._core);

		const res = await Request.get(endpoint, query);

		this._validateResponse(res);

		const { numFound } = res.response;

		return {
			total: numFound,
			pageSize: limit,
			pages: Math.ceil(numFound / limit),
			page
		};
	}

	/**
	 * Create the fields schema with the specified field types
	 * @param {Model} model Model instance
	 * @param {string} core The core name where create the schemas (Default: core from config)
	 * @throws When something goes wrong
	 */
	async createSchema(model, core = this._core) {

		this._validateModel(model);

		const { schema } = model.constructor;

		if(!schema)
			return;

		const query = Schema.buildQuery('add', schema);

		const endpoint = Endpoint.create(Endpoint.presets.schema, this._url, core);

		const res = await Request.post(endpoint, query);

		this._validateResponse(res);
	}

	/**
	 * Update the existing fields schema with the specified field types
	 * @param {Model} model Model instance
	 * @throws When something goes wrong
	 */
	async updateSchema(model) {

		this._validateModel(model);

		const { schema } = model.constructor;

		if(!schema)
			return;

		const query = Schema.buildQuery('replace', schema);
		const endpoint = Endpoint.create(Endpoint.presets.schema, this._url, this._core);

		const res = await Request.post(endpoint, query);

		this._validateResponse(res);
	}

	/**
	 * Create a new core into Solr URL then create the fields schema.
	 * @param {Model} model Model instance
	 * @param {string} name The name for the new core to create
	 */
	async createCore(model, name) {

		try {

			this._validateModel(model);

		} catch(err) {
			// Should not explode when the model is invalid, also must not create any core.
			return;
		}

		const endpoint = Endpoint.create('admin/cores?action=CREATE&name={{name}}&configSet=_default', this._url, null, { name });

		const res = await Request.post(endpoint);

		this._validateResponse(res);

		return this.createSchema(model, name);
	}

	_validateResponse(res) {

		const { responseHeader, response } = res;

		if(!responseHeader || responseHeader.status !== 0)
			throw new SolrError('Invalid Solr response: No responseHeader received.', SolrError.codes.INTERNAL_SOLR_ERROR);

		if(response && !response.docs)
			throw new SolrError(`Invalid Solr response: ${JSON.stringify(response)}`, SolrError.codes.INTERNAL_SOLR_ERROR);
	}

	_prepareItem(item) {

		return {
			id: UUID(),
			...item
		};
	}

	_validateModel(model) {

		if(!model)
			throw new SolrError('Invalid or empty model.', SolrError.codes.INVALID_MODEL);

		const { fields, schema } = model.constructor;

		if(fields && !isObject(fields))
			throw new SolrError('Invalid model: Fields should be an object, also not an array.', SolrError.codes.INVALID_MODEL);

		if(schema && !isObject(schema))
			throw new SolrError('Invalid model: Schemas should be an object, also not an array.', SolrError.codes.INVALID_MODEL);
	}

	get _url() {
		return this._config.url;
	}

	get _core() {
		return this._config.core;
	}
}

module.exports = Solr;
