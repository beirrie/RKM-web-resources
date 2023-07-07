function onFormLoad(executionContext) {
	checkBookItemExist(executionContext);
}
function onFormSave(executionContext) {
	checkBookItemExist(executionContext);
}
function checkBookItemExist(executionContext) {
	let formContext = executionContext.getFormContext();
	var isNewRecord = formContext.getAttribute("createdon").getValue() == null;
	var itemsCount = formContext.getAttribute("csz_itemscount") == null ? null : formContext.getAttribute("csz_itemscount").getValue();
	if (itemsCount != null && itemsCount <= 0 && !isNewRecord) {
		formContext.ui.setFormNotification("The book you are trying to manage currently has no items associated with it. Please add items to ensure availability for lending and reservations.", "WARNING", "NoBookItemNotification");
	} else {
		formContext.ui.clearFormNotification("NoBookItemNotification");
	}
}