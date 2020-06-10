'use strict';

const { isObject } = require('./utils');

const IGNORED_FIELDS = [
	'_nest_path_',
	'_version_',
	'_root_',
	'_text_',
	'id'
];

const FIELD_TYPES = {
	string: 'string',
	boolean: 'boolean',
	date: 'pdate',
	number: 'pint',
	float: 'pfloat',
	double: 'pdouble',
	long: 'plong',
	text: 'text_general'
};

class Schema {

	/**
	 * Builds a schema query for Solr
	 * @param {String} method The method to use for building the schema api query
	 * @param {Object} schemas The model schemas
	 */
	static query(schema, currentSchemas) {

		const builtSchema = this._buildSchema(schema);

		const fieldsToAdd = this._difference(builtSchema, currentSchemas);

		const fieldsToReplace = this._difference(builtSchema, fieldsToAdd);

		const fieldsToDelete = this._difference(currentSchemas, builtSchema).map(({ name }) => ({ name }));

		return {
			'add-field': fieldsToAdd,
			'replace-field': fieldsToReplace,
			'delete-field': fieldsToDelete
		};
	}

	/**
	 * Format the fields schema from Solr by removing the ignored fields
	 * @param {Array.<object>} schema Fields schema from Solr
	 * @returns {Array.<object>} formatted schema
	 */
	static format(schema) {
		return schema.filter(({ name }) => !IGNORED_FIELDS.includes(name));
	}

	static _buildSchema(schemas) {

		return Object.entries(schemas).reduce((fields, [field, schema]) => {

			fields.push(...this._buildField(field, schema));

			return fields;

		}, []);
	}

	static _buildField(field, schema) {

		const { type } = schema;

		if(Array.isArray(type))
			return this._buildArrayField(field, type);

		if(isObject(type))
			return this._buildObjectField(field, type);

		return [{
			name: field,
			type: this._getType(type),
			multiValued: false
		}];
	}

	static _buildArrayField(field, fieldType) {

		const [type] = fieldType;

		return [{
			name: field,
			type: this._getType(type),
			multiValued: true
		}];
	}

	static _buildObjectField(field, type) {

		return Object.entries(type).reduce((schemas, [property, schema]) => {

			schemas.push(...this._buildField(`${field}.${property}`, { type: schema }));

			return schemas;

		}, []);
	}

	static _getType(type) {
		return FIELD_TYPES[type] || FIELD_TYPES.string;
	}

	static _difference(schemaA, schemaB) {
		return schemaA.filter(fieldA => !schemaB.some(({ name }) => fieldA.name === name));
	}
}

module.exports = Schema;
