# Solr

![Build Status](https://github.com/janis-commerce/solr/workflows/Build%20Status/badge.svg)
[![Coverage Status](https://coveralls.io/repos/github/janis-commerce/solr/badge.svg?branch=master)](https://coveralls.io/github/janis-commerce/solr?branch=master)
[![npm version](https://badge.fury.io/js/%40janiscommerce%2Fsolr.svg)](https://www.npmjs.com/package/@janiscommerce/solr)

Apache Solr Driver

## Installation
```sh
npm install @janiscommerce/solr
```

## Models
Whenever the `Model` type is mentioned in this document, it refers to an instance of [@janiscommerce/model](https://www.npmjs.com/package/@janiscommerce/model).

This is used to configure which collection should be used, which unique indexes it has, among other stuff.

## Getters
- `errorCodes` *(instance getter)*: Returns an `[Object]` with the Solr [error codes](#Errors) for error handling.

**Example**
```js
try {

	await solr.insert(myModel, {my: 'item'});

} catch(err) {

	if(err && err.code === solr.errorCodes.REQUEST_TIMEOUT)
		return myTimeoutHandler(err);

	throw err;
}
```

## API

### `new Solr(config)`
Constructs the Solr driver instance, connected with the `config` object.

**Config properties**

- url `String` (required): Solr URL
- core `String` (required): Solr Core
- user `String` (optional): Auth user
- password `String` (optional but required if an user is specified): Auth password
- readTimeout `Number` (optional): The read operations timeout in miliseconds. Default: `2000`
- writeTimeout `Number` (optional): The write operations timeout in miliseconds. Default: `5000`
- commitUpdates `Boolean` (optional): Set if the write operations should wait until Solr commits all the changes before returning. Default `false`.
- commitWithin `Number` (optional): Set the time period (in seconds) that Solr must take to commit the changes made in write operations. Default: `10`.

**Config usage**
```js
{
	url: 'http://localhost:8983',
	core: 'some-core',
	user: 'some-user',
	password: 'some-password'
}
```

### ***async*** `createCore(model, shouldBuildSchema)`
Creates a new core in the Solr URL, then build the fields schema for that core.

- model `Model`: A model instance
- shouldBuildSchema `Boolean`: Specifies if should create the fields schema after creating the core. Default: `true`

- Resolves `Boolean`: `true` if the operation was successful
- Rejects `SolrError`: When something bad occurs

### ***async*** `reloadCore()`
Reloads the Solr core

- Resolves `Boolean`: `true` if the operation was successful
- Rejects `SolrError`: When something bad occurs

### ***async*** `coreExists()`
Checks if the core exists in Solr.

- Resolves `Boolean`: `true` if exists, `false` otherwise.

### ***async*** `getSchema()`
Get the current fields schema frol Solr

- Resolves `Array<Object>`: An array with the fields schema

- Rejects `SolrError`: When something bad occurs

### ***async*** `updateSchema(model)`
Update the fields types and schema by syncing the current fields schema in Solr with the defined schema in the model static getter `schema`* and `fieldTypes`**.

- model `Model`: A model instance

- Resolves `Boolean`: `true` if the operation was successful
- Rejects `SolrError`: When something bad occurs

*If you need details about how to define the fields schema in the model, see the schema apart [below](#Fields-schema)  
**If you need details about how to define the field types in the model, see the field types apart [below](#Field-types)

#### Fields schema

The fields schema are required by Solr to use the correct data types on every field, by default, Solr sets new fields as an `array` of `strings`, even in objects and his properties.

**Field types**

The field types can be defined in the model static getter `schema` like this:
```js
class MyModel extends Model {

	static get schema() {

		return {
			myStringField: true, // Default type string
			myNumberString: { type: 'number' },
			myArrayOfStrings: { type: ['string'] },
			myObject: {
				type: {
					property: 'string'
				}
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
| text           | text_general     |

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

#### Field types
Custom field types can be defined in the model static getter `fieldTypes` like this:

```js
class MyModel extends Model {

	static get fieldTypes() {

		return {
			myFieldType: {
				class: 'solr.TextField',
				indexed: false,
				stored: true
				// ...
			}
		}
	}

	static get schema() {

		return {
			myCustomField: { type: 'myFieldType' }
			// ...
		}
	}
}
```

The field type content accepts native Solr field type properties, please check the [Solr field types documentation for more information](https://lucene.apache.org/solr/guide/8_5/field-type-definitions-and-properties.html#field-type-definitions-and-properties).

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

### ***async*** `distinct(model, [parameters])`
Searches distinct values of a property in a solr core

- model: `Model`: A model instance
- parameters: `Object` (required): The query parameters. It accepts `key` (the field name to get distinct values from), `filters`, `limit` and `page` -- described below in `get()` method.

- Resolves `Array<Object>`: An array of documents
- Rejects `SolrError`: When something bad occurs

### ***async*** `group(model, [parameters])`
Group results by field or fields

- model: `Model`: A model instance
- parameters: `Object` (required): 
  - **field** `String|Array<string>`: The field or fields to group by
  - **order** `Object`: -- described below in `get()` method.
  - **filters** `Object`: -- described below in `get()` method.
  - **limit** `Number`: -- described below in `get()` method. (Default: 1)

- Resolves `Object`: An object with the grouped field and its count and items.
- Rejects `SolrError`: When something bad occurs

Example:
```js

const groupedResponse = await solr.group(model, { field: 'someField' });

// Expected response
{
	someField: {
		count: 150,
		groups: {
			someFieldValue: {
				count: 75,
				items: [
					{ someField: 'someFieldValue', otherField: 'otherFieldValue' },
					// ...
				]
			},
			someFieldValue2: {
				count: 75,
				items: [
					{ someField: 'someFieldValue2', otherField: 'anotherFieldValue' },
					// ...
				]
			}
		}
	}
}
```

### ***async*** `facet(model, [parameters])`
Get facet counts by field or pivot

- model: `Model`: A model instance
- parameters: `Object` (required): 
  - **field** `String`: The facet field (required if pivot is not received)
  - **pivot** `String|Array<string>`: The facet pivot (required if field is not received)
    - This field gives different results depending of how you use it:
      - Sending a string with the field name (`{ pivot: 'myField' }`) will facet the results by that field (same as using field param).
      - Sending a string with more than a field separated by comma (`{ pivot: 'myField,anotherField' }`) will facet results by that field and the rest of the combination recursively.
      - Sending an array of strings with field names (`['myField', 'anotherField']`) will facet the results by each of them but the response will still be a single array.
  - **order** `Object`: -- described below in `get()` method.
  - **filters** `Object`: -- described below in `get()` method.
  - **limit** `Number`: -- described below in `get()` method. (Default: 1)
  - **page** `Number`: -- described below in `get()` method.

- Resolves `Array<object>`: An array with the facet results
- Rejects `SolrError`: When something bad occurs

Example:
```js

// Using field
const facetResponse = await solr.facet(model, { field: 'someField' });

// Expected response
[
	{ field: 'someField', value: 'someFieldValue', count: 125 },
	{ field: 'someField', value: 'otherFieldValue', count: 356 }
]

// Using pivot (single field)
const facetResponse = await solr.facet(model, { pivot: 'someField' });

// Expected response
[
	{ field: 'someField', value: 'someFieldValue', count: 125 },
	{ field: 'someField', value: 'otherFieldValue', count: 356 }
]

// Using pivot (combined fields)
const facetResponse = await solr.facet(model, { pivot: 'someField,otherField' });

// Expected response
[
	{
		field: 'someField',
		value: 'someFieldValue',
		count: 150,
		pivot: [
			{ field: 'otherField', value: 'otherFieldValue', count: 75 },
			{ field: 'otherField', value: 'otherFieldValue2', count: 75 }
		]
	}
]

// Using pivot (array of fields)
const facetResponse = await solr.facet(model, { pivot: ['someField', 'otherField'] });

// Expected response
[
	{ field: 'someField', value: 'someFieldValue', count: 125 },
	{ field: 'someField', value: 'otherFieldValue', count: 356 },
	{ field: 'otherField', value: 'otherFieldValue', count: 3025 },
	{ field: 'otherField', value: 'anotherFieldValue', count: 1250 }
]
```

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
	
	static get fields() {

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
| search 	     | field:\*value\*    |
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
- item: `Object`: The item to be removed. **IMPORTANT**: The received item must have an `id` in order to remove it, otherwise the function will reject.

- Resolves `Boolean`: `true` if the operation was successful
- Rejects `SolrError`: When something bad occurs

### ***async*** `multiRemove(model, filters)`
Removes one or more documents in a solr core

- model: `Model`: A model instance
- filters: `Object`: Filters criteria to match documents

- Resolves `Boolean`: `true` if the operation was successful
- Rejects `SolrError`: When something bad occurs

### ***async*** `ping()`
Checks if the Solr host and core is online

- Resolves `Boolean`: `true` if the Solr ping status is `'OK'`, `false` otherwise
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
| 7    | Request timeout           |
| 8    | Internal Solr error       |
| 9    | Invalid parameters        |

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
	await solr.distinct(model, { key: 'fieldName', limit: 40, page: 5 filters: { someField: true } });
	// > ['some-value', 'other-value']

	// remove
	await solr.remove(model, { id: 'some-id', field: 'value' });
	// > true

	// multiRemove
	await solr.multiRemove(model, { field: { type: 'greater', value: 10 } });
	// > true
	
	// getSchema
	await solr.getSchema();
	// > [{ name: 'someField', type: 'string }]

	// updateSchema
	await solr.updateSchema(model);
	// > true

	// createCore
	await solr.createCore(model);
	// > true

	// reloadCore
	await solr.reloadCore(model);
	// > true

	// coreExists
	await sorl.coreExists();
	// > true

	// ping
	await solr.ping();
	// > true
})();
```