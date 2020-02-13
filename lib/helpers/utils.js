'use strict';

function isObject(object) {
	return object !== null && typeof object === 'object' && !Array.isArray(object);
}

function base64(value) {
	return Buffer.from(value).toString('base64');
}

module.exports = {
	isObject,
	base64
};
