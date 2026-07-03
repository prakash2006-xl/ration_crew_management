from flask import Blueprint, request, jsonify
from app.models.stock import Stock
from app.models.shop import Shop
from app.extensions import db
from app.utils.decorators import role_required
from flask_jwt_extended import jwt_required, get_jwt_identity

stocks_bp = Blueprint('stocks', __name__)

def determine_status(quantity):
    if quantity <= 0:
        return 'Out Of Stock'
    elif quantity < 20: # threshold for low stock
        return 'Low Stock'
    return 'Available'

@stocks_bp.route('/<int:shop_id>', methods=['GET'])
@jwt_required()
def get_stock(shop_id):
    stocks = Stock.query.filter_by(shop_id=shop_id).all()
    current_user = get_jwt_identity()
    
    # If citizen, only return public info (no exact quantities)
    if current_user.get('role') == 'citizen':
        return jsonify({"stocks": [s.to_public_dict() for s in stocks]}), 200
    
    return jsonify({"stocks": [s.to_dict() for s in stocks]}), 200

@stocks_bp.route('/<int:shop_id>', methods=['POST'])
@jwt_required()
@role_required('staff', 'district_admin', 'state_admin')
def update_stock(shop_id):
    """Staff updates morning stock in bulk"""
    data = request.get_json()
    items = data.get('items', [])
    
    Shop.query.get_or_404(shop_id) # ensure shop exists
    
    updated_stocks = []
    for item in items:
        item_name = item.get('item_name')
        quantity = float(item.get('quantity', 0))
        
        stock = Stock.query.filter_by(shop_id=shop_id, item_name=item_name).first()
        status = determine_status(quantity)
        
        if stock:
            stock.quantity = quantity
            stock.status = status
        else:
            stock = Stock(shop_id=shop_id, item_name=item_name, quantity=quantity, status=status)
            db.session.add(stock)
        
        updated_stocks.append(stock)
        
    db.session.commit()
    return jsonify({"message": "Stock updated", "stocks": [s.to_dict() for s in updated_stocks]}), 200

@stocks_bp.route('/<int:shop_id>/distribute', methods=['PUT'])
@jwt_required()
@role_required('staff')
def distribute_stock(shop_id):
    """Decrease specific item quantity during ration distribution"""
    data = request.get_json()
    item_name = data.get('item_name')
    quantity_used = float(data.get('quantity', 0))
    
    stock = Stock.query.filter_by(shop_id=shop_id, item_name=item_name).first()
    if not stock:
        return jsonify({"message": "Item not found"}), 404
        
    new_quantity = float(stock.quantity) - quantity_used
    if new_quantity < 0:
        new_quantity = 0
        
    stock.quantity = new_quantity
    stock.status = determine_status(new_quantity)
    
    db.session.commit()
    return jsonify({"message": f"Distributed {quantity_used} of {item_name}", "stock": stock.to_dict()}), 200
