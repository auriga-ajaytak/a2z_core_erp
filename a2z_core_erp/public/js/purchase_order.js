frappe.ui.form.on('Purchase Order', {
    refresh(frm) {
        setTimeout(()=>{
            frm.set_value('billing_address', '');
            frm.set_value('shipping_address', '');
        },3000)
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
                        link_doctype: 'Company',
                        link_name: frm.doc.company
                    }
                };
            });
        }
    },

    customer_project(frm) {
        console.log("Asdfasdfasdf");
        
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