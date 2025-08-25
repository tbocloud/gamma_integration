import frappe

def execute():
    """Clear document locks and background job queue to resolve migration issues"""
    try:
        # Clear document locks
        frappe.db.sql("DELETE FROM `tabDocument Lock` WHERE 1=1")
        
        # Clear background job queue that might be stuck
        frappe.db.sql("DELETE FROM `tabRQ Job` WHERE status IN ('queued', 'started') AND job_name LIKE '%update_all_users%'")
        
        # Clear any other stuck background jobs
        frappe.db.sql("DELETE FROM `tabRQ Job` WHERE status = 'queued' AND creation < DATE_SUB(NOW(), INTERVAL 1 HOUR)")
        
        frappe.db.commit()
        print("Document locks and stuck background jobs cleared successfully")
        
    except Exception as e:
        print(f"Error clearing locks: {e}")
        frappe.db.rollback()
        raise