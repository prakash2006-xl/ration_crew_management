from app.extensions import db
from datetime import datetime

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    role = db.Column(db.Enum('citizen', 'staff', 'district_admin', 'state_admin'), nullable=False)
    full_name = db.Column(db.String(100), nullable=False)
    phone_number = db.Column(db.String(15), unique=True, nullable=False)
    ration_card = db.Column(db.String(20), unique=True, nullable=True)
    password_hash = db.Column(db.String(255), nullable=False)
    district = db.Column(db.String(50), nullable=False)
    area = db.Column(db.String(100), nullable=False)
    assigned_shop = db.Column(db.Integer, db.ForeignKey('shops.id', ondelete='SET NULL'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'role': self.role,
            'full_name': self.full_name,
            'phone_number': self.phone_number,
            'ration_card': self.ration_card,
            'district': self.district,
            'area': self.area,
            'assigned_shop': self.assigned_shop,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
