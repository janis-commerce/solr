# Solr

[![Build Status](https://travis-ci.org/janis-commerce/solr.svg?branch=master)](https://travis-ci.org/janis-commerce/solr)
[![Coverage Status](https://coveralls.io/repos/github/janis-commerce/solr/badge.svg?branch=master)](https://coveralls.io/github/janis-commerce/solr?branch=master)

Apache Solr Driver

## Installation
```sh
npm install @janiscommerce/solr
```

## Models
Whenever the `Model` type is mentioned in this document, it refers to an instance of [@janiscommerce/model](https://www.npmjs.com/package/@janiscommerce/model).

This is used to configure which collection should be used, which unique indexes it has, among other stuff.

## API

### `new Solr(config)`
Constructs the Solr driver instance, connected with the `config` object.

**Config properties**

- url `String` (required): Solr URL

**Config usage**
```js
{
	url: 'http://localhost:8983'
}
```

### ***async*** `insert(model, item)`
Inserts one document in a solr core

- model: `Model`: A model instance
- item: `Object`: The item to save in the solr core

- Resolves `String`: The *ID* of the inserted item
- Rejects: `SolrError` When something bad occurs

### ***async*** `multiInsert(model, items)`
Inserts multiple documents in a solr core

- model: `Model`: A model instance
- item: `Array<Object>`: The items to save in the solr core

- Resolves: `Array<Object>`: Items inserted
- Rejects: `SolrError` When something bad occurs

### ***async*** `get(model, [parameters])`
Searches documents in a solr core

- model `Model`: A model instance
- parameters: `Object` (optional): The query parameters. Default: `{}`

- Resolves: `Array<Object>`: An array of documents
- Rejects: `SolrError` When something bad occurs

**Available parameters (all of them are optional)**

- order `Object`: Sets the sorting criteria of the matched documents, for example: `{ myField: 'asc', myOtherField: 'desc' }`
- limit `Number`: Sets the page size when fetching documents. Default: `500`
- page `Number`: Sets the current page to retrieve.
- filters `Object`: Sets the criteria to match documents.

Parameters example:
```js
{
	limit: 1000, // Default 500
	page: 2,
	order: {
		itemField: 'asc'
	},
	filters: {
		itemField: 'foobar',
		otherItemField: {
			type: 'notEqual',
			value: 'foobar'
		},
		anotherItemField: ['foo', 'bar']
	}
}
```

#### Filters

The filters have a simpler structure what raw solr filters, in order to simplify it's usage.

**Single valued filters**

These filters sets a criteria using the specified `type` and `value`:
```js
{
	filters: {
		myField: {type: 'notEqual', value: 'foobar'}
	}
}
```

**Multivalued filters**

These filters are an array of multiple filters that sets the criterias using an *OR* operation with the specified `type` and `value`
```js
{
	filters: {
		myField: ['foobar', { type: 'notEqual', value: 'barfoo' }]
	}
}
```

**Filter types**

The filter types can be defined in the model static getter `fields` like this:
```js
class MyModel extends Model {
	
	static get fields(){

		return {
			myField: {
				type: 'greaterOrEqual'
			}
		}
	}
}
```

It can also be overriden in each query like this:
```js
solr.get(myModel, {
	filters: {
		myField: {
			type: 'lesserOrEqual',
			value: 10
		}
	}
})
```

The following table shows all the supported filter types:

| Type           | Solr equivalence   |
| -------------- | ------------------ |
| equal          | field:"value"      |
| notEqual       | -field:"value"     |
| greater        | field:{value TO *} |
| greaterOrEqual | field:[value TO *] |
| lesser         | field:{* TO value} |
| lesserOrEqual  | field:[* TO value] |

If the type isn't defined in the model or in the query, it defaults to `equal`.

**Internal field names**

The name of a filter and the field that it will match can differ. To archieve that, you must declare it in the model static getter `fields`:

```js
class MyModel extends Model {

	static get fields() {

		return {
			externalFieldName: {
				field: 'internalFieldName'
			}
		}
	}
}
```

#### Nested filters
If you want to filter by fields inside objects, you can use nested filters. For example:
```js

```

## Usage
```js
const Solr = require('@janiscommerce/solr');

```

## Examples
