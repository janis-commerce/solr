'use strict';

const path = require('path');

const ENDPOINT_BASE = '{{url}}/solr/{{core}}';

class Endpoint {

	static get presets() {

		return {
			get: 'query',
			update: 'update?commit=true',
			schemas: 'schema'
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
