import frappe
from frappe import _

def calculate_tax_category(address_1, address_2, is_return=False):
    """
    Compares the GST states of two addresses and returns the tax category.
    """
    if not address_1 or not address_2:
        return ""

    state_1 = frappe.db.get_value("Address", address_1, "gst_state")
    state_2 = frappe.db.get_value("Address", address_2, "gst_state")

    if state_1 and state_2:
        is_match = (state_1 == state_2)
        if is_return:
            return "Reverse Charge In-State" if is_match else "Reverse Charge Out-State"
        else:
            return "In-State" if is_match else "Out-State"
    
    return ""

@frappe.whitelist()
def get_tax_category_for_client(address_1, address_2, is_return=False):
    """
    Whitelisted function for client-side JS triggers.
    """
    # handle strings from JS call
    if isinstance(is_return, str):
        is_return = is_return.lower() in ["true", "1"]
    
    return calculate_tax_category(address_1, address_2, is_return)
