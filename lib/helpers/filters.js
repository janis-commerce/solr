'use strict';

const { isObject } = require('./utils');

const SolrError = require('../solr-error');

const DEFAULT_FILTER_TYPE = 'equal';

class Filters {

	static get formatters() {

		return {
			equal: this.formatEq.bind(this),
			notEqual: this.formatNe.bind(this),
			search: this.formatSearch.bind(this),
			greater: this.formatGt,
			greaterOrEqual: this.formatGte,
			lesser: this.formatLt,
			lesserOrEqual: this.formatLte
		};
	}

	/**
	 * Builds the filters for Solr legibility
	 * @param {Object} filters The filters
	 * @param {Object} modelFields The model fields
	 */
	static build(filters, modelFields) {

		const filtersGroup = this.parseFilterGroup(filters, modelFields);

		return this.formatByType(filtersGroup);
	}

	static parseFilterGroup(filterGroup, modelFields) {

		return Object.entries(filterGroup).reduce((parsedFilterGroup, [filterName, filterData]) => {

			const modelField = modelFields && filterName in modelFields ? modelFields[filterName] : {};

			const filterKey = modelField.field || filterName;

			const filterValues = this.getFilterObjects(filterData, modelField);

			parsedFilterGroup.push({ field: filterKey, ...filterValues });

			return parsedFilterGroup;

		}, []);
	}

	static getFilterObjects(filterData, modelField) {

		if(!isObject(filterData))
			filterData = { value: filterData };

		const { value } = filterData;

		const type = filterData.type || modelField.type || DEFAULT_FILTER_TYPE;

		if(!value)
			throw new SolrError(`Invalid filters: Missing value for filter type ${type}.`, SolrError.codes.INVALID_FILTER_VALUE);

		return { type, value };
	}

	static formatByType(filtersGroup) {

		return filtersGroup.reduce((filtersByType, { field, ...filterData }) => {

			filtersByType.push(this.getFilterByType(field, filterData));

			return filtersByType;

		}, []);
	}

	static getFilterByType(field, { type, value }) {

		const formatter = this.formatters[type];

		if(!formatter)
			throw new SolrError(`'${type}' is not a valid or supported filter type.`, SolrError.codes.INVALID_FILTER_TYPE);

		if(!Array.isArray(value))
			value = [value];

		return value.reduce((filters, filter) => {

			if(Array.isArray(filter))
				throw new SolrError('Invalid filters: Array filtering are not supported by Solr.', SolrError.codes.UNSUPPORTED_FILTER);

			const formattedFilter = isObject(filter) ? this.getFilterByType(field, filter) : formatter(field, filter);

			return filters ? `${filters} OR ${formattedFilter}` : formattedFilter;

		}, '');
	}

	static formatEq(field, value) {
		return `${field}:"${value}"`;
	}

	static formatNe(field, value) {
		return `-${field}:"${value}"`;
	}

	static formatSearch(field, value) {
		return `${field}:*${value}*`;
	}

	static formatGt(field, value) {
		return `${field}:{${value} TO *}`;
	}

	static formatGte(field, value) {
		return `${field}:[${value} TO *]`;
	}

	static formatLt(field, value) {
		return `${field}:{* TO ${value}}`;
	}

	static formatLte(field, value) {
		return `${field}:[* TO ${value}]`;
	}

}

module.exports = Filters;
