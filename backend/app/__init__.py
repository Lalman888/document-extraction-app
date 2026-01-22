import os
from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


def create_app():
    """Application factory pattern for Flask app."""
    app = Flask(__name__)
    
    # Configuration from environment
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key')
    app.config['DEBUG'] = os.getenv('FLASK_DEBUG', '0') == '1'
    app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max upload
    
    # CORS configuration
    cors_origins = os.getenv('CORS_ORIGINS', 'http://localhost:3000')
    CORS(app, origins=cors_origins.split(','))
    
    # Register error handlers
    from app.errors import register_error_handlers
    register_error_handlers(app)
    
    # Register blueprints/routes
    from app.routes import api_bp
    app.register_blueprint(api_bp, url_prefix='/api')
    
    return app
