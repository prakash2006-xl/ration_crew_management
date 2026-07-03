from flask import Blueprint, request, jsonify
from app.models.feed_request import FeedRequest
from app.models.shop import Shop
from app.models.system_log import SystemLog
from app.extensions import db
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta

feed_bp = Blueprint('feed', __name__)

@feed_bp.route('/request/<int:shop_id>', methods=['POST'])
@jwt_required()
def request_feed(shop_id):
    current_user = get_jwt_identity()
    user_id = current_user['id']
    
    # 1. Verify shop exists
    shop = Shop.query.get_or_404(shop_id)
    
    # 2. Verify Working Hours (8 AM - 8 PM)
    local_now = datetime.now().time()
    if not (shop.working_hours_start <= local_now <= shop.working_hours_end):
        return jsonify({"message": "Streaming Disabled: Shop is closed"}), 403

    # 3. Check Cooldown (15 minutes between requests)
    last_request = FeedRequest.query.filter_by(user_id=user_id)\
        .order_by(FeedRequest.requested_at.desc()).first()
        
    if last_request:
        cooldown_end = last_request.requested_at + timedelta(minutes=15)
        # Convert requested_at/now comparison safely (assume same timezone context for simple demo)
        if datetime.utcnow() < cooldown_end:
            time_left = int((cooldown_end - datetime.utcnow()).total_seconds() / 60)
            return jsonify({"message": f"Cooldown active. Please wait {time_left} more minutes."}), 429

    # 4. Check Daily Limit (Max 10 requests per day)
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    today_requests_count = FeedRequest.query.filter(
        FeedRequest.user_id == user_id,
        FeedRequest.requested_at >= today_start
    ).count()
    
    if today_requests_count >= 10:
        return jsonify({"message": "Daily limit reached. Max 10 requests per day."}), 429

    # 5. Approve request and set expiration
    expires_at = datetime.utcnow() + timedelta(minutes=1)
    new_request = FeedRequest(
        user_id=user_id,
        shop_id=shop_id,
        expires_at=expires_at
    )
    
    db.session.add(new_request)
    
    # Log Action
    SystemLog.log(
        action="LIVE_FEED_REQUESTED",
        details=f"User {user_id} requested feed for shop {shop_id}",
        user_id=user_id
    )
    
    try:
        db.session.commit()
        # Mock stream URL (in production this would link to blurred WebRTC/RTSP stream)
        mock_stream_url = f"http://localhost:5000/api/feed/stream/{new_request.id}"
        return jsonify({
            "message": "Stream approved",
            "stream_url": mock_stream_url,
            "expires_at": expires_at.isoformat(),
            "duration_seconds": 60
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": "Database error", "error": str(e)}), 500
