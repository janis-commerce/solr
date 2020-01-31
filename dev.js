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
			another: { type: 'number' },
			somearr: { type: ['string'] },
			otherarr: { type: ['number'] },
			someobj: {
				type: {
					prop: 'string',
					otherprop: 'number',
					anotherprop: ['date'],
					superprop: {
						magicprop: ['string']
					},
					damnprop: {
						damneditem: 'string',
						otherdamneditem: ['number'],
						superdamndeditem: {
							ultradamneditem: 'date'
						}
					}
				}
			}
		};
	}
}

const model = new Model();

const Filters = require('./lib/helpers/filters');

const Schemas = require('./lib/helpers/schema');

const ResponseFormatter = require('./lib/helpers/res-formatter');

console.log(
	JSON.stringify(
		ResponseFormatter.format([
			{
				some: 'field',
				'jsonfield.prop': 'value',
				'jsonfield.subprop.prop': 'othervalue',
				'jsonfield.subprop.otherprop': 14,
				id: '51d1ba30-8596-46e8-b4ae-b83190dd6ac5',
				_version_: 1657249623905927168
			}
		]), null, 2
	)
);

/* (async () => {

	console.log(Filters.build({
		field: { type: 'equal', value: 'sarasa' },
		otherField: { type: 'notEqual', value: 'sarasa' },
		anotherField: { type: 'greater', value: 5200 },
		loquesea: { type: 'greaterOrEqual', value: 54 },
		miau: { type: 'lesser', value: 65 },
		guau: { type: 'lesserOrEqual', value: 32 }
	}));


})(); */
