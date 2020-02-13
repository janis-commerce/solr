'use strict';

const { promisify } = require('util');

const request = promisify(require('request'));

const { base64 } = require('./utils');

const SolrError = require('../solr-error');

class Request {

	/**
	 * Make an http request with method GET to the specified endpoint with the received request body and headers
	 * @param {String} endpoint the endpoint to make the request
	 * @param {Object|Array} requestBody The request body
	 * @param {Object} headers The request headers
	 * @returns {Object|Array|null} with the JSON response or null if the request ended with 4XX code
	 * @throws when the response code is 5XX
	 */
	static async get(endpoint, requestBody, auth, headers) {
		const httpRequest = this._buildHttpRequest(endpoint, requestBody, auth, headers);
		return this._makeRequest(httpRequest, 'GET');
	}

	/**
	 * Make an http request with method POST to the specified endpoint with the received request body and headers
	 * @param {String} endpoint the endpoint to make the request
	 * @param {Object|Array} requestBody The request body
	 * @param {Object} headers The request headers
	 * @returns {Object|Array|null} with the JSON response or null if the request ended with 4XX code
	 * @throws when the response code is 5XX
	 */
	static async post(endpoint, requestBody, auth, headers) {
		const httpRequest = this._buildHttpRequest(endpoint, requestBody, auth, headers);
		return this._makeRequest(httpRequest, 'POST');
	}

	static _buildHttpRequest(endpoint, body, auth, headers) {

		let credentials;

		if(auth.user && auth.password)
			credentials = `Basic ${base64(`${auth.user}:${auth.password}`)}`;

		const httpRequest = {
			url: endpoint,
			headers: {
				...headers,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(body)
		};

		if(credentials)
			httpRequest.headers.Authorization = credentials;

		return httpRequest;
	}

	static async _makeRequest(httpRequest, method) {

		const { statusCode, statusMessage, body } = await request({ ...httpRequest, method });

		if(statusCode >= 400)
			throw new SolrError(`[${statusCode}] (${statusMessage}): ${body}`, SolrError.codes.REQUEST_FAILED);

		return JSON.parse(body);
	}
}

module.exports = Request;
