from app.extensions import db
from datetime import datetime

class SystemLog(db.Model):
    __tablename__ = 'system_logs'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    action = db.Column(db.String(100), nullable=False)
    details = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'action': self.action,
            'details': self.details,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

    @classmethod
    def log(cls, action, details=None, user_id=None):
        """Helper to create and save a log entry"""
        new_log = cls(user_id=user_id, action=action, details=details)
        db.session.add(new_log)
        try:
            db.session.commit()
        except Exception:
            db.session.rollback()
