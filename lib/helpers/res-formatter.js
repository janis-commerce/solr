'use strict';

const merge = require('lodash.merge');

const IGNORED_FIELDS = ['_version_'];

class ResponseFormatter {

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

module.exports = ResponseFormatter;
