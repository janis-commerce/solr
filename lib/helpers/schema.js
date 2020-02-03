'use strict';

const FIELD_TYPES = {
	string: 'string',
	boolean: 'boolean',
	date: 'pdate',
	number: 'pint',
	float: 'pfloat',
	double: 'pdouble',
	long: 'plong'
};

const DEFAULT_FIELDS = {
	dateCreated: { type: 'date' },
	dateModified: { type: 'date' },
	userCreated: { type: 'string' },
	userModified: { type: 'string' },
	status: { type: 'string' }
};

class Schema {

	static buildQuery(method, model) {

		const fields = { ...DEFAULT_FIELDS, ...model.constructor.fields };

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

		if(this._isObject(type))
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

	static _isObject(object) {
		return object !== null && typeof object === 'object' && !Array.isArray(object);
	}
}

module.exports = Schema;
