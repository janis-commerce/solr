'use strict';

const assert = require('assert');

const { isObject } = require('./utils');

const IGNORED_FIELDS = [
	'_nest_path_',
	'_version_',
	'_root_',
	'_text_',
	'id'
];

const FIELD_DEFAULTS = {
	multiValued: false,
	indexed: true,
	stored: true
};

const FIELD_TYPES = {
	string: { type: 'string', ...FIELD_DEFAULTS },
	boolean: { type: 'boolean', ...FIELD_DEFAULTS },
	date: { type: 'pdate', ...FIELD_DEFAULTS },
	number: { type: 'pint', ...FIELD_DEFAULTS },
	float: { type: 'pfloat', ...FIELD_DEFAULTS },
	double: { type: 'pdouble', ...FIELD_DEFAULTS },
	long: { type: 'plong', ...FIELD_DEFAULTS },
	text: { type: 'text_general', ...FIELD_DEFAULTS }
};

class Schema {

	/**
	 * Builds a schema query for Solr
	 * @param {String} method The method to use for building the schema api query
	 * @param {Object} schemas The model schemas
	 * @returns {Object} Built schema query or null if there are not changes to apply
	 */
	static query(schema, currentSchemas, fieldTypes, currentFieldTypes) {

		const query = {
			...this._buildFieldTypesQuery(fieldTypes, currentFieldTypes),
			...this._buildFieldsQuery(schema, currentSchemas)
		};

		return Object.keys(query).length ? query : null;
	}

	/**
	 * Format the fields schema from Solr by removing the ignored fields
	 * @param {Array.<object>} schema Fields schema from Solr
	 * @returns {Array.<object>} formatted schema
	 */
	static format(schema) {
		return schema.filter(({ name }) => !IGNORED_FIELDS.includes(name));
	}

	static _buildFieldTypesQuery(fieldTypes, currentFieldTypes) {

		fieldTypes = this._buildFieldTypes(fieldTypes);

		currentFieldTypes = currentFieldTypes.filter(fieldType => fieldTypes.find(({ name }) => name === fieldType.name));

		const fieldTypesToAdd = this._difference(fieldTypes, currentFieldTypes);
		const fieldTypesToReplace = this._difference(fieldTypes, fieldTypesToAdd)
			.filter(fieldType => !currentFieldTypes.some(currentFieldType => this._areEqualObjects(currentFieldType, fieldType)));

		return {
			...fieldTypesToAdd.length ? { 'add-field-type': fieldTypesToAdd } : {},
			...fieldTypesToReplace.length ? { 'replace-field-type': fieldTypesToReplace } : {}
		};
	}

	static _buildFieldTypes(fieldTypes) {
		return Object.entries(fieldTypes).map(([name, properties]) => ({ name, ...properties }));
	}

	static _buildFieldsQuery(schema, currentSchemas) {

		schema = this._buildSchema(schema);

		const fieldsToAdd = this._difference(schema, currentSchemas);

		const fieldsToReplace = this._difference(schema, fieldsToAdd)
			.filter(field => !currentSchemas.some(currentField => this._areEqualObjects(currentField, field)));

		const fieldsToDelete = this._difference(currentSchemas, schema)
			.map(({ name }) => ({ name }));

		return {
			...fieldsToAdd.length ? { 'add-field': fieldsToAdd } : {},
			...fieldsToReplace.length ? { 'replace-field': fieldsToReplace } : {},
			...fieldsToDelete.length ? { 'delete-field': fieldsToDelete } : {}
		};
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
			...this._getType(type)
		}];
	}

	static _buildArrayField(field, fieldType) {

		const [type] = fieldType;

		return [{
			name: field,
			...this._getType(type),
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
		return FIELD_TYPES[type] || { type };
	}

	static _difference(schemaA, schemaB) {
		return schemaA.filter(fieldA => !schemaB.some(({ name }) => fieldA.name === name));
	}

	static _areEqualObjects(fieldA, fieldB) {

		try {

			assert.deepStrictEqual(fieldA, fieldB);
			return true;

		} catch(err) {
			return false;
		}
	}
}

module.exports = Schema;
