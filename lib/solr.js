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

		const res = await Request.post(endpoint, item, this._auth);

		Response.validate(res);

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

		const res = await Request.post(endpoint, items, this._auth);

		Response.validate(res);

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

		const query = Query.get({ ...params, page, limit, fields });

		const res = await Request.get(endpoint, query, this._auth);

		Response.validate(res, {
			response: { docs: ['object'] }
		});

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

		const res = await Request.get(endpoint, query, this._auth);

		Response.validate(res, {
			response: { numFound: 'number' }
		});

		const { numFound } = res.response;

		return {
			total: numFound,
			pageSize: limit,
			pages: Math.ceil(numFound / limit),
			page
		};
	}

	/**
	 * Removes an item from the database
	 * @param {Model} model Model instance
	 * @param {Object} item The item to delete
	 * @returns {Boolean} true if the operation was successful
	 * @throws When something goes wrong
	 * @example
	 * await remove(model, { id: 'some-id', value: 'some-value' });
	 */
	async remove(model, item) {

		if(!isObject(item))
			throw new SolrError('Invalid item: Should be an object, also not an array.', SolrError.codes.INVALID_PARAMETERS);

		if(!item.id)
			throw new SolrError('Invalid item: Should have an ID.', SolrError.codes.INVALID_PARAMETERS);

		const endpoint = Endpoint.create(Endpoint.presets.updateCommands, this._url, this._core);

		const res = await Request.post(endpoint, { delete: { id: item.id } }, this._auth);

		Response.validate(res);

		return true;
	}

	/**
	 * Multi remove items from the database
	 * @param {Model} model Model instance
	 * @param {Object} filters solr filters
	 * @returns {Boolean} true if the operation was successful
	 * @throws When something goes wrong
	 * @example
	 * await multiRemove(model, { myField: { type: 'greater', value: 10 } });
	 */
	async multiRemove(model, filters) {

		this._validateModel(model);

		const { fields } = model.constructor;

		const endpoint = Endpoint.create(Endpoint.presets.updateCommands, this._url, this._core);

		const query = Query.delete({ filters, fields });

		const res = await Request.post(endpoint, query, this._auth);

		Response.validate(res);

		return true;
	}

	/**
	 * Get distinct values of a field
	 * @param {Model} model Model instance
	 * @param {Object} params parameters (key and filters)
	 * @return {Array} results
	 * @example
	 * await distinct(model, { key: 'myField', { filters: { field: { type: 'lesser', value: 32 } } } })
	 * // Expected result
	 * ['some data', 'other data']
	 */
	async distinct(model, params = {}) {

		this._validateModel(model);

		const { fields } = model.constructor;

		const endpoint = Endpoint.create(Endpoint.presets.get, this._url, this._core);

		const query = Query.distinct({ ...params, fields });

		const res = await Request.get(endpoint, query, this._auth);

		Response.validate(res, {
			grouped: { [params.key]: { groups: ['object'] } }
		});

		const { groups } = res.grouped[params.key];

		return groups.map(({ doclist }) => {

			// When grouping by specific field, the doclist.docs array will be always with one item
			const [value] = Object.values(doclist.docs[0]);

			return value;
		});
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

		const res = await Request.post(endpoint, query, this._auth);

		Response.validate(res);
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

		const res = await Request.post(endpoint, query, this._auth);

		Response.validate(res);
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

		const res = await Request.post(endpoint, null, this._auth);

		Response.validate(res);

		return this.createSchema(model, name);
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

	get _auth() {

		if(!this._config.user)
			return {};

		return {
			user: this._config.user,
			password: this._config.password
		};
	}
}

module.exports = Solr;
