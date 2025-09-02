# Changelog

All notable changes to the Gamma Integration app will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.1] - 2025-09-02

### 🧹 Maintenance
- **Code Cleanup**: Removed unused `clear_locks.py` patch file
- **Version Sync**: Synchronized version number between `__init__.py` and changelog

### 🔧 Fixed
- **Version Consistency**: Updated version from 0.0.1 to 1.2.1 to match actual release state

## [1.2.0] - 2025-01-25

### 🚀 Added
- **Dynamic Proposal Linking**: Automatic linking of Gamma Proposals to Quotations via child table
- **Auto-refresh Mechanism**: Client-side refresh functionality for Gamma tab
- **Migration Patches**: Backward compatibility for existing proposals
- **Enhanced API Endpoints**: New methods for proposal management and linking
- **Comprehensive Documentation**: Complete README with usage examples and API reference
- **Error Handling**: Improved error handling and logging throughout the system

### 🔧 Fixed
- **"No Gamma proposals linked" Issue**: Resolved dynamic linking problem for existing quotations
- **Proposal Display**: Fixed empty state display when no proposals are linked
- **Child Table Synchronization**: Ensured proper linking between proposals and quotations
- **Form Refresh**: Automatic refresh of Gamma tab when quotations are loaded

### 🎨 Improved
- **User Experience**: Seamless integration with existing ERPNext workflows
- **Performance**: Optimized API calls and reduced redundant operations
- **Code Quality**: Enhanced error handling and validation
- **Documentation**: Complete API documentation and usage examples

### 🔄 Changed
- **Gamma Proposal DocType**: Added automatic linking methods (`after_insert`, `on_update`)
- **JavaScript Client**: Enhanced form event handlers and refresh mechanisms
- **API Structure**: Improved method organization and response handling

### 📋 Technical Details

#### New Methods Added
- `gamma_integration.gamma_integration.doctype.gamma_proposal.gamma_proposal.link_to_quotation()`
- `gamma_integration.gamma_integration.api.auto_link_proposal_to_quotation()`
- `gamma_integration.gamma_integration.api.refresh_quotation_gamma_display()`

#### Database Changes
- Enhanced child table linking for `Quotation Gamma Proposal`
- Improved proposal type mapping and status synchronization

#### Migration Patches
- `gamma_integration.gamma_integration.patches.link_existing_gamma_proposals`
- Automatically executed during app installation/upgrade

## [1.1.0] - 2024-12-15

### 🚀 Added
- **Multiple Proposal Types**: Support for Technical, Financial, Executive, Product Demo, and Case Study proposals
- **Status Management**: Draft, In Review, Shared, Approved, Rejected status tracking
- **Enhanced UI/UX**: Improved proposal management interface
- **Custom Print Formats**: Professional quotation layouts with embedded proposals

### 🔧 Fixed
- **URL Parsing**: Better handling of different Gamma URL formats
- **Embed ID Extraction**: Improved extraction from various Gamma URL types

### 🎨 Improved
- **Proposal Display**: Enhanced visual presentation of embedded proposals
- **Form Validation**: Better input validation and error messages

## [1.0.0] - 2024-11-01

### 🚀 Initial Release
- **Basic Gamma Integration**: Core functionality for embedding Gamma.app presentations
- **Quotation Integration**: Custom fields and tabs for quotation enhancement
- **Proposal Management**: Basic CRUD operations for Gamma Proposals
- **API Endpoints**: RESTful API for proposal creation and management
- **Custom DocTypes**: Gamma Proposal and Quotation Gamma Proposal doctypes

### 📋 Core Features
- Embed Gamma presentations in quotations
- Link proposals to quotations
- Basic proposal status tracking
- Custom fields for quotation enhancement

---

## Migration Guide

### Upgrading from v1.1.0 to v1.2.0

1. **Backup your site**:
   ```bash
   bench --site your-site.local backup
   ```

2. **Update the app**:
   ```bash
   bench get-app gamma_integration --branch main
   bench --site your-site.local migrate
   ```

3. **Link existing proposals** (automatic via patch):
   ```bash
   # This runs automatically during migration
   bench --site your-site.local execute gamma_integration.gamma_integration.patches.link_existing_gamma_proposals.execute
   ```

4. **Verify functionality**:
   - Open existing quotations
   - Check Gamma tab displays proposals correctly
   - Test new proposal creation

### Upgrading from v1.0.0 to v1.1.0

1. **Update custom fields**:
   ```bash
   bench --site your-site.local migrate
   ```

2. **Update existing proposals**:
   - Review proposal types
   - Update status fields as needed

---

## Breaking Changes

### v1.2.0
- **None**: Fully backward compatible

### v1.1.0
- **Proposal Type Field**: New options added, existing proposals default to "Main Proposal"
- **Status Field**: Enhanced options, existing proposals default to "Draft"

---

## Known Issues

### v1.2.0
- **Browser Login**: Some development environments may have authentication issues (does not affect production)
- **Image Placeholders**: Documentation images are placeholders pending actual screenshots

### v1.1.0
- **URL Validation**: Some edge cases in Gamma URL parsing may require manual correction

---

## Deprecations

### v1.2.0
- **None**

### v1.1.0
- **Legacy API Methods**: Some internal methods deprecated in favor of new API structure

---

## Security Updates

### v1.2.0
- **Input Validation**: Enhanced validation for Gamma URLs and proposal data
- **Permission Checks**: Improved permission handling for proposal operations

### v1.1.0
- **Data Sanitization**: Better sanitization of user inputs

---

## Performance Improvements

### v1.2.0
- **Reduced API Calls**: Optimized client-server communication
- **Efficient Linking**: Improved database operations for proposal linking
- **Caching**: Better caching of proposal data

### v1.1.0
- **Query Optimization**: Improved database queries for proposal retrieval

---

## Contributors

- **Development Team**: Core functionality and bug fixes
- **Community**: Feature requests and testing feedback
- **Documentation**: Comprehensive guides and examples

---

## Support

For issues related to specific versions:
- **v1.2.0+**: [GitHub Issues](https://github.com/your-repo/gamma_integration/issues)
- **v1.1.0**: Legacy support available
- **v1.0.0**: End of life, upgrade recommended

---

*For detailed technical documentation, see [README.md](README.md)*