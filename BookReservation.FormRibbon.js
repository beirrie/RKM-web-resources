function cancelReservation(formContext) {
	var status = formContext.getAttribute("csz_reservationstatus").getValue();
	if (status !== 5 && status !== 3 && status !== 4) {
		var PublishString = {
			text: "Do you want to cancel this Book Reservation?",
			title: "Confirmation Alert",

			confirmButtonLabel: "OK",
			cancelButtonLabel: "Cancel"
		};
		var OptionalParameter = {
			height: 200,
			width: 400
		};
		Xrm.Navigation.openConfirmDialog(PublishString, OptionalParameter).then(
			function (success) {
				if (success.confirmed) {
					formContext.getAttribute("csz_reservationstatus").setValue(5);
					formContext.getAttribute("csz_bookitem").setRequiredLevel("none");
					formContext.getAttribute("csz_collectionstartdate").setRequiredLevel("none");
					formContext.getAttribute("csz_notifypatrontocollect").setRequiredLevel("none");
					formContext.getAttribute("csz_notifypatrontocollect").setValue(false);
					formContext.getAttribute("csz_reservationstatus").setSubmitMode("always");
					formContext.data.process.setStatus("aborted");
					formContext.data.save(1);
					disableFormFields(formContext);
				}
			},
			function (error) { });
	} else {
		Xrm.Utility.alertDialog("Completed records cannot be cancelled.");
	}
}

function disableFormFields(formContext) {
	formContext.ui.controls.forEach(function (control, index) {
		var controlType = control.getControlType();
		if (controlType != "iframe" && controlType != "webresource" && controlType != "subgrid") {
			control.setDisabled(true);
		}
	});
}