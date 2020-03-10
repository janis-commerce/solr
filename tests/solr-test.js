'use strict';

const assert = require('assert');

const nock = require('nock');

const sandbox = require('sinon').createSandbox();

const { base64 } = require('../lib/helpers/utils');

const Solr = require('../lib/solr');

const SolrError = require('../lib/solr-error');

describe('Solr', () => {

	afterEach(() => {
		sandbox.restore();
		nock.cleanAll();
	});

	class FakeModel {

		static get fields() {
			return {
				some: {
					type: 'notEqual'
				},
				myCustomField: {
					field: 'date',
					type: 'greaterOrEqual'
				}
			};
		}

		static get schema() {
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
		updateCommands: '/solr/some-core/update?commit=true',
		get: '/solr/some-core/query',
		schema: '/solr/some-core/schema',
		schemaFields: '/solr/some-core/schema/fields'
	};

	const model = new FakeModel();

	const solr = new Solr({
		url: host,
		core: 'some-core'
	});

	describe('constructor', () => {

		[

			null,
			undefined,
			1,
			'string',
			['array'],
			{ invalid: 'config' },
			{ url: ['not a string'], core: 'valid' },
			{ url: 'valid', core: ['not a string'] },
			{ url: 'valid', core: 'valid', user: ['not a string'], password: 'valid' },
			{ url: 'valid', core: 'valid', user: ['not a string'], password: ['not a string'] },
			{ url: 'valid', core: 'valid', user: 'valid', password: ['not a string'] },
			{ url: 'valid', core: 'valid', user: 'valid' }

		].forEach(config => {

			it('Should throw when the received config is invalid', async () => {
				assert.throws(() => new Solr(config), {
					name: 'SolrError',
					code: SolrError.codes.INVALID_CONFIG
				});
			});
		});

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
					filter: [
						'id:"some-id"',
						'-some:"data"',
						'date:[10 TO *] OR date:[11 TO *] OR date:[12 TO *]'
					],
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
					id: 'some-id',
					some: 'data',
					myCustomField: [10, 11, 12]
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

		it('Should call Solr GET api to get the items using auth credentials', async () => {

			const authorizedSolr = new Solr({
				url: host,
				core: 'some-core',
				user: 'some-user',
				password: 'some-password'
			});

			const expectedCredentials = `Basic ${base64('some-user:some-password')}`;

			const request = nock(host, { reqheaders: { Authorization: expectedCredentials } })
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

			const result = await authorizedSolr.get(model);

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

		it('Should throw when the Solr response code is bigger or equal than 400', async () => {

			const request = nock(host)
				.get(endpoints.get)
				.reply(400, {
					responseHeader: {
						status: 400
					}
				});

			await assert.rejects(solr.get(model), {
				name: 'SolrError',
				code: SolrError.codes.REQUEST_FAILED
			});

			request.done();
		});

		it('Should throw when the Solr response is invalid', async () => {

			const request = nock(host)
				.get(endpoints.get)
				.reply(200, {
					responseHeader: {
						status: 0
					},
					response: {}
				});

			await assert.rejects(solr.get(model), {
				name: 'SolrError',
				code: SolrError.codes.INTERNAL_SOLR_ERROR
			});

			request.done();
		});

		it('Should throw when the received model is invalid', async () => {

			sandbox.stub(FakeModel, 'fields')
				.get(() => ['not an object']);

			await assert.rejects(solr.get(model), {
				name: 'SolrError',
				code: SolrError.codes.INVALID_MODEL
			});
		});
	});

	describe('getTotals()', () => {

		afterEach(() => {
			delete model.lastQueryHasResults;
			delete model.totalsParams;
		});

		it('Should call Solr GET api to get the items count', async () => {

			const request = nock(host)
				.get(endpoints.get, {
					query: '*:*',
					limit: 500,
					offset: 0
				})
				.reply(200, {
					responseHeader: {
						status: 0
					},
					response: {
						numFound: 10,
						docs: Array(10).fill({ item: 'some-item' })
					}
				})
				.persist();

			await solr.get(model);

			const result = await solr.getTotals(model);

			assert.deepStrictEqual(result, {
				total: 10,
				pageSize: 500,
				pages: 1,
				page: 1
			});

			request.done();
		});

		it('Should return the default empty results when get can \'t find any item', async () => {

			const request = nock(host)
				.get(endpoints.get, {
					query: '*:*',
					limit: 500,
					offset: 0
				})
				.reply(200, {
					responseHeader: {
						status: 0
					},
					response: {
						numFound: 0,
						docs: []
					}
				});

			await solr.get(model);

			const result = await solr.getTotals(model);

			assert.deepStrictEqual(result, { total: 0, pages: 0 });

			request.done();
		});

		it('Should return the default empty results when get was not called', async () => {
			const result = await solr.getTotals(model);
			assert.deepStrictEqual(result, { total: 0, pages: 0 });
		});
	});

	describe('remove()', () => {

		const item = {
			id: 'some-id',
			some: 'data'
		};

		it('Should call Solr POST api to delete the received item', async () => {

			const request = nock(host)
				.post(endpoints.updateCommands, {
					delete: { id: item.id }
				})
				.reply(200, {
					responseHeader: {
						status: 0
					}
				});

			await assert.doesNotReject(solr.remove(model, item));

			request.done();
		});

		[

			null,
			undefined,
			'string',
			1,
			['array'],
			{ item: 'without id' }

		].forEach(invalidItem => {

			it('Should throw when the received item is not an object or not have ID', async () => {

				await assert.rejects(solr.remove(model, invalidItem), {
					name: 'SolrError',
					code: SolrError.codes.INVALID_PARAMETERS
				});
			});
		});

		it('Should throw when the Solr response code is bigger or equal than 400', async () => {

			const request = nock(host)
				.post(endpoints.updateCommands, {
					delete: { id: item.id }
				})
				.reply(400, {
					responseHeader: {
						status: 400
					}
				});

			await assert.rejects(solr.remove(model, item), {
				name: 'SolrError',
				code: SolrError.codes.REQUEST_FAILED
			});

			request.done();
		});

		it('Should throw when the Solr response is invalid', async () => {

			const request = nock(host)
				.post(endpoints.updateCommands, {
					delete: { id: item.id }
				})
				.reply(200, {
					responseHeader: {
						status: 1
					}
				});

			await assert.rejects(solr.remove(model, item), {
				name: 'SolrError',
				code: SolrError.codes.INTERNAL_SOLR_ERROR
			});

			request.done();
		});
	});

	describe('multiRemove()', () => {

		it('Should call Solr POST api to delete by the received filters', async () => {

			const request = nock(host)
				.post(endpoints.updateCommands, {
					delete: { query: 'field:"value" AND otherField:[* TO 10]' }
				})
				.reply(200, {
					responseHeader: {
						status: 0
					}
				});

			await assert.doesNotReject(solr.multiRemove(model, { field: 'value', otherField: { type: 'lesserOrEqual', value: 10 } }));

			request.done();
		});

		it('Should throw when the Solr response code is bigger or equal than 400', async () => {

			const request = nock(host)
				.post(endpoints.updateCommands, {})
				.reply(400, {
					responseHeader: {
						status: 400
					}
				});

			await assert.rejects(solr.multiRemove(model), {
				name: 'SolrError',
				code: SolrError.codes.REQUEST_FAILED
			});

			request.done();
		});

		it('Should throw when the Solr response is invalid', async () => {

			const request = nock(host)
				.post(endpoints.updateCommands, {
					delete: { query: 'field:"value"' }
				})
				.reply(200, {
					responseHeader: {
						status: 1
					}
				});

			await assert.rejects(solr.multiRemove(model, { field: 'value' }), {
				name: 'SolrError',
				code: SolrError.codes.INTERNAL_SOLR_ERROR
			});

			request.done();
		});

		it('Should throw when the received model is invalid', async () => {

			await assert.rejects(solr.multiRemove(), {
				name: 'SolrError',
				code: SolrError.codes.INVALID_MODEL
			});
		});
	});

	describe('distinct()', () => {

		it('Should call Solr GET api to get the items distinct and format it correctly', async () => {

			const request = nock(host)
				.get(endpoints.get, {
					query: '*:*',
					fields: 'someField',
					params: {
						group: true,
						'group.field': 'someField'
					},
					filter: ['otherField:"true"']
				})
				.reply(200, {
					responseHeader: {
						status: 0
					},
					grouped: {
						someField: {
							groups: [
								{
									doclist: { docs: [{ someField: 'some' }] }
								},
								{
									doclist: { docs: [{ someField: 'other' }] }
								}
							]
						}
					}
				});

			const result = await solr.distinct(model, { key: 'someField', filters: { otherField: true } });

			assert.deepStrictEqual(result, ['some', 'other']);

			request.done();
		});

		it('Should throw when the received key is not a string or not exists', async () => {

			await assert.rejects(solr.distinct(model, { key: ['not a string'] }), {
				name: 'SolrError',
				code: SolrError.codes.INVALID_PARAMETERS
			});
		});

		it('Should throw when the Solr response code is bigger or equal than 400', async () => {

			const request = nock(host)
				.get(endpoints.get, {
					query: '*:*',
					fields: 'someField',
					params: {
						group: true,
						'group.field': 'someField'
					}
				})
				.reply(400, {
					responseHeader: {
						status: 400
					}
				});

			await assert.rejects(solr.distinct(model, { key: 'someField' }), {
				name: 'SolrError',
				code: SolrError.codes.REQUEST_FAILED
			});

			request.done();
		});

		it('Should throw when the Solr response is invalid', async () => {

			const request = nock(host)
				.get(endpoints.get, {
					query: '*:*',
					fields: 'someField',
					params: {
						group: true,
						'group.field': 'someField'
					}
				})
				.reply(200, {
					responseHeader: {
						status: 1
					}
				});

			await assert.rejects(solr.distinct(model, { key: 'someField' }), {
				name: 'SolrError',
				code: SolrError.codes.INTERNAL_SOLR_ERROR
			});

			request.done();
		});

		it('Should throw when the received model is invalid', async () => {

			await assert.rejects(solr.distinct(), {
				name: 'SolrError',
				code: SolrError.codes.INVALID_MODEL
			});
		});
	});

	describe('getSchema()', () => {

		it('Should call Solr GET api to get the schema', async () => {

			const request = nock(host)
				.get(endpoints.schemaFields)
				.reply(200, {
					responseHeader: {
						status: 0
					},
					fields: builtSchemas
				});

			const currentSchemas = await solr.getSchema();

			assert.deepStrictEqual(currentSchemas, builtSchemas);

			request.done();
		});

	});

	describe('updateSchema()', () => {

		it('Should call Solr POST api to update the schema', async () => {

			const currentSchema = builtSchemas.slice(0, 3);

			const deprecatedField = {
				name: 'deprecatedField',
				type: 'string'
			};

			sandbox.stub(Solr.prototype, 'getSchema')
				.resolves([...currentSchema, deprecatedField]);

			const request = nock(host)
				.post(endpoints.schema, {
					'add-field': builtSchemas.slice(3),
					'replace-field': currentSchema,
					'delete-field': [{ name: deprecatedField.name }]
				})
				.reply(200, {
					responseHeader: {
						status: 0
					}
				});

			await assert.doesNotReject(solr.updateSchema(model));

			request.done();
		});

		it('Should delete the schemas in Solr when there are no schema in the model', async () => {

			sandbox.stub(FakeModel, 'schema')
				.get(() => undefined);

			sandbox.stub(Solr.prototype, 'getSchema')
				.resolves(builtSchemas);

			const request = nock(host)
				.post(endpoints.schema, {
					'add-field': [],
					'replace-field': [],
					'delete-field': builtSchemas.map(({ name }) => ({ name }))
				})
				.reply(200, {
					responseHeader: {
						status: 0
					}
				});

			await assert.doesNotReject(solr.updateSchema(model));

			request.done();
		});

		it('Should throw when the model is invalid', async () => {

			sandbox.stub(FakeModel, 'schema')
				.get(() => 'not an object');

			await assert.rejects(solr.updateSchema(model), {
				name: 'SolrError',
				code: SolrError.codes.INVALID_MODEL
			});
		});
	});

	describe('coreExists()', () => {

		it('Should return true when the Solr core exists', async () => {

			const request = nock(host)
				.post('/solr/admin/cores?action=STATUS&core=some-core')
				.reply(200, {
					responseHeader: {
						status: 0
					},
					status: {
						'some-core': {
							name: 'some-core'
						}
					}
				});

			const result = await solr.coreExists(model);

			assert.deepEqual(result, true);

			request.done();
		});

		it('Should return false when the Solr core not exists', async () => {

			const request = nock(host)
				.post('/solr/admin/cores?action=STATUS&core=some-core')
				.reply(200, {
					responseHeader: {
						status: 0
					},
					status: {
						'some-core': {}
					}
				});

			const result = await solr.coreExists(model);

			assert.deepEqual(result, false);

			request.done();
		});
	});

	describe('createCore()', () => {

		it('Should create a core into the Solr URL', async () => {

			sandbox.stub(Solr.prototype, 'coreExists')
				.resolves(false);

			sandbox.stub(Solr.prototype, 'updateSchema')
				.resolves();

			const request = nock(host)
				.post('/solr/admin/cores?action=CREATE&name=some-core&configSet=_default')
				.reply(200, {
					responseHeader: {
						status: 0
					}
				});

			await assert.doesNotReject(solr.createCore(model));

			request.done();
			sandbox.assert.calledOnce(Solr.prototype.updateSchema);
			sandbox.assert.calledWithExactly(Solr.prototype.updateSchema, model);
		});

		it('Should not build the schemas when shouldBuildSchema is set to false', async () => {

			sandbox.stub(Solr.prototype, 'coreExists')
				.resolves(false);

			sandbox.stub(Solr.prototype, 'updateSchema')
				.resolves();

			const request = nock(host)
				.post('/solr/admin/cores?action=CREATE&name=some-core&configSet=_default')
				.reply(200, {
					responseHeader: {
						status: 0
					}
				});

			await assert.doesNotReject(solr.createCore(model, false));

			request.done();
			sandbox.assert.notCalled(Solr.prototype.updateSchema);
		});

		it('Should not create the core when it already exists', async () => {

			sandbox.stub(Solr.prototype, 'coreExists')
				.resolves(true);

			sandbox.stub(Solr.prototype, 'updateSchema')
				.resolves();

			const request = nock(host)
				.post('/solr/admin/cores?action=CREATE&name=new-core&configSet=_default')
				.reply(200, {
					responseHeader: {
						status: 0
					}
				});

			await assert.doesNotReject(solr.createCore(model));

			assert.deepEqual(request.isDone(), false);

			sandbox.assert.calledOnce(Solr.prototype.updateSchema);
			sandbox.assert.calledWithExactly(Solr.prototype.updateSchema, model);
		});

		it('Should not reject when the received model is invalid', async () => {

			sandbox.stub(Solr.prototype, 'coreExists')
				.resolves(false);

			sandbox.stub(Solr.prototype, 'updateSchema')
				.resolves();

			const request = nock(host)
				.post('/solr/admin/cores?action=CREATE&name=new-core&configSet=_default')
				.reply(200, {
					responseHeader: {
						status: 0
					}
				});

			await assert.doesNotReject(solr.createCore(null));

			assert.deepEqual(request.isDone(), false);
			sandbox.assert.notCalled(Solr.prototype.updateSchema);
		});
	});
});
