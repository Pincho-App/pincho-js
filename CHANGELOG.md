# Changelog

All notable changes to the Pincho JavaScript Client Library will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial release of Pincho JavaScript/TypeScript Client Library
- Full TypeScript support with comprehensive type definitions
- Zero-dependency implementation using native fetch API (Node.js 18+)
- Dual package support (CommonJS and ES Modules)
- Custom error classes for better error handling
- Comprehensive test suite with >90% coverage
- Method overloading for flexible API
- Configurable request timeouts using AbortController
- Detailed JSDoc documentation
- Usage examples for CommonJS, ESM, TypeScript, Express.js, and Next.js

### Features
- `Pincho` class for sending notifications
- Simple API: `send(title, message)` for basic notifications
- Advanced API: `send(options)` for notifications with all parameters
- Support for notification types, tags, images, and action URLs
- Authentication via API tokens
- Graceful error handling with fallback parsing
- Custom base URL support for testing or alternative gateways

### Error Types
- `PinchoError` - Base error class
- `PinchoAuthError` - Authentication failures (401, 403)
- `PinchoValidationError` - Invalid parameters (400, 404)

### Documentation
- Comprehensive README with quickstart guide
- API reference documentation
- Multiple usage examples
- Contributing guidelines
- Code of Conduct
- Security policy

### Development
- ESLint configuration for code quality
- Prettier for code formatting
- Vitest for testing with coverage reporting
- tsup for dual package building
- GitHub Actions configuration for CI/CD
- GitHub issue templates

## [1.0.0] - TBD

Initial public release.

---

## Release Guidelines

### Version Numbering

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR** version for incompatible API changes
- **MINOR** version for backwards-compatible functionality additions
- **PATCH** version for backwards-compatible bug fixes

### Change Categories

- **Added** - New features
- **Changed** - Changes in existing functionality
- **Deprecated** - Soon-to-be removed features
- **Removed** - Removed features
- **Fixed** - Bug fixes
- **Security** - Security vulnerability fixes

### Example Entry Format

```markdown
## [1.2.0] - 2024-01-15

### Added
- New `sendBatch()` method for sending multiple notifications (#42)
- Support for notification priorities (#45)

### Changed
- Improved error messages for validation failures (#48)
- Updated default timeout from 30s to 60s (#50)

### Fixed
- Fixed race condition in timeout handling (#43)
- Corrected TypeScript definitions for optional parameters (#46)

### Deprecated
- `sendSimple()` method - use `send()` instead (#49)
```

## Links

- [npm Package](https://www.npmjs.com/package/pincho)
- [GitHub Repository](https://github.com/Pincho-App/pincho-js)
- [Issue Tracker](https://github.com/Pincho-App/pincho-js/issues)
- [Pincho API Documentation](https://pincho.com/api)
