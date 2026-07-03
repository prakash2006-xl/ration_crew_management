import logging
from app.extensions import db
from app.models.user import User
from app.models.notification import Notification

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("NotificationEngine")

class NotificationService:
    @staticmethod
    def send_sms(phone_number, message):
        """Simulate SMS Gateway Integration (Twilio/Fast2SMS)"""
        # In production, call Twilio/Fast2SMS API here.
        # e.g., client.messages.create(body=message, to=phone_number, ...)
        logger.info(f"[SMS GATEWAY] Sending to {phone_number}: {message}")
        return True

    @staticmethod
    def send_push_notification(fcm_token, title, message):
        """Simulate Firebase Cloud Messaging (FCM)"""
        # In production, call firebase_admin.messaging.send(message)
        logger.info(f"[FCM PUSH] Token {fcm_token} -> Title: {title} | Message: {message}")
        return True

    @classmethod
    def dispatch_alert(cls, user, shop_id, title, message):
        """Evaluate preference and dispatch notification, then log to DB"""
        pref = user.notification_pref
        
        # Dispatch SMS
        if pref in ('sms', 'both') and user.phone_number:
            cls.send_sms(user.phone_number, message)
            notification_sms = Notification(
                user_id=user.id,
                shop_id=shop_id,
                type='sms',
                title=title,
                message=message
            )
            db.session.add(notification_sms)
            
        # Dispatch FCM Push
        if pref in ('push', 'both') and user.fcm_token:
            cls.send_push_notification(user.fcm_token, title, message)
            notification_push = Notification(
                user_id=user.id,
                shop_id=shop_id,
                type='push',
                title=title,
                message=message
            )
            db.session.add(notification_push)

        try:
            db.session.commit()
        except Exception as e:
            logger.error(f"Error logging notification to DB: {e}")
            db.session.rollback()

    @classmethod
    def trigger_morning_stock_alert(cls, shop_id, shop_name, stocks):
        """Trigger alert when morning stock is updated"""
        # Get users mapped to this shop
        users = User.query.filter_by(assigned_shop=shop_id).all()
        if not users:
            return
            
        # Format stock statuses
        stock_statuses = []
        for s in stocks:
            stock_statuses.append(f"{s.item_name}: {s.status}")
            
        title = "Morning Stock Update"
        message = f"{shop_name} Stock Update:\n" + "\n".join(stock_statuses) + "\nGood time to visit."
        
        for user in users:
            cls.dispatch_alert(user, shop_id, title, message)

    @classmethod
    def trigger_crowd_alert(cls, shop_id, shop_name, new_level):
        """Trigger alert when crowd drops to Low"""
        if new_level != 'Low':
            return
            
        users = User.query.filter_by(assigned_shop=shop_id).all()
        if not users:
            return

        title = "Crowd Density Alert"
        message = f"Good News! The crowd at {shop_name} is now LOW. It's a great time to visit."
        
        for user in users:
            cls.dispatch_alert(user, shop_id, title, message)

    @classmethod
    def trigger_critical_stock_alert(cls, shop_id, shop_name, item_name, new_status):
        """Trigger alert for low/out of stock items during distribution"""
        if new_status not in ('Low Stock', 'Out Of Stock'):
            return

        users = User.query.filter_by(assigned_shop=shop_id).all()
        if not users:
            return

        title = "Stock Alert"
        message = f"Alert: {item_name} is now {new_status} at {shop_name}."
        
        for user in users:
            cls.dispatch_alert(user, shop_id, title, message)
