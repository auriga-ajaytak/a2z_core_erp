import frappe
from frappe import _

def apply_patch():
    # Only patch if india_compliance app is installed
    try:
        from india_compliance.gst_india.utils.transaction_data import GSTTransactionData
    except ImportError:
        return

    # Avoid duplicate patching
    if getattr(GSTTransactionData, "_patched_for_a2z", False):
        return

    # Capture the original method to wrap it
    original_set_transaction_details = GSTTransactionData.set_transaction_details

    def patched_set_transaction_details(self):
        """
        Monkey-patch for india_compliance to override the party name.
        Uses 'custom_billing_name' instead of standard customer name if available.
        """
        if self.doctype == "Sales Invoice":
            billing_name = frappe.db.get_value("Sales Invoice", self.docname, "custom_billing_name")
            if billing_name:
                self.party_name = billing_name
        
        # Call the original method to handle all other data mapping
        return original_set_transaction_details(self)

    # Injected into the class at runtime
    GSTTransactionData.set_transaction_details = patched_set_transaction_details
    GSTTransactionData._patched_for_a2z = True
