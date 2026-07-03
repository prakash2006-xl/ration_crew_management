from flask import Blueprint, request, jsonify
from app.models.shop import Shop
from app.extensions import db
from app.utils.decorators import role_required
from flask_jwt_extended import jwt_required
from app.models.crowd_history import CrowdHistory
from datetime import datetime
from app.services.notification_service import NotificationService

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

# Helper to determine crowd level
def calculate_crowd_level(count):
    if count <= 5:
        return 'Low'
    elif count <= 15:
        return 'Medium'
    return 'High'

@shops_bp.route('/<int:shop_id>/crowd', methods=['POST'])
def update_crowd(shop_id):
    """POST crowd update from camera detector script. Strictly logs counts, NO identity stored."""
    shop = Shop.query.get_or_404(shop_id)
    data = request.get_json() or {}
    
    if 'people_count' not in data:
        return jsonify({"message": "people_count is required"}), 400
        
    people_count = int(data['people_count'])
    
    # Verify working hours (8 AM - 8 PM)
    now = datetime.utcnow().time() # Use UTC or simple Server Local Time
    # Get server local time
    local_now = datetime.now().time()
    
    if not (shop.working_hours_start <= local_now <= shop.working_hours_end):
        return jsonify({"message": "Monitoring Disabled: Outside working hours"}), 403

    crowd_level = calculate_crowd_level(people_count)
    
    # 1. Update cache on Shop
    shop.current_people_count = people_count
    shop.current_crowd_level = crowd_level
    
    # 2. Insert into History
    history_entry = CrowdHistory(
        shop_id=shop_id,
        people_count=people_count,
        crowd_level=crowd_level
    )
    db.session.add(history_entry)
    
    try:
        db.session.commit()
        
        # Trigger notification if crowd level drops to Low
        try:
            # Only trigger if it wasn't already Low (optional but good practice)
            # For simplicity, trigger on any drop to Low
            NotificationService.trigger_crowd_alert(shop_id, shop.name, crowd_level)
        except Exception as e:
            print(f"Error triggering crowd notification: {e}")

        return jsonify({
            "message": "Crowd updated successfully",
            "people_count": people_count,
            "crowd_level": crowd_level
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": "Error updating database", "error": str(e)}), 500

@shops_bp.route('/<int:shop_id>/crowd/live', methods=['GET'])
@jwt_required()
def get_live_crowd(shop_id):
    """Fetch live crowd metrics for the specific shop"""
    shop = Shop.query.get_or_404(shop_id)
    
    local_now = datetime.now().time()
    is_active = shop.working_hours_start <= local_now <= shop.working_hours_end
    
    if not is_active:
        return jsonify({
            "shop_id": shop_id,
            "people_count": 0,
            "crowd_level": "Low",
            "status": "Monitoring Disabled / Shop Closed"
        }), 200
        
    return jsonify({
        "shop_id": shop_id,
        "people_count": shop.current_people_count,
        "crowd_level": shop.current_crowd_level,
        "status": "Active"
    }), 200
