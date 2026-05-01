function set_tax_category_based_on_address(frm) {
    if (frm.doc.customer_address && frm.doc.company_address) {
        frappe.call({
            method: 'a2z_core_erp.a2z_core_erp.utils.get_tax_category_for_client',
            args: {
                address_1: frm.doc.customer_address,
                address_2: frm.doc.company_address,
                is_return: frm.doc.is_return
            },
            callback: (r) => {
                if (r.message && frm.doc.tax_category !== r.message) {
                    frm.set_value('tax_category', r.message);
                }
            }
        });
    }
}

frappe.ui.form.on('Delivery Note', {
    customer_address(frm) {
        set_tax_category_based_on_address(frm);
    },

    company_address(frm) {
        set_tax_category_based_on_address(frm);
    },

    is_return(frm) {
        set_tax_category_based_on_address(frm);
    }
});
