'use strict';

const path = require('path');

const ENDPOINT_BASE = '{{url}}/solr';

class Endpoint {

	static get presets() {

		return {
			get: '{{core}}/query',
			update: '{{core}}/update/json/docs?commit={{commitUpdates}}&commitWithin={{commitWithin}}',
			updateCommands: '{{core}}/update?commit={{commitUpdates}}&commitWithin={{commitWithin}}',
			createCore: 'admin/cores?action=CREATE&name={{core}}&configSet=_default',
			coreExists: 'admin/cores?action=STATUS&core={{core}}',
			ping: '{{core}}/admin/ping',
			schema: '{{core}}/schema',
			schemaFields: '{{core}}/schema/fields',
			admin: '{{core}}/admin'
		};
	}

	/**
	 * Creates a Solr endpoint
	 * @param {String} endpoint The endpoint to create
	 * @param {String} url The solr url
	 * @param {String} core The solr core name
	 * @param {Object} replacements The replacements to apply to the endpoint
	 */
	static create(endpoint, url, core, replacements) {
		return this._buildEndpoint(path.join(ENDPOINT_BASE, endpoint), { url, core, ...replacements });
	}

	static _buildEndpoint(url, replacements) {
		return Object.entries(replacements).reduce((endpoint, [key, value]) => endpoint.replace(`{{${key}}}`, value), url);
	}
}

module.exports = Endpoint;
