'use strict';

const GET_ENDPOINT_BASE = '{{host}}/solr/{{core}}/query';
const UPDATE_ENDPOINT_BASE = '{{host}}/solr/{{core}}/update?commit=true';

class Endpoint {

	static get(host, core) {
		return this._buildEndpoint(GET_ENDPOINT_BASE, { host, core });
	}

	static update(host, core) {
		return this._buildEndpoint(UPDATE_ENDPOINT_BASE, { host, core });
	}

	static _buildEndpoint(url, replacements) {
		return Object.entries(replacements).reduce((endpoint, [key, value]) => endpoint.replace(`{{${key}}}`, value), url);
	}
}

module.exports = Endpoint;
