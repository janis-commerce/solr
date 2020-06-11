# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Added
- `text_general` Solr field type as `text` field type
- `reloadCore()` method

### Changed
- `updateSchemas()` method reloads the core after updating the schema
- `updateSchemas()` method replace fields that was modified and not make changes if current schema was not changed

## [1.4.1] - 2020-05-26
### Fixed
- Reisntalled package and package-lock is now updated

## [1.4.0] - 2020-05-26
### Added
- `readTimeout` and `writeTimeout` for every get and post method

## [1.3.0] - 2020-05-19
### Added
- `commitUpdates` (commit) and `commitWithin` settings for update and updateCommands operation support
- `errorCodes` getter for better error handling

### Changed
- `commit` value for update and updatedCommands from `true` to `false` by default

## [1.2.0] - 2020-04-19
### Added
- `ping()` method
- `readTimeout` and `writeTimeout` settings for operations timeout support

## [1.1.0] - 2020-03-10
## Added
- `getSchema` method
- `coreExists` method
- limit and page support for `distinct` method

### Changed
- `updateSchema` method now obtains the existing schema from Solr then synces it with model schema
- `createCore` method: Not receives the core name anymore, it uses the core from the instance config.
	Also Can set if want to create the schemas after creating the core.
	And now checks if the core to create exists, then creates it only if not exists.

### Removed
- `createSchema` method, use `updateSchema` method instead

## [1.0.1] - 2020-02-20
### Fixed
- Multi filtering issues with AND and OR operations

## [1.0.0] - 2019-12-06
### Added
- Solr DB Driver Package
- `endpoint` helper
- `filters` helper
- `query` helper
- `request` helper
- `response` helper
- `schema` helper
- `utils` helper
- `insert` and `multiInsert` methods
- `remove` and `multiRemove` methods
- `get` and `getTotals` methods
- `distinct` method
- `createSchemas`, `updateSchemas` and `createCore` methods