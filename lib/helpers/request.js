'use strict';

const { promisify } = require('util');

const request = promisify(require('request'));

const { base64 } = require('./utils');

const SolrError = require('../solr-error');

class Request {

	constructor(auth, readTimeout, writeTimeout) {
		this.auth = auth;
		this.readTimeout = readTimeout;
		this.writeTimeout = writeTimeout;
	}

	/**
	 * Make an http request with method GET to the specified endpoint with the received request body and headers
	 * @param {String} endpoint the endpoint to make the request
	 * @param {Object|Array} requestBody The request body
	 * @param {Object} headers The request headers
	 * @param {Number} timeout The request timeout in miliseconds
	 * @returns {Object|Array|null} with the JSON response or null if the request ended with 4XX code
	 * @throws when the response code is 5XX
	 */
	async get(endpoint, requestBody, headers) {
		const httpRequest = this._buildHttpRequest(endpoint, requestBody, headers);
		return this._makeRequest(httpRequest, 'GET', this.readTimeout);
	}

	/**
	 * Make an http request with method POST to the specified endpoint with the received request body and headers
	 * @param {String} endpoint the endpoint to make the request
	 * @param {Object|Array} requestBody The request body
	 * @param {Object} headers The request headers
	 * @param {Number} timeout The request timeout in miliseconds
	 * @returns {Object|Array|null} with the JSON response or null if the request ended with 4XX code
	 * @throws when the response code is 5XX
	 */
	async post(endpoint, requestBody, headers) {
		const httpRequest = this._buildHttpRequest(endpoint, requestBody, headers);
		return this._makeRequest(httpRequest, 'POST', this.writeTimeout);
	}

	_buildHttpRequest(endpoint, body, headers) {

		let credentials;

		if(this.auth && this.auth.user && this.auth.password)
			credentials = `Basic ${base64(`${this.auth.user}:${this.auth.password}`)}`;

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

	async _makeRequest(httpRequest, method, timeout) {

		let response;

		try {

			response = await request({ ...httpRequest, method, timeout });

		} catch(err) {
			this._handleError(err);
		}

		const { statusCode, statusMessage, body } = response;

		if(statusCode >= 400)
			throw new SolrError(`[${statusCode}] (${statusMessage}): ${body}`, SolrError.codes.REQUEST_FAILED);

		return JSON.parse(body);
	}

	_handleError(err) {

		if(this._isTimeoutError(err))
			throw new SolrError(err, SolrError.codes.REQUEST_TIMEOUT);

		throw new SolrError(err, SolrError.codes.REQUEST_FAILED);
	}

	_isTimeoutError(err) {
		return /TIMEDOUT/g.test(err.code);
	}
}

module.exports = Request;
