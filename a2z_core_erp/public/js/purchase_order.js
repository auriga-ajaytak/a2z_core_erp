function set_billing_address_query(frm) {
    frm.fields_dict['billing_address'].get_query = () => {
        return {
            query: 'a2z_core_erp.a2z_core_erp.overrides.purchase_order.get_company_address',
            filters: {
                company: frm.doc.company
            }
        };
    };
}

function blank_customer_project(frm) {
    frm.doc.items.forEach((row) => {
        frappe.model.set_value(row.doctype, row.name, 'customer_project', '');
        frappe.model.set_value(row.doctype, row.name, 'operating_personnel', '');
        frappe.model.set_value(row.doctype, row.name, 'client_group', '');
        frappe.model.set_value(row.doctype, row.name, 'zone', '');
    });
    frm.refresh_field('items');
}

function set_tax_category_based_on_address(frm) {
    if (frm.doc.supplier_address && frm.doc.billing_address) {
        frappe.call({
            method: 'a2z_core_erp.a2z_core_erp.utils.get_tax_category_for_client',
            args: {
                address_1: frm.doc.supplier_address,
                address_2: frm.doc.billing_address,
                is_return: 0
            },
            callback: (r) => {
                if (r.message && frm.doc.tax_category !== r.message) {
                    frm.set_value('tax_category', r.message);
                }
            }
        });
    }
}

frappe.ui.form.on('Purchase Order', {
    onload(frm) {
        frm._user_set_billing_address = false;
        set_billing_address_query(frm);

        if (frm.is_new()) {
            setTimeout(() => {
                frm.set_value('billing_address', '');
                frm.set_value('billing_address_display', '');
                frm.set_value('shipping_address', '');
                frm.set_value('shipping_address_display', '');
            }, 3000);

            frappe.after_ajax(() => {
                const field = frm.get_field('billing_address');
                if (field && field.$input) {
                    field.$input.on('awesomplete-selectcomplete', () => {
                        frm._user_set_billing_address = true;
                    });
                    field.$input.on('change', () => {
                        if (!field.$input.val()) {
                            frm._user_set_billing_address = false;
                        }
                    });
                }
            });
        }
    },

    supplier(frm) {
        if (!frm._user_set_billing_address) {
            setTimeout(() => {
                frm.set_value('billing_address', '');
                frm.set_value('billing_address_display', '');
                frm.set_value('shipping_address', '');
                frm.set_value('shipping_address_display', '');
            }, 3000);
        }
    },

    refresh(frm) {
        if (frm.doc.customer_project) {
            frm.set_query('shipping_address', () => {
                return {
                    filters: {
                        link_doctype: 'Customer',
                        link_name: frm.doc.customer_project
                    }
                };
            });
        } else {
            frm.set_query('shipping_address', () => {
                return {
                    filters: {
                        link_doctype: 'Company',
                        link_name: frm.doc.company
                    }
                };
            });
        }

        if (frm.is_new() && !frm._user_set_billing_address) {
            setTimeout(() => {
                frm.set_value('billing_address', '');
                frm.set_value('billing_address_display', '');
                frm.set_value('shipping_address', '');
                frm.set_value('shipping_address_display', '');
            }, 3000);
        }
    },

    customer_project(frm) {
        if (!frm.doc.customer_project) {
            blank_customer_project(frm);
        }
        frm.set_value('shipping_address', '');
        if (frm.doc.customer_project) {
            frm.set_query('shipping_address', () => {
                return {
                    filters: {
                        link_doctype: 'Customer',
                        link_name: frm.doc.customer_project
                    }
                };
            });
        } else {
            frm.set_query('shipping_address', () => {
                return {
                    filters: {
                        link_doctype: 'Entity',
                        link_name: frm.doc.company
                    }
                };
            });
        }
    },

    company(frm) {
        frm._user_set_billing_address = false;
        set_billing_address_query(frm);
        set_tax_category_based_on_address(frm);
    },

    supplier_address(frm) {
        set_tax_category_based_on_address(frm);
    },

    shipping_address(frm) {
        set_tax_category_based_on_address(frm);
    },

    billing_address(frm) {
        set_tax_category_based_on_address(frm);
    }
});