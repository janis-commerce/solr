'use strict';

const merge = require('lodash.merge');

const { inspect } = require('util');

const { superstruct } = require('superstruct');

const { isObject } = require('./utils');

const SolrError = require('../solr-error');

const IGNORED_FIELDS = ['_version_'];

const struct = superstruct({
	types: {
		equalToZero: value => value === 0
	}
});

class Response {

	static format(response) {

		return response.map(item => {

			// Remove solr ignored fields
			IGNORED_FIELDS.forEach(ignoredField => delete item[ignoredField]);

			return Object.entries(item).reduce((formattedItem, [field, value]) => {

				if(!field.includes('.'))
					return { ...formattedItem, [field]: value };

				return merge(formattedItem, this._buildJsonField(field, value));

			}, {});
		});
	}

	static formatFacetFields(facetFields) {

		const [[field, counts]] = Object.entries(facetFields);

		const formattedFields = [];

		for(let index = 0; index < counts.length; index += 2) {

			const value = counts[index];
			const count = counts[index + 1];

			formattedFields.push({ field, value, count });
		}

		return formattedFields;
	}

	static formatFacetPivot(facetPivot) {
		return Object.values(facetPivot).flat();
	}

	static formatGroup(grouped) {

		return Object.entries(grouped).reduce((formattedGroups, [field, { matches, groups }]) => {

			formattedGroups[field] = { count: matches, groups: {} };

			groups.forEach(({ groupValue, doclist }) => {
				formattedGroups[field].groups[groupValue] = { count: doclist.numFound, items: this.format(doclist.docs) };
			});

			return formattedGroups;

		}, {});
	}

	static validate(res, terms = {}) {

		const responseStruct = struct.partial(

			this._buildNestedStruct({
				responseHeader: { status: 'equalToZero' },
				...terms
			})
		);

		try {

			responseStruct(res);
			return true;

		} catch(err) {
			throw new SolrError(`Invalid Solr response: ${err.message} ${inspect(res)}`, SolrError.codes.INTERNAL_SOLR_ERROR);
		}
	}

	static _buildNestedStruct(terms) {

		return Object.entries(terms).reduce((structs, [field, term]) => {

			if(!isObject(term))
				return { ...structs, [field]: term };

			return { ...structs, [field]: struct.partial(this._buildNestedStruct(term)) };

		}, {});
	}

	static _buildJsonField(field, value) {

		const fields = field.split('.');

		const [rootField] = fields;

		// Need to reverse the properties array to iterate first by the property that will have the item value
		const properties = fields.splice(1).reverse();

		return properties.reduce((item, property, i) => {

			if(i === 0)
				item[rootField][property] = value;
			else
				item[rootField] = { [property]: item[rootField] };

			return item;

		}, { [rootField]: {} });
	}
}

module.exports = Response;
