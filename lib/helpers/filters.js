'use strict';

const { isObject } = require('./utils');

const SolrError = require('../solr-error');

const DEFAULT_FILTER_TYPE = 'equal';

class Filters {

	static get formatters() {

		return {
			equal: this._formatEq.bind(this),
			notEqual: this._formatNe.bind(this),
			greater: this._formatGt,
			greaterOrEqual: this._formatGte,
			lesser: this._formatLt,
			lesserOrEqual: this._formatLte
		};
	}

	/**
	 * Builds the filters for Solr legibility
	 * @param {Object} filters The filters
	 * @param {Object} modelFields The model fields
	 */
	static build(filters, modelFields) {

		const filtersGroup = this._parseFilterGroup(filters, modelFields);

		return this._formatByType(filtersGroup);
	}

	static _parseFilterGroup(filterGroup, modelFields) {

		return Object.entries(filterGroup).reduce((parsedFilterGroup, [filterName, filterData]) => {

			const modelField = modelFields && filterName in modelFields ? modelFields[filterName] : {};

			const filterKey = modelField.field || filterName;

			const filterValues = this._getFilterObjects(filterData, modelField);

			parsedFilterGroup.push({ field: filterKey, ...filterValues });

			return parsedFilterGroup;

		}, []);
	}

	static _getFilterObjects(filterData, modelField) {

		if(!isObject(filterData))
			filterData = { value: filterData };

		const { value } = filterData;

		const type = filterData.type || modelField.type || DEFAULT_FILTER_TYPE;

		if(!value)
			throw new SolrError(`Invalid filters: Missing value for filter type ${type}.`, SolrError.codes.INVALID_FILTER_VALUE);

		return { type, value };
	}

	static _formatByType(filtersGroup) {

		return filtersGroup.reduce((filtersByType, { field, ...filterData }) => {

			filtersByType.push(this._getFilterByType(field, filterData));

			return filtersByType;

		}, []);
	}

	static _getFilterByType(field, { type, value }) {

		const formatter = this.formatters[type];

		if(!formatter)
			throw new SolrError(`'${type}' is not a valid or supported filter type.`, SolrError.codes.INVALID_FILTER_TYPE);

		if(!Array.isArray(value))
			value = [value];

		return value.reduce((filters, filter) => {

			if(Array.isArray(filter))
				throw new SolrError('Invalid filters: Array filtering are not supported by Solr.', SolrError.codes.UNSUPPORTED_FILTER);

			const formattedFilter = isObject(filter) ? this._getFilterByType(field, filter) : formatter(field, filter);

			return filters ? `${filters} OR ${formattedFilter}` : formattedFilter;

		}, '');
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
