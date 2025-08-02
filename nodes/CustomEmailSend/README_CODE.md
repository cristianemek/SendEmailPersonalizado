# CustomEmailSend Node - Code Structure

This directory contains the refactored CustomEmailSend node with improved clean code practices.

## File Structure

### `CustomEmailSend.node.ts`
- **Main node implementation**
- Contains the INodeType interface implementation
- Defines the node properties and UI configuration
- Implements the execute method using extracted utility functions

### `email.types.ts`
- **Type definitions and constants**
- EMAIL_FORMATS: Available email content formats (text, html, both)
- PRIORITIES: Email priority levels (normal, high, low)  
- DEFAULT_HEADERS: Default email marketing compliance headers
- TypeScript interfaces for type safety

### `email.utils.ts`
- **Utility functions for email processing**
- Email validation and parsing functions
- Email content building utilities
- Attachment handling
- Test mode configuration
- Custom headers parsing
- Email options application

## Key Improvements Made

### 1. **Separation of Concerns**
- UI configuration separated from business logic
- Utility functions extracted to dedicated modules
- Constants and types organized in separate files

### 2. **Code Reusability**
- Functions are pure and testable
- Common email operations are centralized
- Validation logic is consistent across the application

### 3. **Type Safety**
- Proper TypeScript interfaces and types
- Const assertions for string literals
- Generic functions with proper type constraints

### 4. **Error Handling**
- Centralized error handling in utility functions
- Better error messages with context
- Graceful handling of optional operations

### 5. **Maintainability**
- Clear function names and documentation
- Single responsibility principle applied
- Easy to extend with new features

### 6. **Performance**
- Reduced redundant code
- Efficient parsing and validation
- Memory-conscious attachment handling

## Function Overview

### Validation Functions
- `validateEmail()`: Single email validation
- `validateEmailList()`: Comma-separated email list validation

### Parsing Functions  
- `parseEmails()`: Clean and format email addresses
- `parseCustomHeaders()`: Parse JSON headers with validation

### Building Functions
- `buildEmailContent()`: Create email content based on format
- `buildAttachments()`: Process binary attachments
- `buildReturnData()`: Format execution response

### Configuration Functions
- `applyTestMode()`: Configure test email routing
- `applyEmailOptions()`: Apply additional email options

## Usage Patterns

All utility functions follow consistent patterns:
- Input validation
- Error handling with context
- Type-safe returns
- Side-effect free operations (where possible)

This refactored structure makes the code more maintainable, testable, and easier to extend with new email features.
