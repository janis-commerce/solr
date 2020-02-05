'use strict';

const assert = require('assert');

const nock = require('nock');

const sandbox = require('sinon').createSandbox();

const Solr = require('../lib/solr');

const SolrError = require('../lib/solr-error');

describe('Solr', () => {

	afterEach(() => {
		sandbox.restore();
		nock.cleanAll();
	});

	class FakeModel {

		static get table() {
			return 'some-core';
		}

		static get fields() {
			return {
				string: true,
				number: { type: 'number' },
				float: { type: 'float' },
				double: { type: 'double' },
				long: { type: 'long' },
				boolean: { type: 'boolean' },
				date: { type: 'date' },
				array: { type: ['string'] },
				object: {
					type: {
						property: 'string',
						subproperty: {
							property: ['number']
						}
					}
				}
			};
		}
	}

	const builtSchemas = [
		{
			name: 'string',
			type: 'string'
		},
		{
			name: 'number',
			type: 'pint'
		},
		{
			name: 'float',
			type: 'pfloat'
		},
		{
			name: 'double',
			type: 'pdouble'
		},
		{
			name: 'long',
			type: 'plong'
		},
		{
			name: 'boolean',
			type: 'boolean'
		},
		{
			name: 'date',
			type: 'pdate'
		},
		{
			name: 'array',
			type: 'string',
			multiValued: true
		},
		{
			name: 'object.property',
			type: 'string'
		},
		{
			name: 'object.subproperty.property',
			type: 'pint',
			multiValued: true
		}
	];

	const host = 'http://some-host.com';

	const endpoints = {
		update: '/solr/some-core/update/json/docs?commit=true',
		get: '/solr/some-core/query',
		schema: '/solr/some-core/schema'
	};

	const model = new FakeModel();

	const solr = new Solr({
		url: host
	});

	describe('insert()', () => {

		const item = {
			id: 'some-id',
			some: 'data'
		};

		it('Should call Solr POST api to insert the received item', async () => {

			const request = nock(host)
				.post(endpoints.update, item)
				.reply(200, {
					responseHeader: {
						status: 0
					}
				});

			const result = await solr.insert(model, item);

			assert.deepEqual(result, item.id);
			request.done();
		});

		it('Should throw when the received model is invalid', async () => {

			await assert.rejects(solr.insert(null, item), {
				name: 'SolrError',
				code: SolrError.codes.INVALID_MODEL
			});
		});

		[

			null,
			undefined,
			'string',
			1,
			['array']

		].forEach(invalidItem => {

			it('Should throw when the received item is not an object', async () => {

				await assert.rejects(solr.insert(model, invalidItem), {
					name: 'SolrError',
					code: SolrError.codes.INVALID_PARAMETERS
				});
			});
		});

		it('Should throw when the Solr response code is bigger or equal than 400', async () => {

			const request = nock(host)
				.post(endpoints.update, item)
				.reply(400, {
					responseHeader: {
						status: 400
					}
				});

			await assert.rejects(solr.insert(model, item), {
				name: 'SolrError',
				code: SolrError.codes.REQUEST_FAILED
			});

			request.done();
		});

		it('Should throw when the Solr response is invalid', async () => {

			const request = nock(host)
				.post(endpoints.update)
				.reply(200, {
					responseHeader: {
						status: 1
					}
				});

			await assert.rejects(solr.insert(model, item), {
				name: 'SolrError',
				code: SolrError.codes.INTERNAL_SOLR_ERROR
			});

			request.done();
		});
	});

	describe('multiInsert()', () => {

		const items = [
			{
				id: 'some-id',
				some: 'data'
			},
			{
				id: 'other-id',
				other: 'data'
			}
		];

		it('Should call Solr POST api to insert the received items', async () => {

			const request = nock(host)
				.post(endpoints.update, items)
				.reply(200, {
					responseHeader: {
						status: 0
					}
				});

			const result = await solr.multiInsert(model, items);

			assert.deepStrictEqual(result, items);
			request.done();
		});

		it('Should throw when the received model is invalid', async () => {

			sandbox.stub(FakeModel, 'fields')
				.get(() => []);

			await assert.rejects(solr.multiInsert(model, items), {
				name: 'SolrError',
				code: SolrError.codes.INVALID_MODEL
			});
		});

		[

			null,
			undefined,
			'string',
			1,
			{ not: 'an array' }

		].forEach(invalidItem => {

			it('Should throw when the received items are not an array', async () => {

				await assert.rejects(solr.multiInsert(model, invalidItem), {
					name: 'SolrError',
					code: SolrError.codes.INVALID_PARAMETERS
				});
			});
		});

		it('Should throw when the Solr response code is bigger or equal than 400', async () => {

			const request = nock(host)
				.post(endpoints.update, items)
				.reply(400, {
					responseHeader: {
						status: 400
					}
				});

			await assert.rejects(solr.multiInsert(model, items), {
				name: 'SolrError',
				code: SolrError.codes.REQUEST_FAILED
			});

			request.done();
		});

		it('Should throw when the Solr response is invalid', async () => {

			const request = nock(host)
				.post(endpoints.update)
				.reply(200, {
					responseHeader: {
						status: 1
					}
				});

			await assert.rejects(solr.multiInsert(model, items), {
				name: 'SolrError',
				code: SolrError.codes.INTERNAL_SOLR_ERROR
			});

			request.done();
		});
	});

	describe('get()', () => {

		it('Should call Solr GET api to get the items and format it correctly', async () => {

			const request = nock(host)
				.get(endpoints.get, {
					query: '*:*',
					offset: 0,
					limit: 500
				})
				.reply(200, {
					responseHeader: {
						status: 0
					},
					response: {
						docs: [
							{
								id: 'some-id',
								some: 'data',
								'object.property': 'some-property',
								'object.subproperty.property': [1, 2, 3],
								_version_: 1122111221
							}
						]
					}
				});

			const result = await solr.get(model);

			assert.deepStrictEqual(result, [
				{
					id: 'some-id',
					some: 'data',
					object: {
						property: 'some-property',
						subproperty: {
							property: [1, 2, 3]
						}
					}
				}
			]);

			request.done();
		});

		it('Should call Solr GET api to get the items with the specified params', async () => {

			const request = nock(host)
				.get(endpoints.get, {
					query: '*:*',
					offset: 5,
					limit: 5,
					filter: ['-id:"other-id"', 'some:"data"'],
					sort: 'id asc, some desc'
				})
				.reply(200, {
					responseHeader: {
						status: 0
					},
					response: {
						docs: [
							{
								id: 'some-id',
								some: 'data'
							}
						]
					}
				});

			const result = await solr.get(model, {
				limit: 5,
				page: 2,
				order: { id: 'asc', some: 'desc' },
				filters: {
					id: { type: 'notEqual', value: 'other-id' },
					some: 'data'
				}
			});

			assert.deepStrictEqual(result, [
				{
					id: 'some-id',
					some: 'data'
				}
			]);

			request.done();
		});

		it('Should throw when the received model is invalid', async () => {

			await assert.rejects(solr.get(null), {
				name: 'SolrError',
				code: SolrError.codes.INVALID_MODEL
			});
		});
	});

	describe('createSchemas()', () => {

		it('Should call Solr POST api to create the schemas', async () => {

			const request = nock(host)
				.post(endpoints.schema, {
					'add-field': builtSchemas
				})
				.reply(200, {
					responseHeader: {
						status: 0
					}
				});

			await assert.doesNotReject(solr.createSchemas(model));

			request.done();
		});
	});

	describe('updateSchemas()', () => {

		it('Should call Solr POST api to create the schemas', async () => {

			const request = nock(host)
				.post(endpoints.schema, {
					'replace-field': builtSchemas
				})
				.reply(200, {
					responseHeader: {
						status: 0
					}
				});

			await assert.doesNotReject(solr.updateSchemas(model));

			request.done();
		});
	});
});
