'use strict';

const assert = require('assert');

const SolrError = require('../../lib/solr-error');

const Filters = require('../../lib/helpers/filters');

describe('Helpers', () => {

	describe('Filters', () => {

		describe('build()', () => {

			const modelFields = {
				customField: {
					field: 'equal',
					type: 'notEqual'
				},
				customDefault: {
					type: 'greaterOrEqual'
				}
			};

			it('Should build the filters for the received fields and model fields', () => {

				const filters = Filters.build({

					equalDefault: 'something',
					customDefault: 32,
					equal: { type: 'equal', value: 'something' },
					notEqual: { type: 'notEqual', value: 'something' },
					search: { type: 'search', value: 'foo' },
					greater: { type: 'greater', value: 10 },
					greaterOrEqual: { type: 'greaterOrEqual', value: 10 },
					lesser: { type: 'lesser', value: 10 },
					lesserOrEqual: { type: 'lesserOrEqual', value: 10 },
					multiFilters: ['some', 'other', { type: 'greater', value: 5 }],
					customField: { value: 'foobar' }

				}, modelFields);

				assert.deepStrictEqual(filters, [
					'equalDefault:"something"',
					'customDefault:[32 TO *]',
					'equal:"something"',
					'-notEqual:"something"',
					'search:*"foo"*',
					'greater:{10 TO *}',
					'greaterOrEqual:[10 TO *]',
					'lesser:{* TO 10}',
					'lesserOrEqual:[* TO 10]',
					'multiFilters:"some" OR multiFilters:"other" OR multiFilters:{5 TO *}',
					'-equal:"foobar"'
				]);
			});

			it('Should throw when the received filters is not supported', () => {

				assert.throws(() => Filters.build({ field: { type: 'equal', value: ['somevalue', ['array']] } }), {
					name: 'SolrError',
					code: SolrError.codes.UNSUPPORTED_FILTER
				});
			});

			it('Should throw when the received filter doesn\'t have a value', () => {

				assert.throws(() => Filters.build({ field: { type: 'equal' } }), {
					name: 'SolrError',
					code: SolrError.codes.INVALID_FILTER_VALUE
				});
			});

			it('Should throw when the received filter have an unknown or unsupported type', () => {

				assert.throws(() => Filters.build({ field: { type: 'unknown', value: 'some' } }), {
					name: 'SolrError',
					code: SolrError.codes.INVALID_FILTER_TYPE
				});
			});
		});
	});
});
