'use strict';

const { struct } = require('superstruct');

const SolrError = require('./solr-error');

const configStruct = struct.partial({
	url: 'string'
	// core: 'string' Los cores ya no estan separados de las collections, reemplaza a el getter table del modelo
});

class ConfigValidator {

	/**
	 * Validates the received config struct
	 * @param {Object} config the config to validate
	 * @returns {Object} received config object
	 * @throws if the struct is invalid
	 */
	static validate(config) {

		try {

			return configStruct(config);

		} catch(err) {
			err.message = `Error validating connection config: ${err.message}`;
			throw new SolrError(err, SolrError.codes.INVALID_CONFIG);
		}
	}
}

module.exports = ConfigValidator;
