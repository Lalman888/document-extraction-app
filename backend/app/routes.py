"""
API Routes for Document Extraction Application.
Provides endpoints for health check, database operations, and invoice extraction.
"""
import json
from flask import Blueprint, request, Response, stream_with_context

# App imports
from app.utils import success_response, paginated_response, track_response_time, validate_file_type, track_operation
from app.database import db
from app.errors import NotFoundError, ValidationError, FileTypeError, ExtractionError
from app.extraction import extraction_service, validate_extraction, transform_to_sales_order

api_bp = Blueprint('api', __name__)


# =============================================================================
# Health Check
# =============================================================================

@api_bp.route('/health', methods=['GET'])
@track_response_time
def health_check():
    """
    Health check endpoint.
    
    Returns:
        API health status and database stats
    """
    stats = db.get_stats()
    
    return success_response(data={
        'status': 'healthy',
        'message': 'Document Extraction API is running',
        'database': stats
    })


# =============================================================================
# Database Read Endpoints (SalesOrderHeader)
# =============================================================================

@api_bp.route('/database/orders', methods=['GET'])
@track_response_time
def get_orders():
    """
    Get sales orders with pagination.
    
    Query params:
        page: Page number (default 1)
        per_page: Items per page (default 20, max 100)
        customer_id: Filter by customer ID
    
    Returns:
        Paginated list of orders
    """
    page = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 20, type=int), 100)
    customer_id = request.args.get('customer_id', type=int)
    
    if page < 1:
        raise ValidationError("Page must be >= 1", {"field": "page"})
    
    orders, total = db.get_orders(page=page, per_page=per_page, customer_id=customer_id)
    
    return paginated_response(items=orders, page=page, per_page=per_page, total=total)


@api_bp.route('/database/orders/<int:order_id>', methods=['GET'])
@track_response_time
def get_order(order_id: int):
    """
    Get a specific order with its details.
    
    Args:
        order_id: SalesOrderID
    
    Returns:
        Order header and line items
    """
    orders, _ = db.get_orders(page=1, per_page=1)
    
    # Find the specific order
    order = None
    all_orders, _ = db.get_orders(page=1, per_page=50000)
    for o in all_orders:
        if o['SalesOrderID'] == order_id:
            order = o
            break
    
    if not order:
        raise NotFoundError("Order", str(order_id))
    
    # Get order details
    details = db.get_order_details(order_id)
    
    return success_response(data={
        'order': order,
        'line_items': details,
        'item_count': len(details)
    })


# =============================================================================
# Database Read Endpoints (SalesOrderDetail)
# =============================================================================

@api_bp.route('/database/details', methods=['GET'])
@track_response_time
def get_order_details():
    """
    Get order details with optional order filter.
    
    Query params:
        order_id: Filter by SalesOrderID
    
    Returns:
        List of order details
    """
    order_id = request.args.get('order_id', type=int)
    
    if not order_id:
        raise ValidationError("order_id query parameter is required", {"field": "order_id"})
    
    details = db.get_order_details(order_id)
    
    return success_response(data={
        'order_id': order_id,
        'items': details,
        'count': len(details)
    })


# =============================================================================
# Database Read Endpoints (Products)
# =============================================================================

@api_bp.route('/database/products', methods=['GET'])
@track_response_time
def get_products():
    """
    Get products with pagination.
    
    Query params:
        page: Page number (default 1)
        per_page: Items per page (default 50, max 100)
    
    Returns:
        Paginated list of products
    """
    page = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 50, type=int), 100)
    
    products, total = db.get_products(page=page, per_page=per_page)
    
    return paginated_response(items=products, page=page, per_page=per_page, total=total)


@api_bp.route('/database/products/search', methods=['GET'])
@track_response_time
def search_product():
    """
    Search for a product by ProductNumber.
    
    Query params:
        product_number: ProductNumber to search
    
    Returns:
        Product details or 404
    """
    product_number = request.args.get('product_number')
    
    if not product_number:
        raise ValidationError("product_number query parameter is required", {"field": "product_number"})
    
    product = db.get_product_by_number(product_number)
    
    if not product:
        raise NotFoundError("Product", product_number)
    
    return success_response(data={'product': product})


# =============================================================================
# Database Read Endpoints (Customers)
# =============================================================================

@api_bp.route('/database/customers/<int:customer_id>', methods=['GET'])
@track_response_time
def get_customer(customer_id: int):
    """
    Get customer by ID.
    
    Args:
        customer_id: CustomerID
    
    Returns:
        Customer details
    """
    customer = db.get_customer(customer_id)
    
    if not customer:
        raise NotFoundError("Customer", str(customer_id))
    
    return success_response(data={'customer': customer})


