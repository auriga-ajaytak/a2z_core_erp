frappe.ui.form.on('Payment Entry', {
    party(frm) {
        if (frm.doc.party && frm.doc.party_type === "Customer") {
            frm.set_value("customer_project",frm.doc.party);
        } else {
            frm.set_value("customer_project","");
        }
    }
});