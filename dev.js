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
			some: true,
			other: { type: 'string' },
			another: { type: 'number' }
		};
	}
}

const model = new Model();

const Filters = require('./lib/helpers/filters');

(async () => {

	console.log(Filters.build({
		field: { type: 'equal', value: 'sarasa' },
		otherField: { type: 'notEqual', value: 'sarasa' },
		anotherField: { type: 'greater', value: 5200 },
		loquesea: { type: 'greaterOrEqual', value: 54 },
		miau: { type: 'lesser', value: 65 },
		guau: { type: 'lesserOrEqual', value: 32 }
	}));

	// console.log(await solr.get(model));

	// .log(await solr.updateSchemas(model));

	/* console.log(await solr.multiInsert(model, [
		{
			some: 'thing'
		}
	]));

	console.log(await solr.get(model)); */

})();
