'use strict';

const assert = require('assert');

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

const Schemas = require('./lib/helpers/schema');

const expectedSchema = {

	'add-field': [

		{ name: 'some', type: 'string' },
		{ name: 'other', type: 'string' },
		{ name: 'another', type: 'pint' },
		{ name: 'somearr', type: 'string', multiValues: true },
		{ name: 'otherarr', type: 'pint', multiValues: true },
		{ name: 'someobj.prop', type: 'string' },
		{ name: 'someobj.otherprop', type: 'pint' },
		{ name: 'someobj.anotherprop', type: 'pdate', multiValues: true },
		{
			name: 'someobj.superprop.magicprop',
			type: 'string',
			multiValues: true
		},
		{ name: 'someobj.damnprop.damneditem', type: 'string' },
		{
			name: 'someobj.damnprop.otherdamneditem',
			type: 'pint',
			multiValues: true
		},
		{
			name: 'someobj.damnprop.superdamndeditem.ultradamneditem',
			type: 'pdate'
		}
	]
};

/* assert.deepStrictEqual(
	Schemas.buildQuery('add', model),
	expectedSchema
); */
