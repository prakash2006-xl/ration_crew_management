from app.extensions import db
from datetime import datetime

class Stock(db.Model):
    __tablename__ = 'stocks'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    shop_id = db.Column(db.Integer, db.ForeignKey('shops.id', ondelete='CASCADE'), nullable=False)
    item_name = db.Column(db.String(50), nullable=False)
    quantity = db.Column(db.Numeric(10, 2), nullable=False)
    status = db.Column(db.Enum('Available', 'Low Stock', 'Out Of Stock'), nullable=False)
    last_updated = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (db.UniqueConstraint('shop_id', 'item_name', name='unique_shop_item'),)

    def to_dict(self):
        return {
            'id': self.id,
            'shop_id': self.shop_id,
            'item_name': self.item_name,
            'quantity': float(self.quantity),
            'status': self.status,
            'last_updated': self.last_updated.isoformat() if self.last_updated else None
        }

    def to_public_dict(self):
        return {
            'item_name': self.item_name,
            'status': self.status,
            'last_updated': self.last_updated.isoformat() if self.last_updated else None
        }
