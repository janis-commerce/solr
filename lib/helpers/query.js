'use strict';

const Filters = require('./filters');


class Query {

	static build(params) {

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

	static _getSorting(order) {

		return Object.entries(order).reduce((sortings, [field, term]) => {

			const sort = `${field} ${term}`;

			return sortings ? `${sortings}, ${sort}` : sort;

		}, '');
	}
}

module.exports = Query;
