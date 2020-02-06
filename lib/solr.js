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
	 * @param {Model} model Model instance
	 * @param {Object} item The item to insert
	 * @returns {String} The ID of the inserted item
	 * @throws When something goes wrong
	 * @example
	 * await insert(model, { field: 'value' });
	 * // Expected result
	 * 'f429592c-8318-4507-a2ea-1b7fc388162a'
	 */
	async insert(model, item) {

		this._validateModel(model);

		if(!isObject(item))
			throw new SolrError('Invalid item: Should be an object, also not an array.', SolrError.codes.INVALID_PARAMETERS);

		item = this._prepareItem(item);

		const { table } = model.constructor;
		const endpoint = Endpoint.create(Endpoint.presets.update, this._url, table);

		const res = await Request.post(endpoint, item);

		this._validateResponse(res);

		return item.id;
	}

	/**
	 * Inserts multiple items into Solr
	 * @param {Model} model Model instance
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

		this._validateModel(model);

		if(!Array.isArray(items))
			throw new SolrError('Invalid items: Should be an array.', SolrError.codes.INVALID_PARAMETERS);

		items = items.map(this._prepareItem);

		const { table } = model.constructor;
		const endpoint = Endpoint.create(Endpoint.presets.update, this._url, table);

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

		const { table, fields } = model.constructor;

		const endpoint = Endpoint.create(Endpoint.presets.get, this._url, table);

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

		const { table } = model.constructor;
		const endpoint = Endpoint.create(Endpoint.presets.get, this._url, table);

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
	 * Create the field schemas with the specified field types
	 * @param {Model} model Model instance
	 * @throws When something goes wrong
	 */
	async createSchemas(model) {

		this._validateModel(model);

		const { table, schemas } = model.constructor;

		if(!schemas)
			return;

		const query = Schema.buildQuery('add', schemas);

		const endpoint = Endpoint.create(Endpoint.presets.schemas, this._url, table);

		const res = await Request.post(endpoint, query);

		this._validateResponse(res);
	}

	/**
	 * Update the existing field schemas with the specified field types
	 * @param {Model} model Model instance
	 * @throws When something goes wrong
	 */
	async updateSchemas(model) {

		this._validateModel(model);

		const { table, schemas } = model.constructor;

		if(!schemas)
			return;

		const query = Schema.buildQuery('replace', schemas);
		const endpoint = Endpoint.create(Endpoint.presets.schemas, this._url, table);

		const res = await Request.post(endpoint, query);

		this._validateResponse(res);
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

		const { table, fields, schemas } = model.constructor;

		if(!table)
			throw new SolrError('Invalid model: Should have an static getter for table name.', SolrError.codes.INVALID_MODEL);

		if(fields && !isObject(fields))
			throw new SolrError('Invalid model: Fields should be an object, also not an array.', SolrError.codes.INVALID_MODEL);

		if(schemas && !isObject(schemas))
			throw new SolrError('Invalid model: Schemas should be an object, also not an array.', SolrError.codes.INVALID_MODEL);
	}

	get _url() {
		return this._config.url;
	}
}

module.exports = Solr;
