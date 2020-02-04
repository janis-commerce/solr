'use strict';

const Solr = require('./lib/solr');

const solr = new Solr({
	url: 'http://localhost:8983'
});

class Model {

	static get table() {
		return 'dev';
	}

	static get fields() {
		return {
			string: true,
			number: { type: 'number' },
			bool: { type: 'boolean' },
			float: { type: 'float' },
			stringArray: { type: ['string'] },
			numberArray: { type: ['number'] },
			object: {
				type: {
					string: 'string',
					number: 'number',
					bool: 'boolean',
					float: 'float',
					object: {
						boolArray: ['boolean']
					}
				}
			}
		};
	}
}

const model = new Model();

(async () => {

	// createSchemas
	// console.log(await solr.createSchemas(model));

	// updateSchemas
	// console.log(await solr.updateSchemas(model));

	// insert
	/* console.log(await solr.insert(model, {
		string: 'some string',
		number: 32,
		bool: true,
		float: 1.32,
		stringArray: ['a', 'b', 'c'],
		numberArray: [1, 2, 3],
		object: {
			string: 'other string',
			number: 77,
			bool: false,
			float: 2.32,
			object: {
				boolArray: [true, false, false, true]
			}
		}
	})); */

	// multiInsert
	/* console.log(await solr.multiInsert(model, [
		{
			string: 'other string',
			number: 64,
			bool: false,
			float: 2.64,
			stringArray: ['e', 'f', 'g'],
			numberArray: [2, 4, 6],
			object: {
				string: 'another string',
				number: 32,
				bool: true,
				float: 4.64,
				object: {
					boolArray: [false, true, true, false]
				}
			}
		},
		{
			string: 'another string',
			number: 16,
			bool: false,
			float: 0.16,
			stringArray: ['h', 'i', 'j'],
			numberArray: [3, 6, 9],
			object: {
				string: 'super string',
				number: 55,
				bool: true,
				float: 1.16,
				object: {
					boolArray: [true, true, false, false]
				}
			}
		}
	])); */

	// get
	console.log(await solr.get(model, {
		filters: {
			stringArray: { type: 'equal', value: ['a', 'b', 'c'] }
			// string: { type: 'equal', value: 'another string' }
		}
	}));

	// getTotals
	console.log(await solr.getTotals(model));
})();
