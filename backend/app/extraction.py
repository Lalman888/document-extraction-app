"""
LLM-powered invoice extraction service.
Supports OpenAI GPT-4o Vision and Google Gemini 2.0 Flash with automatic fallback.
"""
import os
import base64
import json
import logging
from typing import Optional, Dict, Any
from dataclasses import dataclass
from abc import ABC, abstractmethod

logger = logging.getLogger(__name__)


# =============================================================================
# Data Classes
# =============================================================================

@dataclass
class ExtractionResult:
    """Result from invoice extraction."""
    success: bool
    confidence: float
    provider: str
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    raw_response: Optional[str] = None


@dataclass
class Address:
    """Parsed address structure."""
    name: str = ""
    address: str = ""
    city: str = ""
    state: str = ""
    zip_code: str = ""
    
    def to_dict(self) -> Dict:
        return {
            "name": self.name,
            "address": self.address,
            "city": self.city,
            "state": self.state,
            "zip": self.zip_code
        }


# =============================================================================
# Prompt Templates
# =============================================================================

SYSTEM_PROMPT = """You are an invoice data extraction specialist. Extract structured data from invoice images with high accuracy. Return JSON only, no explanations or markdown formatting."""

USER_PROMPT = """Extract all data from this invoice image. Return this exact JSON structure:

{
  "confidence": 0.0-1.0,
  "header": {
    "invoice_number": "string",
    "date": "YYYY-MM-DD",
    "customer_id": "string or null",
    "company_name": "string",
    "bill_to": {"name": "", "address": "", "city": "", "state": "", "zip": ""},
    "ship_to": {"name": "", "address": "", "city": "", "state": "", "zip": ""}
  },
  "line_items": [
    {"item_number": "", "description": "", "quantity": 0, "unit_price": 0.00, "total": 0.00}
  ],
  "totals": {
    "subtotal": 0.00,
    "tax_rate": 0.00,
    "tax_amount": 0.00,
    "shipping": 0.00,
    "other": 0.00,
    "total": 0.00
  },
  "additional_info": {
    "salesperson": "",
    "po_number": "",
    "ship_date": "",
    "ship_via": "",
    "terms": "",
    "fob": ""
  }
}

Rules:
- Parse all currency as float (remove $, commas)
- Parse dates flexibly (M/D/YYYY, YYYY-MM-DD, etc.) and output as YYYY-MM-DD
- Set confidence based on image clarity and extraction certainty (0.0-1.0)
- If a field is unclear or missing, set to null
- Ensure all numeric fields are actual numbers, not strings

CRITICAL - Tax Rate Precision:
- Read the tax rate percentage EXACTLY as shown, including ALL decimal places (e.g., 6.875% must be 6.875, not 6.75 or 6.88)
- Carefully examine every digit in percentage values - do not round or truncate
- "S & H" or "S&H" should be read as the "shipping" field
- "OTHER" should be read as the "other" field
- If a value shows "-" or is blank, set it to 0.00"""


# =============================================================================
# LLM Provider Abstract Base Class
# =============================================================================

class LLMProvider(ABC):
    """Abstract base class for LLM providers."""
    
    @property
    @abstractmethod
    def name(self) -> str:
        """Provider name."""
        pass
    
    @abstractmethod
    def extract_from_image(self, image_data: bytes, mime_type: str = "image/png") -> ExtractionResult:
        """
        Extract invoice data from an image.
        
        Args:
            image_data: Raw image bytes
            mime_type: Image MIME type
        
        Returns:
            ExtractionResult with extracted data or error
        """
        pass
    
    def _parse_json_response(self, response_text: str) -> Dict:
        """Parse JSON from LLM response, handling markdown code blocks."""
        text = response_text.strip()
        
        # Remove markdown code blocks if present
        if text.startswith("```json"):
            text = text[7:]
        elif text.startswith("```"):
            text = text[3:]
        
        if text.endswith("```"):
            text = text[:-3]
        
        return json.loads(text.strip())


# =============================================================================
# OpenAI Provider
# =============================================================================

