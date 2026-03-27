frappe.ui.form.on('Sales Order', {
    onload(frm) {
        set_customer_query(frm);
        setTimeout(()=>{
            if (frm.is_new()){
                frm.set_value('company_address', '');
            }
        },3000)
        frm.fields_dict['company_address'].get_query = () => {
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
    },
    company(frm) {
        set_customer_query(frm);
    },
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

function set_customer_query(frm) {
    frm.set_query('customer', () => {
        return {
            filters: {
                "custom_entity": frm.doc.company
            }
        };
    });
}