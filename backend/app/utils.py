"""
Utility functions for response formatting and performance monitoring.
"""
import time
import logging
from functools import wraps
from flask import jsonify, request, g

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# =============================================================================
# Response Helpers
# =============================================================================

def success_response(data: dict = None, meta: dict = None, status_code: int = 200):
    """
    Create a standardized success response.
    
    Args:
        data: Response data payload
        meta: Additional metadata (response_time_ms added automatically)
        status_code: HTTP status code
    
    Returns:
        Flask response tuple (jsonify, status_code)
    """
    response = {
        "success": True,
        "data": data or {}
    }
    
    # Add meta with response time if available
    response_meta = meta or {}
    if hasattr(g, 'start_time'):
        response_meta['response_time_ms'] = round((time.time() - g.start_time) * 1000, 2)
    
    if response_meta:
        response['meta'] = response_meta
    
    return jsonify(response), status_code


def paginated_response(items: list, page: int, per_page: int, total: int):
    """
    Create a paginated response.
    
    Args:
        items: List of items for current page
        page: Current page number (1-indexed)
        per_page: Items per page
        total: Total number of items
    
    Returns:
        Flask response tuple
    """
    total_pages = (total + per_page - 1) // per_page
    
    return success_response(
        data={"items": items},
        meta={
            "pagination": {
                "page": page,
                "per_page": per_page,
                "total": total,
                "total_pages": total_pages,
                "has_next": page < total_pages,
                "has_prev": page > 1
            }
        }
    )


# =============================================================================
# Performance Monitoring
# =============================================================================

def track_response_time(f):
    """
    Decorator to track and log response time for endpoints.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        g.start_time = time.time()
        g.timings = {}  # For tracking sub-operations
        
        result = None
        status_code = 200
        
        try:
            result = f(*args, **kwargs)
            if isinstance(result, tuple):
                status_code = result[1]
            return result
        except Exception as e:
            # Let Flask handle the exception, but log timing first
            elapsed_ms = round((time.time() - g.start_time) * 1000, 2)
            logger.info(f"Request failed: endpoint={request.path}, method={request.method}, "
                       f"response_time_ms={elapsed_ms}, error={type(e).__name__}")
            raise
        finally:
            if result is not None:
                elapsed_ms = round((time.time() - g.start_time) * 1000, 2)
                
                log_data = {
                    "endpoint": request.path,
                    "method": request.method,
                    "response_time_ms": elapsed_ms,
                    "status_code": status_code
                }
                
                # Add sub-operation timings if available
                if hasattr(g, 'timings') and g.timings:
                    log_data["timings"] = g.timings
                
                logger.info(f"Request completed: {log_data}")
    
    return decorated_function


def track_operation(name: str):
    """
    Context manager to track timing of specific operations.
    
    Usage:
        with track_operation("llm_call"):
            result = call_llm()
    """
    class OperationTimer:
        def __init__(self, operation_name):
            self.name = operation_name
            self.start = None
        
        def __enter__(self):
            self.start = time.time()
            return self
        
        def __exit__(self, *args):
            elapsed = round((time.time() - self.start) * 1000, 2)
            if hasattr(g, 'timings'):
                g.timings[self.name] = elapsed
    
    return OperationTimer(name)


# =============================================================================
# Validation Helpers
# =============================================================================

def validate_required_fields(data: dict, required: list) -> list:
    """
    Validate that required fields are present in data.
    
    Args:
        data: Dict to validate
        required: List of required field names
    
    Returns:
        List of missing field names
    """
    return [field for field in required if field not in data or data[field] is None]


def validate_file_type(filename: str, allowed_extensions: set) -> bool:
    """
    Validate that file has an allowed extension.
    
    Args:
        filename: Name of the file
        allowed_extensions: Set of allowed extensions (e.g., {'png', 'jpg', 'pdf'})
    
    Returns:
        True if valid, False otherwise
    """
    if '.' not in filename:
        return False
    ext = filename.rsplit('.', 1)[1].lower()
    return ext in allowed_extensions
