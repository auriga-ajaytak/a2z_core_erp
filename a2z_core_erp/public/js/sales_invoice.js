function set_customer_query(frm) {
    frm.set_query('customer', () => {
        return {
            filters: {
                "custom_entity": frm.doc.company
            }
        };
    });
}

function set_company_address_query(frm) {
    frm.fields_dict['company_address'].get_query = () => {
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

function set_shipping_address_query(frm) {
    if (frm.doc.customer_project) {
        frm.set_query('shipping_address_name', () => {
            return {
                filters: {
                    link_doctype: 'Customer',
                    link_name: frm.doc.customer_project
                }
            };
        });
    } else {
        frm.set_query('shipping_address_name', () => {
            return {
                filters: {
                    link_doctype: 'Company',
                    link_name: frm.doc.company
                }
            };
        });
    }
}

function set_tax_category_based_on_address(frm) {
    if (frm.doc.customer_address && frm.doc.company_address) {
        frappe.call({
            method: 'a2z_core_erp.a2z_core_erp.utils.get_tax_category_for_client',
            args: {
                address_1: frm.doc.customer_address,
                address_2: frm.doc.company_address,
                is_reverse_charge: frm.doc.is_reverse_charge
            },
            callback: (r) => {
                if (r.message && frm.doc.tax_category !== r.message) {
                    frm.set_value('tax_category', r.message);
                }
            }
        });
    }
}

frappe.ui.form.on('Sales Invoice', {
    onload(frm) {
        frm._user_set_company_address = false;
        set_customer_query(frm);
        set_company_address_query(frm);

        if (frm.is_new()) {
            setTimeout(() => {
                frm.set_value('company_address', '');
                frm.set_value('company_address_display', '');
            }, 3000);

            frappe.after_ajax(() => {
                const field = frm.get_field('company_address');
                if (field && field.$input) {
                    field.$input.on('awesomplete-selectcomplete', () => {
                        frm._user_set_company_address = true;
                    });
                    field.$input.on('change', () => {
                        if (!field.$input.val()) {
                            frm._user_set_company_address = false;
                        }
                    });
                }
            });
        }
    },

    customer(frm) {
        if (!frm._user_set_company_address) {
            setTimeout(() => {
                frm.set_value('company_address', '');
                frm.set_value('company_address_display', '');
            }, 3000);
        }
    },

    refresh(frm) {
        set_shipping_address_query(frm);

        if (frm.is_new() && !frm._user_set_company_address) {
            setTimeout(() => {
                frm.set_value('company_address', '');
                frm.set_value('company_address_display', '');
            }, 3000);
        }
    },

    company(frm) {
        frm._user_set_company_address = false;
        set_customer_query(frm);
        set_company_address_query(frm);
        set_tax_category_based_on_address(frm);
    },

    customer_project(frm) {
        if (!frm.doc.customer_project) {
            blank_customer_project(frm);
        }
        frm.set_value('shipping_address_name', '');

        if (frm.doc.customer_project) {
            frm.set_query('shipping_address_name', () => {
                return {
                    filters: {
                        link_doctype: 'Customer',
                        link_name: frm.doc.customer_project
                    }
                };
            });
        } else {
            frm.set_query('shipping_address_name', () => {
                return {
                    filters: {
                        link_doctype: 'Entity',
                        link_name: frm.doc.company
                    }
                };
            });
        }
    },

    customer_address(frm) {
        set_tax_category_based_on_address(frm);
    },

    company_address(frm) {
        set_tax_category_based_on_address(frm);
    },

    is_reverse_charge(frm) {
        set_tax_category_based_on_address(frm);
    }
});