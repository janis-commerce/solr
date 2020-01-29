'use strict';

const Solr = require('./lib/solr');

const solr = new Solr({
	url: 'http://localhost:8983'
});

class Model {
	static get table() {
		return 'dev';
	}
}

const model = new Model();

(async () => {

	console.log(await solr.multiInsert(model, [
		{
			some: 'thing'
		}
	]));

	console.log(await solr.get(model));

})();
