"""
Database module for Excel/Pandas operations.
Uses Case Study Data.xlsx for reference data (read-only).
Uses Extracted_Orders.xlsx for newly extracted invoice data (read/write).
"""
import os
import pandas as pd
from datetime import datetime
from typing import Optional, List, Dict, Any
import logging

logger = logging.getLogger(__name__)

# Paths to Excel files
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'data')
REFERENCE_FILE = os.path.join(DATA_DIR, 'Case Study Data.xlsx')
EXTRACTED_FILE = os.path.join(DATA_DIR, 'Extracted_Orders.xlsx')


class Database:
    """
    Excel-based database using pandas.
    - Reference data from Case Study Data.xlsx (read-only)
    - Extracted orders saved to Extracted_Orders.xlsx (read/write)
    """
    
    # Sheets in reference file (read-only)
    REFERENCE_SHEETS = {
        'products': 'Product',
        'categories': 'ProductCategory',
        'subcategories': 'ProductSubCategory',
        'orders': 'SalesOrderHeader',
        'order_details': 'SalesOrderDetail',
        'territories': 'SalesTerritory',
        'customers': 'Customers',
        'individual_customers': 'IndividualCustomers',
        'store_customers': 'StoreCustomers'
    }
    
    # Sheets in extracted file (read/write)
    EXTRACTED_SHEETS = {
        'extracted_orders': 'ExtractedOrders',
        'extracted_details': 'ExtractedOrderDetails'
    }
    
    def __init__(self, reference_path: str = None, extracted_path: str = None):
        """Initialize database with Excel file paths."""
        self.reference_path = reference_path or REFERENCE_FILE
        self.extracted_path = extracted_path or EXTRACTED_FILE
        self._cache = {}
        self._cache_time = {}
        self._cache_ttl = 60
        
        # Initialize extracted orders file if it doesn't exist
        self._init_extracted_file()
    
    def _init_extracted_file(self):
        """Create the extracted orders Excel file if it doesn't exist."""
        # Create data directory if it doesn't exist
        data_dir = os.path.dirname(self.extracted_path)
        if not os.path.exists(data_dir):
            os.makedirs(data_dir, exist_ok=True)
            logger.info(f"Created data directory: {data_dir}")
        
        if not os.path.exists(self.extracted_path):
            logger.info(f"Creating new extracted orders file: {self.extracted_path}")
            
            # Create empty DataFrames with proper columns
            orders_df = pd.DataFrame(columns=[
                'SalesOrderID', 'SalesOrderNumber', 'OrderDate', 'CustomerID',
                'SubTotal', 'TaxAmt', 'Freight', 'TotalDue', 'Status',
                'InvoiceNumber', 'CompanyName', 'ExtractedAt', 'Confidence', 'Provider'
            ])
            
            details_df = pd.DataFrame(columns=[
                'SalesOrderDetailID', 'SalesOrderID', 'ProductID', 'ProductNumber',
                'ProductName', 'OrderQty', 'UnitPrice', 'LineTotal'
            ])
            
            with pd.ExcelWriter(self.extracted_path, engine='openpyxl') as writer:
                orders_df.to_excel(writer, sheet_name='ExtractedOrders', index=False)
                details_df.to_excel(writer, sheet_name='ExtractedOrderDetails', index=False)
            
            logger.info("Created extracted orders file with empty sheets")
    
    def _get_reference_sheet(self, sheet_key: str, force_refresh: bool = False) -> pd.DataFrame:
        """Get a sheet from the reference file (Case Study Data.xlsx)."""
        cache_key = f"ref_{sheet_key}"
        now = datetime.now().timestamp()
        
        if not force_refresh and cache_key in self._cache:
            if now - self._cache_time.get(cache_key, 0) < self._cache_ttl:
                return self._cache[cache_key]
        
        sheet_name = self.REFERENCE_SHEETS.get(sheet_key)
        if not sheet_name:
            raise ValueError(f"Unknown reference sheet key: {sheet_key}")
        
        logger.info(f"Loading reference sheet '{sheet_name}'")
        df = pd.read_excel(self.reference_path, sheet_name=sheet_name)
        
        self._cache[cache_key] = df
        self._cache_time[cache_key] = now
        
        return df
    
    def _get_extracted_sheet(self, sheet_key: str, force_refresh: bool = False) -> pd.DataFrame:
        """Get a sheet from the extracted orders file."""
        cache_key = f"ext_{sheet_key}"
        now = datetime.now().timestamp()
        
        if not force_refresh and cache_key in self._cache:
            if now - self._cache_time.get(cache_key, 0) < self._cache_ttl:
                return self._cache[cache_key]
        
        sheet_name = self.EXTRACTED_SHEETS.get(sheet_key)
        if not sheet_name:
            raise ValueError(f"Unknown extracted sheet key: {sheet_key}")
        
        logger.info(f"Loading extracted sheet '{sheet_name}'")
        df = pd.read_excel(self.extracted_path, sheet_name=sheet_name)
        
        self._cache[cache_key] = df
        self._cache_time[cache_key] = now
        
        return df
    
    def clear_cache(self):
        """Clear all cached data."""
        self._cache.clear()
        self._cache_time.clear()
    
    def _sanitize_for_json(self, df: pd.DataFrame) -> List[Dict]:
        """
        Convert DataFrame to list of dicts, properly handling NaT and NaN values.
        This prevents JSON serialization errors with datetime NaT values.
        """
        import numpy as np
        
        # Make a copy to avoid modifying original
        df = df.copy()
        
        # Convert datetime columns to string to avoid NaT serialization issues
        for col in df.columns:
            if pd.api.types.is_datetime64_any_dtype(df[col]):
                df[col] = df[col].apply(lambda x: x.isoformat() if pd.notna(x) else None)
        
        # Convert to records
        records = df.to_dict('records')
        
        # Replace NaN/NaT with None in each record
        cleaned_records = []
        for record in records:
            cleaned = {}
            for key, value in record.items():
                if pd.isna(value) or (isinstance(value, float) and np.isnan(value)):
                    cleaned[key] = None
                else:
                    cleaned[key] = value
            cleaned_records.append(cleaned)
        
        return cleaned_records
    
    # =========================================================================
    # Read Operations (from both files)
    # =========================================================================
    
    def get_orders(self, page: int = 1, per_page: int = 20, 
                   customer_id: int = None, source: str = 'extracted') -> tuple[List[Dict], int]:
        """
        Get sales orders with pagination.
        
        Args:
            page: Page number (1-indexed)
            per_page: Items per page
            customer_id: Filter by customer ID
            source: 'reference', 'extracted', or 'all' (default: 'extracted')
        """
        dfs = []
        
        if source in ('reference', 'all'):
            ref_df = self._get_reference_sheet('orders').copy()
            ref_df['Source'] = 'reference'
            dfs.append(ref_df)
        
        if source in ('extracted', 'all'):
            ext_df = self._get_extracted_sheet('extracted_orders').copy()
            ext_df['Source'] = 'extracted'
            dfs.append(ext_df)
        
        if not dfs:
            return [], 0
        
        df = pd.concat(dfs, ignore_index=True)
        
        # Apply filters
        if customer_id:
            df = df[df['CustomerID'] == customer_id]
        
        total = len(df)
        
        # Sort by SalesOrderID descending (newest first)
        df = df.sort_values('SalesOrderID', ascending=False)
        
        # Pagination
        start = (page - 1) * per_page
        end = start + per_page
        page_df = df.iloc[start:end]
        
        orders = self._sanitize_for_json(page_df.copy())
        
        return orders, total
    
    def get_order_details(self, sales_order_id: int) -> List[Dict]:
        """Get order details for a specific order."""
        # Check extracted first
        ext_df = self._get_extracted_sheet('extracted_details')
        ext_filtered = ext_df[ext_df['SalesOrderID'] == sales_order_id]
        if not ext_filtered.empty:
            return self._sanitize_for_json(ext_filtered.copy())
        
        # Fall back to reference
        ref_df = self._get_reference_sheet('order_details')
        ref_filtered = ref_df[ref_df['SalesOrderID'] == sales_order_id]
        return self._sanitize_for_json(ref_filtered.copy())
    
    def get_products(self, page: int = 1, per_page: int = 50) -> tuple[List[Dict], int]:
        """Get products with pagination."""
        df = self._get_reference_sheet('products')
        total = len(df)
        
        start = (page - 1) * per_page
        end = start + per_page
        page_df = df.iloc[start:end]
        
        products = page_df.where(pd.notnull(page_df), None).to_dict('records')
        return products, total
    
    def get_product_by_number(self, product_number: str) -> Optional[Dict]:
        """Find a product by its ProductNumber."""
        df = self._get_reference_sheet('products')
        match = df[df['ProductNumber'] == product_number]
        if match.empty:
            return None
        return match.iloc[0].where(pd.notnull(match.iloc[0]), None).to_dict()
    
    def get_customer(self, customer_id: int) -> Optional[Dict]:
        """Get customer by ID."""
        df = self._get_reference_sheet('customers')
        match = df[df['CustomerID'] == customer_id]
        if match.empty:
            return None
        return match.iloc[0].where(pd.notnull(match.iloc[0]), None).to_dict()
    
    def search_customers(self, query: str, limit: int = 10) -> List[Dict]:
        """Search customers by name or account number."""
        individual_df = self._get_reference_sheet('individual_customers')
        store_df = self._get_reference_sheet('store_customers')
        
        results = []
        
        # Search individual customers
        mask = (
            individual_df['FirstName'].str.contains(query, case=False, na=False) |
            individual_df['LastName'].str.contains(query, case=False, na=False)
        )
        matches = individual_df[mask].head(limit)
        for _, row in matches.iterrows():
            results.append({
                'type': 'individual',
                'name': f"{row['FirstName']} {row['LastName']}",
                'business_entity_id': row['BusinessEntityID']
            })
        
        # Search store customers
        mask = store_df['Name'].str.contains(query, case=False, na=False)
        matches = store_df[mask].head(limit - len(results))
        for _, row in matches.iterrows():
            results.append({
                'type': 'store',
                'name': row['Name'],
                'business_entity_id': row['BusinessEntityID']
            })
        
        return results[:limit]
    
    # =========================================================================
    # Write Operations (to Extracted_Orders.xlsx only)
    # =========================================================================
    
    def add_order(self, order_data: Dict) -> int:
        """
        Add a new order to Extracted_Orders.xlsx.
        
        Args:
            order_data: Order data dict
        
        Returns:
            New SalesOrderID
        """
        # Get max ID from both files
        ref_df = self._get_reference_sheet('orders')
        ext_df = self._get_extracted_sheet('extracted_orders', force_refresh=True)
        
        ref_max = int(ref_df['SalesOrderID'].max()) if not ref_df.empty else 0
        ext_max = int(ext_df['SalesOrderID'].max()) if not ext_df.empty and not ext_df['SalesOrderID'].isna().all() else 0
        
        new_id = max(ref_max, ext_max) + 1
        order_data['SalesOrderID'] = new_id
        
        # Generate SalesOrderNumber
        if 'SalesOrderNumber' not in order_data:
            order_data['SalesOrderNumber'] = f"EXT-{new_id}"
        
        # Add extraction metadata
        order_data['ExtractedAt'] = datetime.now().isoformat()
        
        # Add new row
        new_df = pd.concat([ext_df, pd.DataFrame([order_data])], ignore_index=True)
        
        # Save to extracted file
        self._save_extracted_sheet('extracted_orders', new_df)
        
        logger.info(f"Added order {new_id} to Extracted_Orders.xlsx")
        return new_id
    
    def add_order_details(self, order_id: int, line_items: List[Dict]) -> List[int]:
        """
        Add order details to Extracted_Orders.xlsx.
        
        Args:
            order_id: The SalesOrderID
            line_items: List of line item dicts
        
        Returns:
            List of new SalesOrderDetailIDs
        """
        # Get max detail ID from both files
        ref_df = self._get_reference_sheet('order_details')
        ext_df = self._get_extracted_sheet('extracted_details', force_refresh=True)
        
        ref_max = int(ref_df['SalesOrderDetailID'].max()) if not ref_df.empty else 0
        ext_max = int(ext_df['SalesOrderDetailID'].max()) if not ext_df.empty and not ext_df['SalesOrderDetailID'].isna().all() else 0
        
        max_id = max(ref_max, ext_max)
        new_ids = []
        
        new_rows = []
        for item in line_items:
            max_id += 1
            item['SalesOrderID'] = order_id
            item['SalesOrderDetailID'] = max_id
            new_rows.append(item)
            new_ids.append(max_id)
        
        new_df = pd.concat([ext_df, pd.DataFrame(new_rows)], ignore_index=True)
        
        self._save_extracted_sheet('extracted_details', new_df)
        
        logger.info(f"Added {len(new_ids)} line items for order {order_id}")
        return new_ids
    
    def _save_extracted_sheet(self, sheet_key: str, df: pd.DataFrame):
        """Save a DataFrame to the extracted orders file."""
        # Load both sheets
        orders_df = self._get_extracted_sheet('extracted_orders') if sheet_key != 'extracted_orders' else df
        details_df = self._get_extracted_sheet('extracted_details') if sheet_key != 'extracted_details' else df
        
        # Write both sheets
        with pd.ExcelWriter(self.extracted_path, engine='openpyxl') as writer:
            orders_df.to_excel(writer, sheet_name='ExtractedOrders', index=False)
            details_df.to_excel(writer, sheet_name='ExtractedOrderDetails', index=False)
        
        # Update cache
        self._cache[f"ext_{sheet_key}"] = df
        self._cache_time[f"ext_{sheet_key}"] = datetime.now().timestamp()
        
        logger.info(f"Saved to Extracted_Orders.xlsx")
    
    # =========================================================================
    # Statistics
    # =========================================================================
    
    def get_stats(self, extracted_only: bool = False) -> Dict:
        """Get database statistics.
        
        Args:
            extracted_only: If True, return only extracted data counts
        """
        ref_orders = len(self._get_reference_sheet('orders'))
        ext_orders = len(self._get_extracted_sheet('extracted_orders'))
        ref_details = len(self._get_reference_sheet('order_details'))
        ext_details = len(self._get_extracted_sheet('extracted_details'))
        
        if extracted_only:
            return {
                'orders': ext_orders,
                'order_details': ext_details,
                'products': 0,
                'customers': 0,
                'reference_file': self.reference_path,
                'extracted_file': self.extracted_path,
                'reference_exists': os.path.exists(self.reference_path),
                'extracted_exists': os.path.exists(self.extracted_path)
            }
        
        return {
            'orders': ref_orders + ext_orders,
            'reference_orders': ref_orders,
            'extracted_orders': ext_orders,
            'order_details': ref_details + ext_details,
            'extracted_order_details': ext_details,
            'products': len(self._get_reference_sheet('products')),
            'customers': len(self._get_reference_sheet('customers')),
            'reference_file': self.reference_path,
            'extracted_file': self.extracted_path,
            'reference_exists': os.path.exists(self.reference_path),
            'extracted_exists': os.path.exists(self.extracted_path)
        }
    
    def get_extracted_orders(self, page: int = 1, per_page: int = 20) -> tuple[List[Dict], int]:
        """Get only extracted orders (for demo purposes)."""
        df = self._get_extracted_sheet('extracted_orders')
        total = len(df)
        
        df = df.sort_values('SalesOrderID', ascending=False)
        
        start = (page - 1) * per_page
        end = start + per_page
        page_df = df.iloc[start:end]
        
        orders = page_df.where(pd.notnull(page_df), None).to_dict('records')
        return orders, total


# Global database instance
db = Database()