@api_bp.route('/database/customers/search', methods=['GET'])
@track_response_time
def search_customers():
    """
    Search customers by name.
    
    Query params:
        q: Search query
        limit: Max results (default 10)
    
    Returns:
        List of matching customers
    """
    query = request.args.get('q', '')
    limit = min(request.args.get('limit', 10, type=int), 50)
    
    if len(query) < 2:
        raise ValidationError("Search query must be at least 2 characters", {"field": "q"})
    
    results = db.search_customers(query, limit=limit)
    
    return success_response(data={
        'query': query,
        'results': results,
        'count': len(results)
    })


# =============================================================================
# Database Statistics
# =============================================================================

@api_bp.route('/database/stats', methods=['GET'])
@track_response_time
def get_database_stats():
    """
    Get database statistics.
    
    Query params:
        extracted_only: If 'true', return only extracted data counts (not reference data)
    
    Returns:
        Record counts for all tables
    """
    extracted_only = request.args.get('extracted_only', 'false').lower() == 'true'
    stats = db.get_stats(extracted_only=extracted_only)
    return success_response(data=stats)


# =============================================================================
# Invoice Extraction Endpoints
# =============================================================================

@api_bp.route('/invoices/upload', methods=['POST'])
@track_response_time
def upload_invoice():
    """
    Upload and extract data from an invoice image.
    
    Form data:
        file: Invoice image file (PNG, JPG, PDF)
        save: Whether to save to database (default: false)
    
    Returns:
        Extracted invoice data with confidence score
    """
    # Validate file presence
    if 'file' not in request.files:
        raise ValidationError("No file uploaded", {"field": "file"})
    
    file = request.files['file']
    if file.filename == '':
        raise ValidationError("No file selected", {"field": "file"})
    
    # Validate file type
    allowed_extensions = {'png', 'jpg', 'jpeg', 'pdf', 'webp'}
    if not validate_file_type(file.filename, allowed_extensions):
        raise FileTypeError(
            file.filename.rsplit('.', 1)[1] if '.' in file.filename else 'unknown',
            list(allowed_extensions)
        )
    
    # Read file data
    image_data = file.read()
    mime_type = file.content_type or 'image/png'
    
    # Extract data using LLM
    with track_operation("llm_extraction"):
        result = extraction_service.extract_invoice(image_data, mime_type)
    
    if not result.success:
        raise ExtractionError(result.error, confidence=result.confidence)
    
    # Validate extracted data
    is_valid, issues = validate_extraction(result.data)
    
    # Check if user wants to save to database
    save_to_db = request.form.get('save', 'false').lower() == 'true'
    saved_order_id = None
    
    if save_to_db and is_valid:
        with track_operation("database_save"):
            order_header, order_details = transform_to_sales_order(result.data)
            saved_order_id = db.add_order(order_header)
            db.add_order_details(saved_order_id, order_details)
    
    return success_response(data={
        'extraction': {
            'success': True,
            'provider': result.provider,
            'confidence': result.confidence,
            'data': result.data
        },
        'validation': {
            'is_valid': is_valid,
            'issues': issues
        },
        'database': {
            'saved': save_to_db and is_valid,
            'order_id': saved_order_id
        }
    })


@api_bp.route('/invoices/extract', methods=['POST'])
@track_response_time
def extract_invoice_data():
    """
    Extract data from invoice without saving (preview mode).
    Same as upload but never saves to database.
    """
    if 'file' not in request.files:
        raise ValidationError("No file uploaded", {"field": "file"})
    
    file = request.files['file']
    if file.filename == '':
        raise ValidationError("No file selected", {"field": "file"})
    
    allowed_extensions = {'png', 'jpg', 'jpeg', 'pdf', 'webp'}
    if not validate_file_type(file.filename, allowed_extensions):
        raise FileTypeError(
            file.filename.rsplit('.', 1)[1] if '.' in file.filename else 'unknown',
            list(allowed_extensions)
        )
    
    image_data = file.read()
    mime_type = file.content_type or 'image/png'
    
    with track_operation("llm_extraction"):
        result = extraction_service.extract_invoice(image_data, mime_type)
    
    if not result.success:
        raise ExtractionError(result.error, confidence=result.confidence)
    
    is_valid, issues = validate_extraction(result.data)
    
    return success_response(data={
        'provider': result.provider,
        'confidence': result.confidence,
        'extracted_data': result.data,
        'validation': {
            'is_valid': is_valid,
            'issues': issues
        }
    })


