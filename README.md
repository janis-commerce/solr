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
- core `String` (required): Solr Core
- user `String` (optional): Auth user
- password `String` (optional but required if an user is specified): Auth password

**Config usage**
```js
{
	url: 'http://localhost:8983',
	core: 'some-core',
	user: 'some-user',
	password: 'some-password'
}
```

### ***async*** `insert(model, item)`
Inserts one document in a solr core

- model: `Model`: A model instance
- item: `Object`: The item to save in the solr core

- Resolves: `String`: The *ID* of the inserted item
- Rejects: `SolrError` When something bad occurs

### ***async*** `multiInsert(model, items)`
Inserts multiple documents in a solr core

- model: `Model`: A model instance
- item: `Array<Object>`: The items to save in the solr core

- Resolves: `Array<Object>`: Items inserted
- Rejects: `SolrError` When something bad occurs

### ***async*** `distict(model, [parameters])`
Searches distinct values of a property in a solr core

- model: `Model`: A model instance
- parameters: `Object` (optional): The query parameters. Default: {}. It only accepts `key` (the field name to get distinct values from), and `filters` -- described below in `get()` method.

- Resolves `Array<Object>`: An array of documents
- Rejects `SolrError`: When something bad occurs

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

**Unsupported filters**

Due Solr limitations, some filters are unsupported, like Array/Object filters:
```js
{
	filters: {
		myField: { type: 'equal', value: [1,2,3] },
		myOtherField: { type: 'notEqual', value: { some: 'thing' } } // Also you can use nested filters instead
	}
}
```

