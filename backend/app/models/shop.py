from app.extensions import db
from datetime import datetime, time

class Shop(db.Model):
    __tablename__ = 'shops'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(100), nullable=False)
    district = db.Column(db.String(50), nullable=False)
    area = db.Column(db.String(100), nullable=False)
    address = db.Column(db.Text, nullable=True)
    working_hours_start = db.Column(db.Time, default=time(8, 0))
    working_hours_end = db.Column(db.Time, default=time(20, 0))
    camera_status = db.Column(db.Boolean, default=True)
    current_people_count = db.Column(db.Integer, default=0)
    current_crowd_level = db.Column(db.Enum('Low', 'Medium', 'High'), default='Low')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'district': self.district,
            'area': self.area,
            'address': self.address,
            'working_hours_start': str(self.working_hours_start) if self.working_hours_start else None,
            'working_hours_end': str(self.working_hours_end) if self.working_hours_end else None,
            'camera_status': self.camera_status,
            'current_people_count': self.current_people_count,
            'current_crowd_level': self.current_crowd_level,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
