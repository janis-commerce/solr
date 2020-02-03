'use strict';

const Filters = require('./filters');

const SolrError = require('../solr-error');

const DEFAULT_LIMIT = 500;

class Query {

	static build(params = {}) {

		const limit = params.limit || DEFAULT_LIMIT;

		const filters = params.filters ? { filter: Filters.build(params.filters) } : {};

		const order = params.order ? this._getSorting(params.order) : {};

		const page = params.page ? { offset: (params.page * limit) - limit } : {};

		return {
			query: '*:*',
			limit,
			...filters,
			...order,
			...page
		};
	}

	static _getSorting(order) {

		return {
			sort: Object.entries(order).reduce((sortings, [field, term]) => {

				const sort = `${field} ${term}`;

				return sortings ? `${sortings} AND ${sort}` : sort;

			}, '')
		};
	}
}

module.exports = Query;
