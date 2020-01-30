'use strict';

const SolrError = require('../solr-error');

class Filters {

	static build(filters) {

		const builtFilters = {
			query: '*:*',
			...this._formatByType(filters)
		};

		return builtFilters;
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

		return Object.entries(filters).reduce((filtersByType, [field, filter]) => {

			const type = filter.type || 'equal';

			const formatter = types[type];

			if(!formatter)
				throw new SolrError(`'${type}' is not a valid or supported filter type.`, SolrError.codes.INVALID_FILTER_TYPE);

			if(!filtersByType[field])
				filtersByType[field] = {};

			filtersByType[field] = formatter(field, filter);

			return filtersByType;

		}, {});
	}

	static _formatEq(field, { value }) {
		return `${field}:${value}`;
	}

	static _formatNe(field, { value }) {
		return `-${field}:${value}`;
	}

	static _formatGt(field, { value }) {
		return `${field}:{${value} TO *}`;
	}

	static _formatGte(field, { value }) {
		return `${field}:[${value} TO *]`;
	}

	static _formatLt(field, { value }) {
		return `${field}:{* TO ${value}}`;
	}

	static _formatLte(field, { value }) {
		return `${field}:[* TO ${value}]`;
	}
}

module.exports = Filters;
