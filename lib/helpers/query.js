'use strict';

class Query {

	build({ limit, page, order, filters }) {

		const query = {};

		filters = this._buildFilters(filters);

		return query;
	}

	_buildFilters(filters) {

		const builtFilters = {
			query: '*:*'
		};


		return builtFilters;
	}
}

module.exports = Query;
