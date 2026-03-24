frappe.ui.form.on('Purchase Order', {
    refresh(frm) {
        setTimeout(()=>{
            if (frm.is_new()){
                frm.set_value('billing_address', '');
                frm.set_value('shipping_address', '');
            }
        },3000)
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
        frm.fields_dict['billing_address'].get_query = () => {
            console.log("asdfasdf");
            return {
                query: 'a2z_core_erp.a2z_core_erp.overrides.purchase_order.get_company_address',
                filters: {
                    company: frm.doc.company
                }
            };
        };
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
    }
});


const blank_customer_project = (frm) => {
    frm.doc.items.forEach((row) => {
        frappe.model.set_value(row.doctype, row.name, 'customer_project', '');
        frappe.model.set_value(row.doctype, row.name, 'operating_personnel', '');
        frappe.model.set_value(row.doctype, row.name, 'client_group', '');
        frappe.model.set_value(row.doctype, row.name, 'zone', '');

    });
    frm.refresh_field('items');
};