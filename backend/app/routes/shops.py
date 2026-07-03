from flask import Blueprint, request, jsonify
from app.models.shop import Shop
from app.extensions import db
from app.utils.decorators import role_required
from flask_jwt_extended import jwt_required

shops_bp = Blueprint('shops', __name__)

@shops_bp.route('/', methods=['GET'])
@jwt_required()
def get_shops():
    shops = Shop.query.all()
    return jsonify({"shops": [shop.to_dict() for shop in shops]}), 200

@shops_bp.route('/<int:shop_id>', methods=['GET'])
@jwt_required()
def get_shop(shop_id):
    shop = Shop.query.get_or_404(shop_id)
    return jsonify({"shop": shop.to_dict()}), 200

@shops_bp.route('/', methods=['POST'])
@jwt_required()
@role_required('state_admin', 'district_admin')
def create_shop():
    data = request.get_json()
    new_shop = Shop(
        name=data.get('name'),
        district=data.get('district'),
        area=data.get('area'),
        address=data.get('address')
    )
    db.session.add(new_shop)
    db.session.commit()
    return jsonify({"message": "Shop created", "shop": new_shop.to_dict()}), 201

@shops_bp.route('/<int:shop_id>', methods=['PUT'])
@jwt_required()
@role_required('state_admin', 'district_admin')
def update_shop(shop_id):
    shop = Shop.query.get_or_404(shop_id)
    data = request.get_json()
    
    if 'name' in data: shop.name = data['name']
    if 'district' in data: shop.district = data['district']
    if 'area' in data: shop.area = data['area']
    if 'address' in data: shop.address = data['address']
    if 'camera_status' in data: shop.camera_status = data['camera_status']
    
    db.session.commit()
    return jsonify({"message": "Shop updated", "shop": shop.to_dict()}), 200