class OpenAIProvider(LLMProvider):
    """OpenAI GPT-4o Vision provider."""
    
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        self._client = None
    
    @property
    def name(self) -> str:
        return "openai"
    
    @property
    def client(self):
        if self._client is None:
            try:
                from openai import OpenAI
                self._client = OpenAI(api_key=self.api_key)
            except ImportError:
                raise ImportError("openai package not installed. Run: pip install openai")
        return self._client
    
    def extract_from_image(self, image_data: bytes, mime_type: str = "image/png") -> ExtractionResult:
        if not self.api_key:
            return ExtractionResult(
                success=False,
                confidence=0.0,
                provider=self.name,
                error="OpenAI API key not configured"
            )
        
        try:
            # Encode image to base64
            base64_image = base64.b64encode(image_data).decode("utf-8")
            
            # Make API call
            response = self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": USER_PROMPT},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:{mime_type};base64,{base64_image}",
                                    "detail": "high"
                                }
                            }
                        ]
                    }
                ],
                max_tokens=2000,
                temperature=0.1
            )
            
            raw_response = response.choices[0].message.content
            logger.info(f"OpenAI raw response: {raw_response[:200]}...")
            
            # Parse JSON response
            extracted_data = self._parse_json_response(raw_response)
            confidence = extracted_data.get("confidence", 0.8)
            
            return ExtractionResult(
                success=True,
                confidence=confidence,
                provider=self.name,
                data=extracted_data,
                raw_response=raw_response
            )
            
        except json.JSONDecodeError as e:
            logger.error(f"OpenAI JSON parse error: {e}")
            return ExtractionResult(
                success=False,
                confidence=0.0,
                provider=self.name,
                error=f"Failed to parse JSON response: {str(e)}",
                raw_response=raw_response if 'raw_response' in locals() else None
            )
        except Exception as e:
            logger.error(f"OpenAI extraction error: {e}")
            return ExtractionResult(
                success=False,
                confidence=0.0,
                provider=self.name,
                error=str(e)
            )


# =============================================================================
# Google Gemini Provider
# =============================================================================

class GeminiProvider(LLMProvider):
    """Google Gemini 2.0 Flash provider."""
    
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        self._client = None
    
    @property
    def name(self) -> str:
        return "gemini"
    
    def _get_model(self):
        if self._client is None:
            try:
                import google.generativeai as genai
                genai.configure(api_key=self.api_key)
                self._client = genai.GenerativeModel("gemini-2.0-flash")
            except ImportError:
                raise ImportError("google-generativeai package not installed. Run: pip install google-generativeai")
        return self._client
    
    def extract_from_image(self, image_data: bytes, mime_type: str = "image/png") -> ExtractionResult:
        if not self.api_key:
            return ExtractionResult(
                success=False,
                confidence=0.0,
                provider=self.name,
                error="Gemini API key not configured"
            )
        
        try:
            import google.generativeai as genai
            
            model = self._get_model()
            
            # Create image part
            image_part = {
                "mime_type": mime_type,
                "data": image_data
            }
            
            # Make API call
            response = model.generate_content(
                [
                    f"{SYSTEM_PROMPT}\n\n{USER_PROMPT}",
                    image_part
                ],
                generation_config=genai.GenerationConfig(
                    temperature=0.1,
                    max_output_tokens=2000
                )
            )
            
            raw_response = response.text
            logger.info(f"Gemini raw response: {raw_response[:200]}...")
            
            # Parse JSON response
            extracted_data = self._parse_json_response(raw_response)
            confidence = extracted_data.get("confidence", 0.8)
            
            return ExtractionResult(
                success=True,
                confidence=confidence,
                provider=self.name,
                data=extracted_data,
                raw_response=raw_response
            )
            
        except json.JSONDecodeError as e:
            logger.error(f"Gemini JSON parse error: {e}")
            return ExtractionResult(
                success=False,
                confidence=0.0,
                provider=self.name,
                error=f"Failed to parse JSON response: {str(e)}",
                raw_response=raw_response if 'raw_response' in locals() else None
            )
        except Exception as e:
            logger.error(f"Gemini extraction error: {e}")
            return ExtractionResult(
                success=False,
                confidence=0.0,
                provider=self.name,
                error=str(e)
            )


# =============================================================================
# Extraction Service (with failover)
# =============================================================================

