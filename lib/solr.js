'use strict';

const { v4: UUID } = require('uuid');

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

	get url() {
		return this._config.url;
	}

	get core() {
		return this._config.core;
	}

	get auth() {

		if(!this._config.user)
			return {};

		return {
			user: this._config.user,
			password: this._config.password
		};
	}

	get readTimeout() {
		return this._config.readTimeout;
	}

	get writeTimeout() {
		return this._config.writeTimeout;
	}

	get commitUpdates() {
		return this._config.commitUpdates;
	}

	get commitWithin() {
		return this._config.commitWithin;
	}

	get errorCodes() {
		return SolrError.codes;
	}

	get request() {

		if(!this._request)
			this._request = new Request(this.auth, this.readTimeout, this, this.writeTimeout);

		return this._request;
	}

	constructor(config) {
		this._config = ConfigValidator.validate(config);
	}

	/**
	 * Checks if the core (from config) exists in Solr
	 * @returns {boolean} true if exists, false otherwise.
	 */
	async coreExists() {

		const endpoint = Endpoint.create(Endpoint.presets.coreExists, this.url, this.core);

		const res = await this.request.post(endpoint);

		try {

			return Response.validate(res, { status: { [this.core]: { name: 'string' } } });

		} catch(err) {
			return false;
		}
	}

	/**
	 * Create a new core into Solr URL then create the fields schema.
	 * @param {Model} model Model instance
	 * @param {string} name The name for the new core to create
	 * @param {boolean} shouldBuildSchema Specifies if must update fields schema after creating the core.
	 * Default: true
	 * @returns {Boolean} true if the operation was successful
	 * @throws When something goes wrong
	 */
	async createCore(model, shouldBuildSchema = true) {

		try {

			this._validateModel(model);

		} catch(err) {
			// Should not explode when the model is invalid, also must not create any core.
			return;
		}

		await this._createCore();

		if(shouldBuildSchema)
			this.updateSchema(model);

		return true;
	}

	/**
	 * Reloads the Solr core
	 * @returns {Boolean} true if the operation was successful
	 */
	async reloadCore() {

		const endpoint = Endpoint.create(Endpoint.presets.reloadCore, this.url, this.core);

		const res = await this.request.post(endpoint);

		return Response.validate(res);
	}

	/**
	 * Get the existing fields schema from Solr
	 * @param {Model} model Model instance
	 * @returns {Array.<object>} The actual fields schema in Solr
	 * @throws When something goes wrong
	 */
	async getSchema() {

		const endpoint = Endpoint.create(Endpoint.presets.schemaFields, this.url, this.core);

		const res = await this.request.get(endpoint);

		Response.validate(res, {
			fields: ['object']
		});

		const { fields } = res;

		return Schema.format(fields);
	}

	/**
	 * Update the existing fields schema with the specified field types
	 * @param {Model} model Model instance
	 * @returns {Boolean} true if the operation was successful
	 * @throws When something goes wrong
	 */
	async updateSchema(model) {

		this._validateModel(model);

		const schema = model.constructor.schema || {};

		const currentSchemas = await this.getSchema();

		const query = Schema.query(schema, currentSchemas);

		const endpoint = Endpoint.create(Endpoint.presets.schema, this.url, this.core);

		const res = await this.request.post(endpoint, query);

		Response.validate(res);

		return this.reloadCore();
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

		const endpoint = Endpoint.create(Endpoint.presets.update, this.url, this.core, {
			commitUpdates: this.commitUpdates,
			commitWithin: this.commitWithin
		});

		const res = await this.request.post(endpoint, item);

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

		const endpoint = Endpoint.create(Endpoint.presets.update, this.url, this.core, {
			commitUpdates: this.commitUpdates,
			commitWithin: this.commitWithin
		});

		const res = await this.request.post(endpoint, items);

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

		const endpoint = Endpoint.create(Endpoint.presets.get, this.url, this.core);

		const page = params.page || 1;
		const limit = params.limit || DEFAULT_LIMIT;

		const query = Query.get({ ...params, page, limit, fields });

		const res = await this.request.get(endpoint, query);

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

		const endpoint = Endpoint.create(Endpoint.presets.get, this.url, this.core);

		const res = await this.request.get(endpoint, query);

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

		const endpoint = Endpoint.create(Endpoint.presets.updateCommands, this.url, this.core, {
			commitUpdates: this.commitUpdates,
			commitWithin: this.commitWithin
		});

		const res = await this.request.post(endpoint, { delete: { id: item.id } });

		return Response.validate(res);
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

		const endpoint = Endpoint.create(Endpoint.presets.updateCommands, this.url, this.core, {
			commitUpdates: this.commitUpdates,
			commitWithin: this.commitWithin
		});

		const query = Query.delete({ filters, fields });

		const res = await this.request.post(endpoint, query);

		return Response.validate(res);
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

		const endpoint = Endpoint.create(Endpoint.presets.get, this.url, this.core);

		const page = params.page || 1;
		const limit = params.limit || DEFAULT_LIMIT;

		const query = Query.distinct({ ...params, limit, page, fields });

		const res = await this.request.get(endpoint, query);

		Response.validate(res, {
			response: { docs: ['object'] }
		});

		const { docs } = res.response;

		return docs.map(({ [params.key]: value }) => value);
	}

	/**
	 * Checks if the Solr host and core is online
	 * @returns {Boolean} true if the ping status is OK, false otherwise
	 */
	async ping() {

		const endpoint = Endpoint.create(Endpoint.presets.ping, this.url, this.core);

		try {

			const res = await this.request.get(endpoint);

			Response.validate(res, {
				status: 'string'
			});

			return res.status === 'OK';

		} catch(err) {
			return false;
		}
	}

	async _createCore() {

		const coreExists = await this.coreExists();

		if(coreExists)
			return;

		const endpoint = Endpoint.create(Endpoint.presets.createCore, this.url, this.core);
		const res = await this.request.post(endpoint);

		Response.validate(res);
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
}

module.exports = Solr;
