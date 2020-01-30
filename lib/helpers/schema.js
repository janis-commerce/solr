'use strict';

const FIELD_TYPES = {
	string: 'string',
	boolean: 'boolean',
	date: 'pdate',
	number: 'pint',
	float: 'pfloat',
	double: 'pdouble',
	long: 'plong'
};

const DEFAULT_FIELDS = {
	dateCreated: { type: 'date' },
	dateModified: { type: 'date' },
	userCreated: { type: 'string' },
	userModified: { type: 'string' },
	status: { type: 'string' }
};

class Schema {

	static buildQuery(method, model) {

		const { fields } = model.constructor;

		if(!fields)
			return;

		const query = Object.entries(fields).reduce((schemas, [field, params]) => {

			const fieldType = params.type || 'string';

			schemas[field] = {
				name: field,
				type: FIELD_TYPES[fieldType]
			};

			return schemas;

		}, DEFAULT_FIELDS);

		return {
			[`${method}-field`]: Object.values(query)
		};
	}
}

module.exports = Schema;
