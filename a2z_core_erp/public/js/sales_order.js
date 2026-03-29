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

frappe.ui.form.on('Sales Order', {
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
        if (frm.is_new() && !frm._user_set_company_address) {
            setTimeout(() => {
                frm.set_value('company_address', '');
                frm.set_value('company_address_display', '');
            }, 3000);
        }
    },

    customer_project(frm) {
        if (!frm.doc.customer_project) {
            blank_customer_project(frm);
        }
    },

    company(frm) {
        frm._user_set_company_address = false;
        set_customer_query(frm);
        set_company_address_query(frm);
    },
});
