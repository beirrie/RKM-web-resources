function OnFormLoad(executionContext) {
	let formContext = executionContext.getFormContext();
	lockField(formContext);
	lockFinishedFormFields(formContext);
	formContext.getAttribute("csz_book").addOnChange(onBookItemChange);

	var createdon = formContext.getAttribute("createdon").getValue();
	var tab_record = formContext.ui.tabs.get("tab_record");
	var tab_allreservations = formContext.ui.tabs.get("tab_allreservations");
	var section_collection = tab_record.sections.get("section_collection");
	if (createdon != null) {
		tab_allreservations.setVisible(true);
		section_collection.setVisible(true);
	} else {
		tab_allreservations.setVisible(false);
		section_collection.setVisible(false);
	}
}

function lockField(formContext) {
	if (formContext.getControl("header_process_csz_reservationstatus") != null) {
		formContext.getControl("header_process_csz_reservationstatus").setDisabled(true);
	};
}

function onBookItemChange(executionContext) {
	var formContext = executionContext.getFormContext();
	var item = formContext.getAttribute("csz_bookitem").getValue();
	if (item !== null && item !== "") {
		var bookLookup = [];
		var itemId = item[0].id.replace("{", "").replace("}", "");
		Xrm.WebApi.retrieveRecord("csz_bookitem", itemId, "?$select=_csz_book_value").then(
			function success(result) {
				var reservedBookId = formContext.getAttribute("csz_book").getValue()[0].replace("{", "").replace("}", "");
				if (reservedBookId != result._csz_book_value) {
					var PublishString = {
						title: "Wrong Book Item Alert",
						text: `
						The Book Item you have entered does not match the book reserved. Please check again.

						Reserved Book Title: ${reservedBook.name}

						Your Book Item Title: ${result["_csz_book_value@OData.Community.Display.V1.FormattedValue"]}
					`};
					var OptionalParameter = {
						height: 300,
						width: 400
					};
					Xrm.Navigation.openAlertDialog(PublishString, OptionalParameter);
					formContext.getAttribute("csz_bookitem").setValue("");
				}
			},
			function (error) {
				console.log(error.message);
			}
		);
	}
}

function onLibraryPatronChange(executionContext) {
	var formContext = executionContext.getFormContext();
	var patron = formContext.getAttribute("csz_librarypatron").getValue();
	if (patron != null) {
		Xrm.WebApi.retrieveRecord("csz_librarypatron", patron[0].id).then(
			function success(result) {
				var bal = result.csz_remain;
				if (bal <= 0) {
					var PublishString = {
						title: "No Reservation Balance Alert",
						text: `
						Library Patron has no reservation balance.

						Name: ${result["_csz_contact_value@OData.Community.Display.V1.FormattedValue"]}
						Reservation Balance: ${result.csz_remain}
					`};
					var OptionalParameter = {
						height: 300,
						width: 400
					};
					Xrm.Navigation.openAlertDialog(PublishString, OptionalParameter);
					formContext.ui.setFormNotification("Library Patron has no reservation balance.", "WARNING", "libraryPatronNotification");
				} else {
					formContext.ui.clearFormNotification("libraryPatronNotification");
				}
			},
			function (error) {
				console.log(error.message);
			}
		);
	} else {
		formContext.ui.clearFormNotification("libraryPatronNotification");
	}
}

function onFormSave(executionContext) {
	var formContext = executionContext.getFormContext();
	var setReservationCollectedObj = formContext.getAttribute("csz_setreservationcollected");
	var activeProcess = formContext.data.process.getActiveProcess();
	if (activeProcess != null && setReservationCollectedObj.getValue() == true && formContext.getAttribute("csz_reservationstatus").getValue() != 3) {
		var process = activeProcess.getName();
		if (process == "Reservation To Collection Process") {
			var stage = formContext.data.process.getActiveStage().getName();
			if (stage == "Set Reservation Collected" && formContext.data.process.getStatus() != "finished") {
				// check library patron
				var loanBalance = 0;
				var patronName = "";
				var patron = formContext.getAttribute("csz_librarypatron").getValue();
				Xrm.WebApi.retrieveRecord("csz_librarypatron", patron[0].id).then(
					function success(result) {
						patronName = result["_csz_contact_value@OData.Community.Display.V1.FormattedValue"];
						loanBalance = result.csz_remainingborrowlimit;

						if (loanBalance <= 0) {
							var PublishString = {
								title: "No Loan Balance Alert",
								text: `
					Library Patron has no loan balance. Unable to set Reservation as Collected.
		
					Name: ${patronName}
					Loan Balance: ${loanBalance}
				`};
							var OptionalParameter = {
								height: 300,
								width: 400
							};
							Xrm.Navigation.openAlertDialog(PublishString, OptionalParameter).then(function (success) {
								setReservationCollectedObj.setValue(false);
							}, function (error) {
								console.log(error.message);
							});
							formContext.ui.setFormNotification("Library Patron has no loan balance.", "WARNING", "LoanBalanceNotification");
						} else {
							displayConfirmation(formContext);
							formContext.ui.clearFormNotification("LoanBalanceNotification");
						}
					},
					function (error) {
						console.log(error.message);
					}
				);
			}
		}
	}
}

