from flask import Blueprint, jsonify
from app.models.crowd_history import CrowdHistory
from app.models.stock import Stock
from app.models.shop import Shop
from app.models.system_log import SystemLog
from app.extensions import db
from flask_jwt_extended import jwt_required
from sqlalchemy import func
from datetime import datetime, timedelta

analytics_bp = Blueprint('analytics', __name__)

@analytics_bp.route('/overview/<int:shop_id>', methods=['GET'])
@jwt_required()
def get_analytics_overview(shop_id):
    # Verify shop exists
    Shop.query.get_or_404(shop_id)

    # 1. Peak Hours (Average people count grouped by hour for the last 7 days)
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    
    # We extract the hour from recorded_at and get average people count
    peak_hours_query = db.session.query(
        func.hour(CrowdHistory.recorded_at).label('hour'),
        func.avg(CrowdHistory.people_count).label('avg_people')
    ).filter(
        CrowdHistory.shop_id == shop_id,
        CrowdHistory.recorded_at >= seven_days_ago
    ).group_by(
        func.hour(CrowdHistory.recorded_at)
    ).order_by('hour').all()

    peak_hours = [{"hour": hour, "avg_people": round(float(avg_people), 1)} for hour, avg_people in peak_hours_query]

    # 2. Stock Consumption (Current status of stock)
    stocks = Stock.query.filter_by(shop_id=shop_id).all()
    stock_status = [s.to_dict() for s in stocks]

    # 3. Crowd Density breakdown
    density_breakdown = db.session.query(
        CrowdHistory.crowd_level,
        func.count(CrowdHistory.id).label('count')
    ).filter(
        CrowdHistory.shop_id == shop_id
    ).group_by(
        CrowdHistory.crowd_level
    ).all()
    
    density = {level: count for level, count in density_breakdown}

    # 4. Recent audit logs for this shop
    logs = SystemLog.query.order_by(SystemLog.created_at.desc()).limit(10).all()

    return jsonify({
        "shop_id": shop_id,
        "peak_hours": peak_hours,
        "stock_consumption": stock_status,
        "crowd_density_breakdown": density,
        "system_logs": [log.to_dict() for log in logs]
    }), 200
