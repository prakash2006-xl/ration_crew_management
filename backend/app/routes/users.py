from flask import Blueprint, request, jsonify
from app.models.user import User
from app.models.notification import Notification
from app.extensions import db
from flask_jwt_extended import jwt_required, get_jwt_identity

users_bp = Blueprint('users', __name__)

@users_bp.route('/profile/notifications', methods=['PUT'])
@jwt_required()
def update_notification_prefs():
    current_user = get_jwt_identity()
    user = User.query.get(current_user['id'])
    if not user:
        return jsonify({"message": "User not found"}), 404
        
    data = request.get_json() or {}
    
    if 'notification_pref' in data:
        pref = data['notification_pref']
        if pref not in ('sms', 'push', 'both', 'none'):
            return jsonify({"message": "Invalid preference"}), 400
        user.notification_pref = pref
        
    if 'fcm_token' in data:
        user.fcm_token = data['fcm_token']
        
    try:
        db.session.commit()
        return jsonify({
            "message": "Notification preferences updated successfully",
            "user": user.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": "Error updating preferences", "error": str(e)}), 500

@users_bp.route('/notifications', methods=['GET'])
@jwt_required()
def get_my_notifications():
    current_user = get_jwt_identity()
    notifications = Notification.query.filter_by(user_id=current_user['id']).order_by(Notification.sent_at.desc()).limit(20).all()
    return jsonify({"notifications": [n.to_dict() for n in notifications]}), 200
