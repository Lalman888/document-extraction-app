# Invoice Extraction App

A full-stack document extraction application that uses AI to extract structured data from invoice images.

## 🚀 Features

- **AI-Powered Extraction**: Uses GPT-4o Vision with Gemini fallback for 95%+ accuracy
- **Supported Formats**: PNG, JPG, WEBP, PDF invoice images
- **Real-time Progress**: SSE streaming shows actual backend processing steps
- **Edit Before Save**: Inline editing with auto-recalculation of totals
- **SalesOrder Display**: View SalesOrderHeader with expandable SalesOrderDetail rows
- **Excel Database**: Saves extracted orders to `Extracted_Orders.xlsx`
- **Multiple Invoice Support**: Works with various invoice formats and templates

## 📋 Prerequisites

- **Node.js** 18+ (for frontend)
- **Python** 3.10+ (for backend)
- **OpenAI API Key** (required)
- **Google Gemini API Key** (optional, for fallback)

## 🛠️ Installation

### 1. Clone the Repository

```bash
cd test-project
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
source venv/bin/activate  # macOS/Linux
# OR
.\venv\Scripts\activate   # Windows

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env and add your API keys:
# OPENAI_API_KEY=sk-...
# GEMINI_API_KEY=... (optional)
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install
```

## 🏃 Running the Application

### Start Backend (Terminal 1)

```bash
cd backend
source venv/bin/activate
python run.py
```

Backend runs at: http://localhost:5001

### Start Frontend (Terminal 2)

```bash
cd frontend
npm run dev
```

Frontend runs at: http://localhost:3000

## 📁 Project Structure

```
test-project/
├── backend/
│   ├── app/
│   │   ├── __init__.py      # Flask app factory
│   │   ├── routes.py        # API endpoints
│   │   ├── database.py      # Excel operations
│   │   ├── extraction.py    # LLM integration
│   │   ├── errors.py        # Error handling
│   │   └── utils.py         # Helpers
│   ├── run.py               # Entry point
│   └── requirements.txt
├── frontend/
│   ├── src/app/
│   │   ├── page.tsx         # Home page
│   │   ├── upload/page.tsx  # Upload & extraction
│   │   ├── invoices/page.tsx # View orders
│   │   └── adr/page.tsx     # Architecture docs
│   └── package.json
└── data/
    ├── Case Study Data.xlsx  # Reference data (read-only)
    └── Extracted_Orders.xlsx # Extracted orders (auto-created)
```

## 🔌 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/database/stats` | GET | Database statistics |
| `/api/database/orders` | GET | List extracted orders |
| `/api/invoices/upload-stream` | POST | Extract with SSE progress |
| `/api/invoices/save-edited` | POST | Save edited invoice |
| `/api/llm/status` | GET | LLM provider status |

## 📊 Data Flow

```
Invoice Image → Upload API → GPT-4o Vision → JSON → Validation → Edit UI → Excel
```

## 🔧 Configuration

### Environment Variables (.env)

```env
# Required
OPENAI_API_KEY=sk-your-openai-key

# Optional (for fallback)
GEMINI_API_KEY=your-gemini-key

# Server
FLASK_DEBUG=1
FLASK_HOST=0.0.0.0
FLASK_PORT=5001
CORS_ORIGINS=http://localhost:3000
```

### Frontend Environment Variables (.env.local)

```env
# API Base URL (optional, defaults to localhost:5001)
NEXT_PUBLIC_API_URL=http://localhost:5001
```

## 🧪 Testing

### Test Backend Health

```bash
curl http://localhost:5001/api/health
```

### Test Extraction

1. Open http://localhost:3000/upload
2. Upload an invoice image
3. View extracted data in modal
4. Optionally edit and save to database

## 📄 Sample Invoices

Sample invoices are located in `data/`:
- `Sales Invoice.png` - Original sample
- `invoice_template_b.png` - Professional blue design
- `invoice_template_c.png` - Black/white tax invoice

## 📚 Architecture Decision Records

View technical decisions at: http://localhost:3000/adr

Key decisions:
- Next.js + Flask architecture
- Excel as database (no external DB required)
- GPT-4o Vision with Gemini fallback
- SSE for real-time progress updates
- shadcn/ui component library

Also includes **Scaling Strategies** section covering:
- Higher volume handling (queue-based processing)
- Additional document types (POs, receipts, contracts)
- Production database migration (PostgreSQL)
- Cloud deployment (Kubernetes)

## 📝 License

MIT
