import re

import frappe
from frappe import _
from frappe.model.naming import make_autoname
from erpnext.accounts.doctype.sales_invoice.sales_invoice import SalesInvoice

A2Z_COMPANY = "A2Z Infraservices Limited"


class CustomSalesInvoice(SalesInvoice):

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
        """Point the series counter back at the highest invoice that still exists.

        Frappe rewinds the counter on delete, but locates it through the
        `naming_series` field (delete_doc.update_naming_series). These invoices are
        named by _build_series_prefix() instead, so that lookup finds no counter and
        the number is burnt.

        Frappe's own rewind also only steps back by one, and only when the deleted
        number happens to be the current counter. Deleting 0005 and then 0006 would
        leave 0005 stranded forever. Resyncing to the highest survivor closes those
        trailing gaps instead.
        """
        if self.amended_from or self.company != A2Z_COMPANY:
            return

        # Take the counter key from the name itself, not from posting_date: the date
        # may have been edited after the invoice was named, which would point the
        # resync at another month's counter.
        match = re.match(r"^(?P<prefix>.*?)(?P<digits>\d+)$", self.name or "")
        if not match:
            return

        self._resync_series_counter(match["prefix"], len(match["digits"]))

    def _resync_series_counter(self, prefix, width):
        """Set the counter for `prefix` to the highest invoice still using it.

        By the time after_delete runs the invoice row is already gone
        (delete_doc: update_naming_series -> delete_from_table -> after_delete),
        so the surviving maximum is exactly what the counter should hold.
        """
        if not prefix:
            return

        # Lock the counter row FIRST, matching the order getseries() uses, so a
        # concurrent create cannot slip between our read and our write. Bail out if
        # no counter exists - nothing was ever issued for this prefix.
        if not frappe.db.sql(
            "SELECT `current` FROM `tabSeries` WHERE `name` = %s FOR UPDATE", prefix
        ):
            return

        # The regular series and the credit-note series share a string prefix
        # ("A2Z07/27/09/" vs "A2Z07/27/09/CN"), so a bare prefix match would let one
        # corrupt the other's counter. Restrict to names of exactly the right length,
        # then confirm the tail is all digits - which also drops amended names
        # ("...0005-1") and credit notes ("...CN01") from the plain series.
        escaped = prefix.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
        rows = frappe.db.sql(
            # FOR UPDATE forces a current read; a plain SELECT would use this
            # transaction's snapshot and could miss an invoice committed while we
            # were waiting for the counter lock, setting the counter too low.
            r"SELECT `name` FROM `tabSales Invoice` WHERE `name` LIKE %s ESCAPE '\\' FOR UPDATE",
            escaped + "_" * width,
        )

        is_plain_number = re.compile(r"^\d{%d}$" % width)
        highest = 0
        for (name,) in rows:
            tail = name[len(prefix):]
            if is_plain_number.match(tail):
                highest = max(highest, int(tail))

        frappe.db.sql(
            "UPDATE `tabSeries` SET `current` = %s WHERE `name` = %s", (highest, prefix)
        )

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