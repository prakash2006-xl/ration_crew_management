from flask import Flask
from app.config import Config
from app.extensions import db, bcrypt, jwt, cors

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize extensions
    db.init_app(app)
    bcrypt.init_app(app)
    jwt.init_app(app)
    cors.init_app(app)

    # Register blueprints
    from app.routes.auth import auth_bp
    from app.routes.shops import shops_bp
    from app.routes.stocks import stocks_bp
    from app.routes.users import users_bp
    from app.routes.feed import feed_bp
    from app.routes.analytics import analytics_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(shops_bp, url_prefix='/api/shops')
    app.register_blueprint(stocks_bp, url_prefix='/api/stocks')
    app.register_blueprint(users_bp, url_prefix='/api/users')
    app.register_blueprint(feed_bp, url_prefix='/api/feed')
    app.register_blueprint(analytics_bp, url_prefix='/api/analytics')

    return app
