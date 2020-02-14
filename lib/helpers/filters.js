'use strict';

const { isObject } = require('./utils');

const SolrError = require('../solr-error');

const DEFAULT_FILTER_TYPE = 'equal';

class Filters {

	/**
	 * Builds the filters for Solr legibility
	 * @param {Object} filters The filters
	 * @param {Object} modelFields The model fields
	 */
	static build(filters, modelFields) {

		const filtersGroup = this._parseFilterGroup(filters, modelFields);

		const filtersByType = this._formatByType(filtersGroup);

		return Object.values(filtersByType);
	}

	static _parseFilterGroup(filterGroup, modelFields) {

		return Object.entries(filterGroup).reduce((parsedFilterGroup, [filterName, filterData]) => {

			const modelField = modelFields && filterName in modelFields ? modelFields[filterName] : {};

			const filterKey = modelField.field || filterName;

			const filterValues = this._getFilterObjects(filterData, modelField);

			parsedFilterGroup[filterKey] = filterKey in parsedFilterGroup ? [...parsedFilterGroup[filterKey], ...filterValues] : filterValues;

			return parsedFilterGroup;

		}, {});
	}

	static _getFilterObjects(filterData, modelField) {

		if(!Array.isArray(filterData))
			filterData = [filterData];

		return filterData.map(filterObject => {

			if(!isObject(filterObject))
				filterObject = { value: filterObject };

			const { value } = filterObject;

			if(isObject(value) || Array.isArray(value))
				throw new SolrError('Invalid filters: JSON/Array filters are not supported by Solr.', SolrError.codes.UNSUPPORTED_FILTER);

			const type = filterObject.type || modelField.type || DEFAULT_FILTER_TYPE;

			if(!value)
				throw new SolrError(`Invalid filters: Missing value for filter type ${type}.`, SolrError.codes.INVALID_FILTER_VALUE);

			return { type, value };
		});
	}

	static _formatByType(filtersGroup) {

		return Object.entries(filtersGroup).reduce((filtersByType, [field, filterData]) => {

			const filterByType = filterData.reduce((filters, { type, value }) => {

				const formatter = this._formatters[type];

				if(!formatter)
					throw new SolrError(`'${type}' is not a valid or supported filter type.`, SolrError.codes.INVALID_FILTER_TYPE);

				const formattedFilter = formatter(field, value);

				return filters ? `${filters} OR ${formattedFilter}` : formattedFilter;

			}, '');

			filtersByType[field] = filterByType;

			return filtersByType;

		}, {});
	}

	static get _formatters() {

		return {
			equal: this._formatEq.bind(this),
			notEqual: this._formatNe.bind(this),
			greater: this._formatGt,
			greaterOrEqual: this._formatGte,
			lesser: this._formatLt,
			lesserOrEqual: this._formatLte
		};
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
