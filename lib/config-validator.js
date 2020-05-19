'use strict';

const { struct } = require('superstruct');

const SolrError = require('./solr-error');

const configStruct = struct.partial({
	url: 'string',
	core: 'string',
	user: 'string?',
	password: 'string?',
	readTimeout: 'number?',
	writeTimeout: 'number?',
	commitUpdates: 'boolean?',
	commitWithin: 'number?'
}, {
	readTimeout: 2000,
	writeTimeout: 5000,
	commitUpdates: false,
	commitWithin: 10
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

			const validConfig = configStruct(config);

			if(validConfig.user && !validConfig.password)
				throw new Error(`Password required for user '${validConfig.user}'`);

			validConfig.commitWithin *= 1000;

			return validConfig;

		} catch(err) {
			err.message = `Error validating connection config: ${err.message}`;
			throw new SolrError(err, SolrError.codes.INVALID_CONFIG);
		}
	}
}

module.exports = ConfigValidator;
