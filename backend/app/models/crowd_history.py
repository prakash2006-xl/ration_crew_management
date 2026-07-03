from app.extensions import db
from datetime import datetime

class CrowdHistory(db.Model):
    __tablename__ = 'crowd_history'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    shop_id = db.Column(db.Integer, db.ForeignKey('shops.id', ondelete='CASCADE'), nullable=False)
    people_count = db.Column(db.Integer, nullable=False)
    crowd_level = db.Column(db.Enum('Low', 'Medium', 'High'), nullable=False)
    recorded_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'shop_id': self.shop_id,
            'people_count': self.people_count,
            'crowd_level': self.crowd_level,
            'recorded_at': self.recorded_at.isoformat() if self.recorded_at else None
        }
