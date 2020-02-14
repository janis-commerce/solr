'use strict';

/**
 * Validates if the received object is an JSON object and not an array
 * @param {Object} object The object to validate
 */
const isObject = object => (object !== null && typeof object === 'object' && !Array.isArray(object));

/**
 * Encodes the received value into a base64 string
 * @param {String} value value
 */
const base64 = value => (Buffer.from(value).toString('base64'));

module.exports = {
	isObject,
	base64
};
