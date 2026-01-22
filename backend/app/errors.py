"""
Custom exceptions and error handlers for the Document Extraction API.
Implements standardized error responses following Flask best practices.
"""
from flask import jsonify
from functools import wraps
import traceback


# =============================================================================
# Custom Exceptions
# =============================================================================

class APIError(Exception):
    """Base exception for API errors."""
    
    def __init__(self, message: str, code: str, status_code: int = 400, details: dict = None):
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code
        self.details = details or {}


class ValidationError(APIError):
    """Raised when input validation fails."""
    
    def __init__(self, message: str, details: dict = None):
        super().__init__(
            message=message,
            code="ERR_VALIDATION",
            status_code=400,
            details=details
        )


class NotFoundError(APIError):
    """Raised when a resource is not found."""
    
    def __init__(self, resource: str, identifier: str = None):
        message = f"{resource} not found"
        if identifier:
            message = f"{resource} '{identifier}' not found"
        super().__init__(
            message=message,
            code="ERR_NOT_FOUND",
            status_code=404,
            details={"resource": resource, "identifier": identifier}
        )


class DuplicateError(APIError):
    """Raised when attempting to create a duplicate resource."""
    
    def __init__(self, resource: str, identifier: str):
        super().__init__(
            message=f"{resource} '{identifier}' already exists",
            code="ERR_DUPLICATE",
            status_code=409,
            details={"resource": resource, "identifier": identifier}
        )


class LLMError(APIError):
    """Raised when LLM API call fails."""
    
    def __init__(self, provider: str, message: str = None):
        super().__init__(
            message=message or f"LLM provider '{provider}' failed",
            code="ERR_LLM_FAILED",
            status_code=502,
            details={"provider": provider}
        )


class ExtractionError(APIError):
    """Raised when data extraction fails."""
    
    def __init__(self, message: str, confidence: float = None):
        super().__init__(
            message=message,
            code="ERR_EXTRACTION",
            status_code=422,
            details={"confidence": confidence}
        )


class FileTypeError(APIError):
    """Raised when file type is not supported."""
    
    def __init__(self, file_type: str, allowed_types: list):
        super().__init__(
            message=f"File type '{file_type}' not supported. Allowed: {', '.join(allowed_types)}",
            code="ERR_FILE_TYPE",
            status_code=415,
            details={"file_type": file_type, "allowed_types": allowed_types}
        )


# =============================================================================
# Error Handlers
# =============================================================================

def register_error_handlers(app):
    """Register error handlers with Flask app."""
    
    @app.errorhandler(APIError)
    def handle_api_error(error):
        """Handle custom API errors."""
        response = {
            "success": False,
            "error": {
                "code": error.code,
                "message": error.message,
                "details": error.details
            }
        }
        return jsonify(response), error.status_code
    
    @app.errorhandler(400)
    def handle_bad_request(error):
        """Handle 400 Bad Request."""
        response = {
            "success": False,
            "error": {
                "code": "ERR_BAD_REQUEST",
                "message": str(error.description) if hasattr(error, 'description') else "Bad request",
                "details": {}
            }
        }
        return jsonify(response), 400
    
    @app.errorhandler(404)
    def handle_not_found(error):
        """Handle 404 Not Found."""
        response = {
            "success": False,
            "error": {
                "code": "ERR_NOT_FOUND",
                "message": "Resource not found",
                "details": {}
            }
        }
        return jsonify(response), 404
    
    @app.errorhandler(500)
    def handle_internal_error(error):
        """Handle 500 Internal Server Error."""
        # Log the full traceback for debugging
        app.logger.error(f"Internal error: {traceback.format_exc()}")
        
        response = {
            "success": False,
            "error": {
                "code": "ERR_INTERNAL",
                "message": "An internal server error occurred",
                "details": {}
            }
        }
        return jsonify(response), 500