@api_bp.route('/invoices/upload-stream', methods=['POST'])
def upload_invoice_stream():
    """
    Upload and extract data from an invoice image with SSE streaming progress.
    
    Streams progress updates as Server-Sent Events.
    """
    def generate():
        def send_step(step_id: str, status: str, message: str = None):
            data = {"step": step_id, "status": status}
            if message:
                data["message"] = message
            yield f"data: {json.dumps(data)}\n\n"
        
        def send_result(success: bool, data: dict = None, error: dict = None):
            result = {"type": "result", "success": success}
            if data:
                result["data"] = data
            if error:
                result["error"] = error
            yield f"data: {json.dumps(result)}\n\n"
        
        # Step 1: Validate file
        yield from send_step("validate", "active", "Validating file...")
        
        if 'file' not in request.files:
            yield from send_step("validate", "error", "No file uploaded")
            yield from send_result(False, error={"code": "ERR_VALIDATION", "message": "No file uploaded"})
            return
        
        file = request.files['file']
        if file.filename == '':
            yield from send_step("validate", "error", "No file selected")
            yield from send_result(False, error={"code": "ERR_VALIDATION", "message": "No file selected"})
            return
        
        allowed_extensions = {'png', 'jpg', 'jpeg', 'pdf', 'webp'}
        if not validate_file_type(file.filename, allowed_extensions):
            yield from send_step("validate", "error", "Invalid file type")
            yield from send_result(False, error={"code": "ERR_FILE_TYPE", "message": "Invalid file type"})
            return
        
        yield from send_step("validate", "complete", "File validated")
        
        # Step 2: Upload/Read file
        yield from send_step("upload", "active", "Reading image data...")
        image_data = file.read()
        mime_type = file.content_type or 'image/png'
        yield from send_step("upload", "complete", f"Image loaded ({len(image_data)} bytes)")
        
        # Step 3: AI Analysis
        yield from send_step("analyze", "active", f"Analyzing with {extraction_service.primary.upper()}...")
        
        try:
            result = extraction_service.extract_invoice(image_data, mime_type)
        except Exception as e:
            yield from send_step("analyze", "error", str(e))
            yield from send_result(False, error={"code": "ERR_LLM_FAILED", "message": str(e)})
            return
        
        if not result.success:
            yield from send_step("analyze", "error", result.error)
            yield from send_result(False, error={"code": "ERR_EXTRACTION", "message": result.error})
            return
        
        yield from send_step("analyze", "complete", f"Extracted with {result.provider} ({result.confidence*100:.0f}% confidence)")
        
        # Step 4: Validate extraction
        yield from send_step("extract", "active", "Validating extracted data...")
        is_valid, issues = validate_extraction(result.data)
        
        if is_valid:
            yield from send_step("extract", "complete", "All validation checks passed")
        else:
            yield from send_step("extract", "complete", f"Found {len(issues)} validation issues")
        
        # Step 5: Save to database (if requested)
        save_to_db = request.form.get('save', 'false').lower() == 'true'
        saved_order_id = None
        
        if save_to_db:
            yield from send_step("save", "active", "Saving to database...")
            
            if is_valid:
                try:
                    order_header, order_details = transform_to_sales_order(result.data)
                    saved_order_id = db.add_order(order_header)
                    db.add_order_details(saved_order_id, order_details)
                    yield from send_step("save", "complete", f"Saved as Order #{saved_order_id}")
                except Exception as e:
                    yield from send_step("save", "error", str(e))
            else:
                yield from send_step("save", "error", "Cannot save - validation failed")
        
        # Send final result
        yield from send_result(True, data={
            'extraction': {
                'success': True,
                'provider': result.provider,
                'confidence': result.confidence,
                'data': result.data
            },
            'validation': {
                'is_valid': is_valid,
                'issues': issues
            },
            'database': {
                'saved': save_to_db and is_valid and saved_order_id is not None,
                'order_id': saved_order_id
            }
        })
    
    return Response(
        stream_with_context(generate()),
        mimetype='text/event-stream',
        headers={
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*'
        }
    )


# =============================================================================
# LLM Status
# =============================================================================

@api_bp.route('/llm/status', methods=['GET'])
@track_response_time
def get_llm_status():
    """
    Get status of configured LLM providers.
    
    Returns:
        Provider configuration status
    """
    status = extraction_service.get_provider_status()
    
    return success_response(data={
        'providers': status,
        'primary': extraction_service.primary,
        'fallback': extraction_service.fallback
    })


@api_bp.route('/invoices/save-edited', methods=['POST'])
@track_response_time
def save_edited_invoice():
    """
    Save edited invoice data to database.
    
    Expects JSON body with 'data' containing the edited extraction result.
    """
    data = request.get_json()
    
    if not data or 'data' not in data:
        raise ValidationError("Missing 'data' in request body", {"field": "data"})
    
    extracted_data = data['data']
    
    # Transform to SalesOrder format and save
    with track_operation("save_edited"):
        order_header, order_details = transform_to_sales_order(extracted_data)
        order_id = db.add_order(order_header)
        db.add_order_details(order_id, order_details)
    
    return success_response(data={
        'saved': True,
        'order_id': order_id,
        'message': f'Saved as Order #{order_id}'
    })

