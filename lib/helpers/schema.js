'use strict';

const { isObject } = require('./utils');

const FIELD_TYPES = {
	string: 'string',
	boolean: 'boolean',
	date: 'pdate',
	number: 'pint',
	float: 'pfloat',
	double: 'pdouble',
	long: 'plong'
};

class Schema {

	static buildQuery(method, model) {

		const { fields } = model.constructor;

		const builtSchemas = Object.entries(fields).reduce((schemas, [field, schema]) => {

			schemas.push(...this._buildSchema(field, schema));

			return schemas;

		}, []);

		return { [`${method}-field`]: builtSchemas };
	}

	static _buildSchema(field, schema) {

		const { type } = schema;

		if(Array.isArray(type))
			return this._buildArraySchema(field, type);

		if(isObject(type))
			return this._buildObjectSchema(field, type);

		return [{
			name: field,
			type: this._getType(type)
		}];
	}

	static _buildArraySchema(field, fieldType) {

		const [type] = fieldType;

		return [{
			name: field,
			type: this._getType(type),
			multiValued: true
		}];
	}

	static _buildObjectSchema(field, type) {

		return Object.entries(type).reduce((schemas, [property, schema]) => {

			schemas.push(...this._buildSchema(`${field}.${property}`, { type: schema }));

			return schemas;

		}, []);
	}

	static _getType(type) {
		return FIELD_TYPES[type] || FIELD_TYPES.string;
	}
}

module.exports = Schema;
