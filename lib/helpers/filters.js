'use strict';

const SolrError = require('../solr-error');

class Filters {

	static build(filters) {
		const filtersByType = this._formatByType(filters);
		return Object.values(filtersByType);
	}

	static _formatByType(filters) {

		const types = {
			equal: this._formatEq.bind(this),
			notEqual: this._formatNe.bind(this),
			greater: this._formatGt,
			greaterOrEqual: this._formatGte,
			lesser: this._formatLt,
			lesserOrEqual: this._formatLte
		};

		return Object.entries(filters).reduce((filtersByType, [field, fieldFilters]) => {

			if(!Array.isArray(fieldFilters))
				fieldFilters = [fieldFilters];

			const builtFilter = fieldFilters.reduce((filter, terms) => {

				let { type, value } = terms;

				if(!type && !value)
					value = terms;

				if(!type)
					type = 'equal';

				if(!value)
					throw new SolrError(`Invalid filters for field '${field}': Missing value for filter type ${type}.`, SolrError.codes.INVALID_FILTER_VALUE);

				const formatter = types[type];

				if(!formatter)
					throw new SolrError(`'${type}' is not a valid or supported filter type.`, SolrError.codes.INVALID_FILTER_TYPE);

				const formattedFilter = formatter(field, value);

				return filter ? `${filter} OR ${formattedFilter}` : formattedFilter;

			}, '');

			if(!filtersByType[field])
				filtersByType[field] = {};

			filtersByType[field] = builtFilter;

			return filtersByType;

		}, {});
	}

	static _prepareValue(value) {

		if(Array.isArray(value))
			return `(${value.reduce((formattedValue, item) => (formattedValue ? `${formattedValue} AND "${item}"` : `"${item}"`), '')})`;

		return `"${value}"`;
	}

	static _formatEq(field, value) {

		value = this._prepareValue(value);
		return `${field}:${value}`;
	}

	static _formatNe(field, value) {

		value = this._prepareValue(value);
		return `-${field}:${value}`;
	}

	static _formatGt(field, value) {
		return `${field}:{${value} TO *}`;
	}

	static _formatGte(field, value) {
		return `${field}:[${value} TO *]`;
	}

	static _formatLt(field, value) {
		return `${field}:{* TO ${value}}`;
	}

	static _formatLte(field, value) {
		return `${field}:[* TO ${value}]`;
	}
}

module.exports = Filters;