function displayConfirmation(formContext) {
	var PublishString = {
		text: "Book lending record will be created. Do you want to set Reservation as Collected?",
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
				formContext.getAttribute("csz_setreservationcollected").setValue(true);
				formContext.getAttribute("csz_reservationstatus").setValue(3);
				formContext.data.process.setStatus("finished");
				formContext.data.refresh(true);
			}
		}, function (error) { });
}

function onSetReservationChange(executionContext) {
	let formContext = executionContext.getFormContext();
	var isLibraryPatronAllowedToCollect = false;
	var loanBalance = 0;
	var patronName = "";
	var patron = formContext.getAttribute("csz_librarypatron").getValue();
	Xrm.WebApi.retrieveRecord("csz_librarypatron", patron[0].id).then(
		function success(result) {
			patronName = result["_csz_contact_value@OData.Community.Display.V1.FormattedValue"];
			loanBalance = result.csz_remainingborrowlimit;

			if (loanBalance <= 0) {
				var PublishString = {
					title: "No Loan Balance Alert",
					text: `
		Library Patron has no loan balance. Unable to set Reservation as Collected.

		Name: ${patronName}
		Loan Balance: ${loanBalance}
	`};
				var OptionalParameter = {
					height: 300,
					width: 400
				};
				Xrm.Navigation.openAlertDialog(PublishString, OptionalParameter).then(function (success) {
					setReservationCollectedObj.setValue(false);
				}, function (error) {
					console.log(error.message);
				});
				formContext.ui.setFormNotification("Library Patron has no loan balance.", "WARNING", "LoanBalanceNotification");
			} else {
				isLibraryPatronAllowedToCollect = true;
				displayConfirmation(formContext);
				formContext.ui.clearFormNotification("LoanBalanceNotification");
			}
		},
		function (error) {
			console.log(error.message);
		}
	);

	var setReservationCollected = formContext.getAttribute("csz_setreservationcollected").getValue();
	if (setReservationCollected && !isLibraryPatronAllowedToCollect) {
		formContext.getAttribute("csz_setreservationcollected").setValue(false);
		formContext.data.refresh(true);
	}
}

function onModifiedOnChange(executionContext) {
	let formContext = executionContext.getFormContext();
	var activeProcess = formContext.data.process.getActiveProcess();
	var setReservationCollected = formContext.getAttribute("csz_setreservationcollected").getValue();

	if (activeProcess != null) {
		var process = activeProcess.getName();
		if (process == "Reservation To Collection Process") {
			var stage = formContext.data.process.getActiveStage().getName();
			if (stage == "Book Item Collection Details") {
				formContext.ui.clearFormNotification("libraryPatronNotification");
				var bookItem = formContext.getAttribute("csz_bookitem").getValue();
				var collectionStartDate = formContext.getAttribute("csz_collectionstartdate").getValue();
				var notifyPatronToCollect = formContext.getAttribute("csz_notifypatrontocollect").getValue();
				if (bookItem != null && notifyPatronToCollect == true && collectionStartDate != null) {
					formContext.data.process.moveNext();
					formContext.data.refresh(true);
				}
			}
		}
	}
}

function lockFinishedFormFields(formContext) {
	var activeProcess = formContext.data.process.getActiveProcess();
	if (activeProcess != null) {
		var process = activeProcess.getName();
		if (process == "Reservation To Collection Process") {
			var status = formContext.data.process.getStatus();
			if (status == "finished") {
				disableFormFields(formContext);
			}
		}
	}
	if (formContext.getAttribute("csz_reservationstatus").getValue() == 5) {
		disableFormFields(formContext);
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