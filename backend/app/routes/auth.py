from flask import Blueprint, request, jsonify
from app.models.user import User
from app.models.shop import Shop
from app.extensions import db, bcrypt
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()

    if not data:
        return jsonify({"message": "No input data provided"}), 400

    phone = data.get('phone_number')
    ration_card = data.get('ration_card')

    if User.query.filter_by(phone_number=phone).first():
        return jsonify({"message": "Phone number already registered"}), 409
    
    if ration_card and User.query.filter_by(ration_card=ration_card).first():
        return jsonify({"message": "Ration card already registered"}), 409

    hashed_pw = bcrypt.generate_password_hash(data.get('password')).decode('utf-8')
    
    # Auto assign shop based on area (simple logic for now)
    area = data.get('area')
    assigned_shop = None
    if area:
        shop = Shop.query.filter_by(area=area).first()
        if shop:
            assigned_shop = shop.id

    new_user = User(
        role=data.get('role', 'citizen'),
        full_name=data.get('full_name'),
        phone_number=phone,
        ration_card=ration_card,
        password_hash=hashed_pw,
        district=data.get('district'),
        area=area,
        assigned_shop=assigned_shop
    )

    try:
        db.session.add(new_user)
        db.session.commit()
        return jsonify({"message": "User registered successfully"}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": "Error registering user", "error": str(e)}), 500


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    
    if not data or not data.get('phone_number') or not data.get('password'):
        return jsonify({"message": "Phone number and password required"}), 400

    user = User.query.filter_by(phone_number=data.get('phone_number')).first()

    if user and bcrypt.check_password_hash(user.password_hash, data.get('password')):
        access_token = create_access_token(identity={'id': user.id, 'role': user.role})
        return jsonify({
            "message": "Login successful",
            "access_token": access_token,
            "user": user.to_dict()
        }), 200

    return jsonify({"message": "Invalid phone number or password"}), 401


@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def profile():
    current_user_identity = get_jwt_identity()
    user = User.query.get(current_user_identity['id'])
    
    if not user:
        return jsonify({"message": "User not found"}), 404
        
    return jsonify({"user": user.to_dict()}), 200
