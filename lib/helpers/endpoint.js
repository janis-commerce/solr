'use strict';

const path = require('path');

const ENDPOINT_BASE = '{{url}}/solr';

class Endpoint {

	static get presets() {

		return {
			get: '{{core}}/query',
			update: '{{core}}/update/json/docs?commit=true',
			schema: '{{core}}/schema'
		};
	}

	static create(endpoint, url, core, replacements) {
		return this._buildEndpoint(path.join(ENDPOINT_BASE, endpoint), { url, core, ...replacements });
	}

	static _buildEndpoint(url, replacements) {
		return Object.entries(replacements).reduce((endpoint, [key, value]) => endpoint.replace(`{{${key}}}`, value), url);
	}
}

module.exports = Endpoint;
