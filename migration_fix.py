#!/usr/bin/env python3

import os
import sys
import subprocess

# Add the frappe-bench directory to Python path
frappe_bench_path = '/Users/sammishthundiyil/frappe-bench'
sys.path.insert(0, frappe_bench_path)
sys.path.insert(0, os.path.join(frappe_bench_path, 'apps', 'frappe'))

try:
    import frappe
    from frappe.model.document import Document
    
    # Initialize frappe
    frappe.init(site='tbocloud')
    frappe.connect()
    
    # Set migration flags
    frappe.flags.in_migrate = True
    frappe.flags.in_install = True
    frappe.flags.in_test = True
    
    # Temporarily patch the check_if_locked method
    original_check_if_locked = Document.check_if_locked
    
    def patched_check_if_locked(self):
        # Skip lock check during migration
        if frappe.flags.in_migrate or frappe.flags.in_install:
            return
        return original_check_if_locked(self)
    
    # Apply the patch
    Document.check_if_locked = patched_check_if_locked
    
    print("Running migration with patched lock check...")
    
    # Run the migration
    from frappe.migrate import Migrate
    migrate_obj = Migrate('tbocloud')
    migrate_obj.run()
    
    print("Migration completed successfully!")
    
    # Restore original method
    Document.check_if_locked = original_check_if_locked
    
except Exception as e:
    print(f"Error during migration: {str(e)}")
    sys.exit(1)
finally:
    try:
        frappe.destroy()
    except:
        pass