import re

import frappe
from frappe import _
from frappe.model.naming import make_autoname, revert_series_if_last
from erpnext.accounts.doctype.sales_invoice.sales_invoice import SalesInvoice

A2Z_COMPANY = "A2Z Infraservices Limited"


class CustomSalesInvoice(SalesInvoice):

    def validate(self):
        super().validate()
        if not self.custom_billing_name:
             frappe.throw(_("Please Enter Custom Billing Name (Party Name)"), title=_("Missing Billing Name"))

    def autoname(self):
        if self.amended_from:
            super().autoname()
            return
        if self.company == A2Z_COMPANY:
            self.name = self._get_invoice_series_name()
        else:
            super().autoname()

    def _get_invoice_series_name(self):
        prefix = self._build_series_prefix()
        return make_autoname(prefix, doc=self)

    def after_delete(self):
        """Release the invoice number if this was the last one in its series.

        Frappe rewinds the counter on delete, but locates it through the
        `naming_series` field (delete_doc.update_naming_series). These invoices are
        named by _build_series_prefix() instead, so that lookup finds no counter and
        the number is burnt. Rewind the real counter here.
        """
        if self.amended_from or self.company != A2Z_COMPANY:
            return

        # Take the counter key from the name itself, not from posting_date: the date
        # may have been edited after the invoice was named, which would point the
        # rewind at another month's counter.
        match = re.match(r"^(?P<prefix>.*?)(?P<digits>\d+)$", self.name or "")
        if not match:
            return

        series = "{}.{}".format(match["prefix"], "#" * len(match["digits"]))
        revert_series_if_last(series, self.name, self)

    def _build_series_prefix(self):

        if not self.posting_date:
            frappe.throw(_("Posting Date is mandatory for invoice naming."))

        posting_date = str(self.posting_date)
        year      = int(posting_date[:4])
        month     = posting_date[5:7]
        month_int = int(month)

        fy_short = str(year)[2:4] if month_int < 4 else str(year+1)[2:4]

        company = frappe.get_cached_doc("Company", self.company)

        abbr = (company.custom_company_short_code_for_series or "").strip()
        if not abbr:
            frappe.throw(_(
                "Company abbreviation (Short Code) is not set for {0}. "
                "Please contact the Administrator to update the Short Code."
            ).format(self.company))

        if not self.company_gstin:
            frappe.throw(_(
                "GSTIN is not set or invalid for company {0}. "
                "Please contact the Administrator."
            ).format(self.company))

        state_code = self._get_state_code_for_gstin(self.company_gstin)
        if self.is_return:
            return f"{abbr}{state_code}/{fy_short}/{month}/CN.##"
        else:
            return f"{abbr}{state_code}/{fy_short}/{month}/.####"

    def _get_state_code_for_gstin(self, gstin):

        result = frappe.db.get_value(
            "GST Prefix",
            filters={
                "parenttype": "General Settings",
                "parent"    : "General Settings",
                "gstin"     : gstin,
            },
            fieldname="prefix_for_state_code",
            cache=True
        )

        if not result:
            frappe.throw(_(
                "No state code mapping found for GSTIN {0} in "
                "General Settings. Please add it under "
                "General Settings > GST Prefix."
                "Please contact the Administrator."
            ).format(gstin))

        return (result or "").strip()