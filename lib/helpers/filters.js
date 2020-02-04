'use strict';

const SolrError = require('../solr-error');

class Filters {

	static build(filters) {
		const filtersByType = this._formatByType(filters);
		return Object.values(filtersByType);
	}

	static _formatByType(filters) {

		const types = {
			equal: this._formatEq,
			notEqual: this._formatNe,
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

	static _formatEq(field, value) {
		return `${field}:"${value}"`;
	}

	static _formatNe(field, value) {
		return `-${field}:"${value}"`;
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
