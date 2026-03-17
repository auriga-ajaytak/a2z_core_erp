frappe.ui.form.on('Address', {
    custom_custom_state(frm) {
        frm.set_value('state', frm.doc.custom_custom_state);
    }
});