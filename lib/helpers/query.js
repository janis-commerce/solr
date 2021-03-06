'use strict';

const SolrError = require('../solr-error');

const Filters = require('./filters');

class Query {

	static get(params) {

		const { limit, page, fields } = params;

		const filters = params.filters ? { filter: Filters.build(params.filters, fields) } : {};
		const order = params.order ? { sort: this._getSorting(params.order) } : {};

		return {
			query: '*:*',
			offset: (page * limit) - limit,
			limit,
			...filters,
			...order
		};
	}

	static delete(params) {

		const { fields } = params;

		const filters = params.filters ? Filters.build(params.filters, fields) : [];

		const query = filters.reduce((stringQuery, terms) => (stringQuery ? `${stringQuery} AND ${terms}` : terms), '');

		return query ? { delete: { query } } : {};
	}

	static distinct(params) {

		const { key, fields, limit, page } = params;

		if(typeof key !== 'string')
			throw new SolrError(`Distinct key must be a string, received: ${typeof key}.`, SolrError.codes.INVALID_PARAMETERS);

		const filters = params.filters ? { filter: Filters.build(params.filters, fields) } : {};

		return {
			query: '*:*',
			fields: key,
			params: {
				group: true,
				'group.field': key,
				'group.limit': 1,
				'group.main': true,
				rows: limit,
				start: (page * limit) - limit
			},
			...filters
		};
	}

	static _getSorting(order) {

		return Object.entries(order).reduce((sortings, [field, term]) => {

			const sort = `${field} ${term}`;

			return sortings ? `${sortings}, ${sort}` : sort;

		}, '');
	}
}

module.exports = Query;
