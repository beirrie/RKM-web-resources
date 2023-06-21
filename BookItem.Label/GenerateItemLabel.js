function generateItemQRCode(formContext) {
	var barcode = formContext.data.entity.attributes.get("csz_name").getValue();
	var itemName = formContext.getAttribute("csz_name").getValue();
	var qvc_book = formContext.ui.quickForms.get("qvc_book");
	var callNumber = "";
	if (qvc_book.isLoaded()) {
		callNumber = qvc_book.getControl("csz_callnumber").getAttribute().getValue();
	}
	if (barcode !== null) {
		var customParameters = encodeURIComponent("itemName=" + itemName + "|barcode=" + barcode + "|callNumber=" + callNumber);
		var windowOptions = { height: 300, width: 300 };
		Xrm.Navigation.openWebResource("csz_itemlabel", windowOptions, customParameters);
	}
	else {
		alert("Please fill the required detail and save the form first.")
	}
}