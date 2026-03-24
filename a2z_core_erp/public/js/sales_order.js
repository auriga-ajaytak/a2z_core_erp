frappe.ui.form.on('Sales Order', {
    customer_project(frm) {
        if (!frm.doc.customer_project) {
            blank_customer_project(frm);
        }
    }
});


const blank_customer_project = (frm) => {
    console.log("Asdfasdf");
    
    frm.doc.items.forEach((row) => {
        frappe.model.set_value(row.doctype, row.name, 'customer_project', '');
        frappe.model.set_value(row.doctype, row.name, 'operating_personnel', '');
        frappe.model.set_value(row.doctype, row.name, 'client_group', '');
        frappe.model.set_value(row.doctype, row.name, 'zone', '');

    });
    frm.refresh_field('items');
};