See [nested filters](#nested%20filters) to see how to filter by object properties and sub properties.

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
{
	/* Sample document to match
	{
		id: 'some-id',
		someField: {
			foo: 'bar'
		}
	}
	*/

	solr.get(myModel, {
		filters: {
			'someField.foo': 'bar'
		}
	});
}
```

### ***async*** `getTotals(model)`
Gets information about the quantity of documents matched by the last call to the `get()` method.

- model: `Model`: A model instance used for the query. **IMPORTANT**: This must be the same instance.

- Resolves: `Object`: An object containing the totalizers
- Rejects: `SolrError`: When something bad occurs

Return example:
```js
{
	total: 140,
	pageSize: 60,
	pages: 3,
	page: 1
}
```

If no query was executed before, it will just return the `total` and `pages` properties with a value of zero.

### ***async*** `remove(model, item)`
Removes a document in a solr core

- model: `Model`: A model instance
- item: `Object`: The item to be removed

- Rejects `SolrError`: When something bad occurs

### ***async*** `multiRemove(model, filters)`
Removes one or more documents in a solr core

- model: `Model`: A model instance
- filters: `Object`: Filters criteria to match documents

- Rejects `SolrError`: When something bad occurs

### ***async*** `createSchema(model, core)`
Build the fields schema using the schema defined in the model static getter `schema`.  

- model `Model`: A model instance
- core `String`: The core where the field schema will created. Default: `core` value from instance config.

- Rejects: `SolrError`: When something bad occurs

- **IMPORTANT**:
	- This method must be executed before any operation, otherwise Solr will set all new fields as an `array` of `strings`.
	- This method can't replace or delete already existing fields schema in Solr.

If you need details about how to define the fields schema in the model, see the schema apart [below](#schema)

### ***async*** `updateSchema(model)`
Update the fields schema by replacing the current fields schema in Solr with the defined in the model static getter `schema`.
**IMPORTANT**: This method can't create or delete already existing fields schema in Solr.

- model `Model`: A model instance

- Rejects: `SolrError`: When something bad occurs

If you need details about how to define the fields schema in the model, see the schema apart [below](#schema)

#### Fields schema

The fields schema are required by Solr to use the correct data types on every field, by default, Solr sets new fields as an `array` of `strings`, even in objects and his properties.

**Field types**

The field types can be defined in the model static getter `schema` like this:
```js
class MyModel extends Model {

	static get schema(){

		return {
			myStringField: true, // Default type string
			myNumberString: { type: 'number' },
			myArrayOfStrings: { type: ['string'] },
			myObject: {
				property: 'string'
			}
		}
	}
}
```

The following table shows all the supported field types:

| Type           | Solr equivalence |
| -------------- | ---------------- |
| string         | string           |
| boolean        | boolean          |
| date           | pdate            |
| number         | pint             |
| float          | pfloat           |
| double         | pdouble          |
| long           | plong            |

In case of an array field, the Solr equivalence will be the same for each field, only will set the `multiValued` property to `true`.

If the type isn't defined, it defaults to `string`.

**Single valued field**

These are the most common fields, only stores a single value:
```js
{
	myField: { type: 'number' },
	myOtherField: { type: 'date' }
}
```

**Multi valued fields (Array)**

These fields stores an array with multiple values **of the same type**:
```js
{
	myField: { type: ['string'] }, // Array of strings
	myOtherField: { type: ['number'] } // Array of numbers
}
```

**Objects (JSON)**

These fields stores an object with multiple properties that **can be of different types**:
```js
{
	myField: {
		type: {
			property: 'string',
			subProperty: {
				property: ['string']
			},
			otherProperty: 'date'
		}
	}
}
```

**IMPORTANT**: Due Solr compatibility issues, the object fields will be created **internally** as single fields like this:
```js
// Schema
{
	myField: {
		type: {
			property: 'string',
			otherProperty: 'number',
			subProperty: {
				property: ['float']
			}
		}
	}
}

// Formatted for Solr
{
	'myField.property': { type: 'string' },
	'myField.otherProperty': { type: 'number' },
	'myField.subProperty.property': { type: ['float'] }
}
```

It will show as a **full object** on `get` operations.

### ***async*** `createCore(model, name)`
Creates a new core in the Solr URL, then build the fields schema for that core.

- model `Model`: A model instance
- name `String`: The name for the core to create

- Rejects: `SolrError`: When something bad occurs

## Errors

The errors are informed with a `SolrError`.
This object has a code that can be useful for debugging or error handling.
The codes are the following:

| Code | Description               |
|------|-------------------------- |
| 1    | Invalid connection config |
| 2    | Invalid model             |
| 3    | Invalid filter type       |
| 4    | Invalid filter value      |
| 5    | Unsupported filter        |
| 6    | Request failed            |
| 7    | Internal Solr error       |
| 8    | Invalid parameters        |

## Usage
```js
const Solr = require('@janiscommerce/solr');

const Model = require('./myModel');

const solr = new Solr({
	url: 'localhost:8983'
});

const model = new Model();

(async () => {

	//Insert
	await solr.insert(model, {
		id: 'some-id',
		name: 'test'
	});
	// > 'some-id'

	// multiInsert
	await solr.multiInsert(model, [
		{ id: 'some-id', name: 'test 1' },
		{ id: 'other-id', name: 'test 2' },
		{ id: 'another-id', name: 'test 3' }
	]);
	// >
	/*
		[
			{ id: 'some-id', name: 'test 1' },
			{ id: 'other-id', name: 'test 2' },
			{ id: 'another-id', name: 'test 3' }
		]
	*/

	// get
	await solr.get(model, {});
	// > [...] // Every document in the solr core, up to 500 documents (by default)

	await solr.get(model, { filters: { id: 'some-id' } });
	// > [{ id: 'some-id', name: 'test' }]

	await solr.get(model, { limit: 10, page: 2, filters: { name: 'foo' } });
	// > The second page of 10 documents matching name equals to 'foo'.

	await solr.get(model, { order: { id: 'desc' } });
	// > [...] Every document in the solr core, ordered by descending id, up to 500 documents (by default)

	// getTotals
	await solr.getTotals(model);
	// > { page: 1, limit: 500, pages: 1, total: 4 }

	// distinct
	await solr.distinct(model, { key: 'fieldName', filters: { someField: true } });
	// > ['some-value', 'other-value']

	// remove
	await solr.remove(model, { id: 'some-id', field: 'value' });

	// multiRemove
	await solr.multiRemove(model, { field: { type: 'greater', value: 10 } });

	// createSchema
	await solr.createSchema(model);
	
	// updateSchema
	await solr.updateSchema(model);

	// createCore
	await solr.createCore(model, 'new-core');
})();
```