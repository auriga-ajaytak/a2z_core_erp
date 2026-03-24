import frappe
import json

@frappe.whitelist()
def get_company_address(doctype, txt, searchfield, start, page_len, filters):
    if isinstance(filters, str):
        filters = json.loads(filters)
    
    company = filters.get("company")
    print(company)
    
    return frappe.db.sql("""
        SELECT 
            addr.name, 
            addr.address_line1,
            addr.custom_custom_state,
            addr.country,
            addr.gstin,
            addr.city
        FROM 
            `tabAddress` addr
        WHERE 
            (SELECT COUNT(*) FROM `tabDynamic Link` dl WHERE dl.parent = addr.name) = 1
            AND EXISTS (
                SELECT 1 FROM `tabDynamic Link` dl
                WHERE 
                    dl.parent = addr.name
                    AND dl.link_doctype = 'Company'
                    AND dl.link_name = %(company)s
            )
            AND (addr.name LIKE %(txt)s OR addr.address_line1 LIKE %(txt)s)
        LIMIT %(page_len)s OFFSET %(start)s
    """, {
        "company": company,
        "txt": f"%{txt}%",
        "page_len": page_len,
        "start": start
    })