from app.extensions import db
from datetime import datetime

class FeedRequest(db.Model):
    __tablename__ = 'feed_requests'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    shop_id = db.Column(db.Integer, db.ForeignKey('shops.id', ondelete='CASCADE'), nullable=False)
    requested_at = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime, nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'shop_id': self.shop_id,
            'requested_at': self.requested_at.isoformat() if self.requested_at else None,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None
        }
