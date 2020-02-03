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
			text: true,
			numeric: { type: 'number' },
			array: { type: ['string'] },
			arrayOfNumbers: { type: ['number'] },
			date: { type: 'date' },
			object: {
				type: {
					property: 'string',
					otherProperty: {
						subproperty: 'number'
					}
				}
			}
		};
	}
}

const model = new Model();

(async () => {

	// console.log(await solr.updateSchemas(model));

	console.log(await solr.insert(model, {
		text: 'sarasa',
		numeric: 22,
		array: ['sarasa'],
		arrayOfNumbers: [1, 2, 3],
		date: new Date()
		/* object: {
			property: 'foobar',
			otherProperty: {
				subproperty: 17
			}
		} */
	}));

	console.log(
		await solr.get(model, {

		})
	);

})();
