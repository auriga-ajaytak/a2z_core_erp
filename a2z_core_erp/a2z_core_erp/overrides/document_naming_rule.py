import frappe
from frappe.core.doctype.document_naming_rule.document_naming_rule import DocumentNamingRule
from frappe.model.naming import parse_naming_series
from frappe.utils.data import evaluate_filters


class CustomDocumentNamingRule(DocumentNamingRule):

    def apply(self, doc):
        if self.conditions:
            if not evaluate_filters(
                doc, [(self.document_type, d.field, d.condition, d.value) for d in self.conditions]
            ):
                return

        naming_series = parse_naming_series(self.prefix, doc=doc)

        if self.custom_use_individual_counters:
            prefix = self.get_individual_counter_prefix(doc, naming_series)
            counter = self.get_individual_counter(prefix)
        else:
            counter = frappe.db.get_value(self.doctype, self.name, "counter", for_update=True) or 0
            frappe.db.set_value(self.doctype, self.name, "counter", counter + 1)

        doc.name = naming_series + ("%0" + str(self.prefix_digits) + "d") % (counter + 1)

    def get_individual_counter_prefix(self, doc, naming_series):
        """
        Look for a doctype-specific prefix override method.
        Convention: get_<scrubbed_doctype>_prefix(doc, naming_series)
        If none exists, use the resolved naming_series as the counter key.
        """
        method = getattr(self, f"get_{frappe.scrub(doc.doctype)}_prefix", None)
        return method(doc, naming_series) if callable(method) else naming_series

    def get_individual_counter(self, prefix):
        """
        Fetch or initialize the counter for a given prefix from the child table.
        Uses SELECT FOR UPDATE to prevent race conditions on concurrent saves.
        """
        counter_entry = frappe.get_value(
            "Document Naming Rule Counter",
            {
                "prefix": prefix,
                "parent": self.name,
                "parentfield": "custom_document_naming_counters",
                "parenttype": "Document Naming Rule",
            },
            ["name", "counter"],
            as_dict=True,
            for_update=True,
        )

        if counter_entry:
            counter = counter_entry["counter"]
            frappe.db.set_value(
                "Document Naming Rule Counter",
                counter_entry["name"],
                "counter",
                counter + 1,
            )
        else:
            counter = 0
            frappe.get_doc({
                "doctype": "Document Naming Rule Counter",
                "parent": self.name,
                "parentfield": "custom_document_naming_counters",
                "parenttype": "Document Naming Rule",
                "prefix": prefix,
                "counter": counter + 1,
            }).insert(ignore_permissions=True)

        return counter