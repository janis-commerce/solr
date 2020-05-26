'use strict';

const assert = require('assert');
const nock = require('nock');

const SolrError = require('../../lib/solr-error');

const Request = require('../../lib/helpers/request');

describe('Helpers', () => {

	describe('Request', () => {

		let requestInstance;

		beforeEach(() => {
			requestInstance = new Request(null, 2000, 2000);
		});

		afterEach(() => {
			nock.cleanAll();
		});

		const host = 'http://some-host.com';

		const endpoint = '/some/endpoint';

		const url = `${host}${endpoint}`;

		describe('get()', () => {

			it('Should throw when the request timeout is reached', async () => {

				const request = nock(host)
					.get(endpoint)
					.delay(5000)
					.reply(200);

				await assert.rejects(requestInstance.get(url), {
					name: 'SolrError',
					code: SolrError.codes.REQUEST_TIMEOUT
				});

				request.done();
			});

			it('Should throw when the request fails', async () => {

				nock.disableNetConnect();

				await assert.rejects(requestInstance.get(url), {
					name: 'SolrError',
					code: SolrError.codes.REQUEST_FAILED
				});
			});
		});

		describe('post()', () => {

			it('Should throw when the request timeout is reached', async () => {

				const request = nock(host)
					.post(endpoint)
					.delay(5000)
					.reply(200);

				await assert.rejects(requestInstance.post(url), {
					name: 'SolrError',
					code: SolrError.codes.REQUEST_TIMEOUT
				});

				request.done();
			});

			it('Should throw when the request fails', async () => {

				nock.disableNetConnect();

				await assert.rejects(requestInstance.post(url), {
					name: 'SolrError',
					code: SolrError.codes.REQUEST_FAILED
				});
			});
		});
	});
});