class ExtractionService:
    """
    Invoice extraction service with automatic provider failover.
    """
    
    def __init__(self):
        self.providers = {
            "openai": OpenAIProvider(),
            "gemini": GeminiProvider()
        }
        self.primary = os.getenv("PRIMARY_LLM", "openai")
        self.fallback = "gemini" if self.primary == "openai" else "openai"
    
    def extract_invoice(self, image_data: bytes, mime_type: str = "image/png") -> ExtractionResult:
        """
        Extract invoice data with automatic fallback.
        
        Args:
            image_data: Raw image bytes
            mime_type: Image MIME type
        
        Returns:
            ExtractionResult from primary or fallback provider
        """
        # Try primary provider
        logger.info(f"Attempting extraction with primary provider: {self.primary}")
        result = self.providers[self.primary].extract_from_image(image_data, mime_type)
        
        if result.success:
            logger.info(f"Primary extraction successful with confidence: {result.confidence}")
            return result
        
        # Fallback to secondary provider
        logger.warning(f"Primary provider failed: {result.error}. Trying fallback: {self.fallback}")
        fallback_result = self.providers[self.fallback].extract_from_image(image_data, mime_type)
        
        if fallback_result.success:
            logger.info(f"Fallback extraction successful with confidence: {fallback_result.confidence}")
            return fallback_result
        
        # Both failed
        logger.error(f"Both providers failed. Primary: {result.error}, Fallback: {fallback_result.error}")
        return ExtractionResult(
            success=False,
            confidence=0.0,
            provider="none",
            error=f"All providers failed. Primary ({self.primary}): {result.error}; Fallback ({self.fallback}): {fallback_result.error}"
        )
    
    def get_provider_status(self) -> Dict[str, Dict]:
        """Check status of configured providers."""
        status = {}
        for name, provider in self.providers.items():
            has_key = bool(provider.api_key)
            status[name] = {
                "configured": has_key,
                "is_primary": name == self.primary
            }
        return status


# =============================================================================
# Data Validation and Transformation
# =============================================================================

def validate_extraction(data: Dict) -> tuple[bool, list]:
    """
    Validate extracted invoice data.
    
    Args:
        data: Extracted invoice data
    
    Returns:
        Tuple of (is_valid, list of issues)
    """
    issues = []
    
    # Check header
    header = data.get("header", {})
    if not header.get("invoice_number"):
        issues.append("Missing invoice number")
    if not header.get("date"):
        issues.append("Missing invoice date")
    
    # Check line items
    line_items = data.get("line_items", [])
    if not line_items:
        issues.append("No line items found")
    else:
        for i, item in enumerate(line_items):
            qty = item.get("quantity", 0)
            price = item.get("unit_price", 0)
            total = item.get("total", 0)
            
            # Validate math (with 1% tolerance for rounding)
            expected = qty * price
            if expected > 0 and abs(total - expected) / expected > 0.01:
                issues.append(f"Line item {i+1}: math mismatch (qty={qty} × price={price} ≠ total={total})")
    
    # Check totals
    totals = data.get("totals", {})
    if not totals.get("total"):
        issues.append("Missing total amount")
    
    return len(issues) == 0, issues


def transform_to_sales_order(data: Dict, sales_order_id: int = None) -> tuple[Dict, list]:
    """
    Transform extracted data to SalesOrderHeader and SalesOrderDetail format.
    
    Args:
        data: Extracted invoice data
        sales_order_id: Optional SalesOrderID to use
    
    Returns:
        Tuple of (header_dict, list of detail_dicts)
    """
    header = data.get("header", {})
    totals = data.get("totals", {})
    
    # Transform header to SalesOrderHeader format
    order_header = {
        "SalesOrderNumber": f"SO{header.get('invoice_number', '')}".replace("SO-", "SO"),
        "OrderDate": header.get("date"),
        "CustomerID": header.get("customer_id"),
        "SubTotal": totals.get("subtotal", 0),
        "TaxAmt": totals.get("tax_amount", 0),
        "Freight": totals.get("shipping", 0),
        "TotalDue": totals.get("total", 0),
        "Status": 1,  # New order
        "OnlineOrderFlag": False
    }
    
    if sales_order_id:
        order_header["SalesOrderID"] = sales_order_id
    
    # Transform line items to SalesOrderDetail format
    order_details = []
    for item in data.get("line_items", []):
        detail = {
            "ProductID": None,  # Will need to look up from database
            "OrderQty": item.get("quantity", 0),
            "UnitPrice": item.get("unit_price", 0),
            "LineTotal": item.get("total", 0),
            "SpecialOfferID": 1,
            "UnitPriceDiscount": 0,
            "_item_number": item.get("item_number"),  # For product lookup
            "_description": item.get("description")   # For product matching
        }
        order_details.append(detail)
    
    return order_header, order_details


# Global service instance
extraction_service = ExtractionService()
