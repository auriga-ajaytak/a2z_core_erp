frappe.ui.form.on('Material Request', {
    custom_customer_project(frm) {
        frm.doc.items.forEach((row) => {
            frappe.model.set_value(row.doctype, row.name, 'customer_project', frm.doc.custom_customer_project).then(() => {
                frm.script_manager.trigger('customer_project', row.doctype, row.name);
            });
        });
        frm.refresh_field('items');
    }
});