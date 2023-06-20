function assignToWaitingPatron(primaryControl) {
	var formContext = primaryControl;
	var book = formContext.getAttribute("csz_book").getValue();
	var itemId = formContext.data.entity.getId().replace("{", "").replace("}", "");
	var itemStatus = formContext.getAttribute("csz_itemstatus").getText();
	if (itemStatus == "Processing") {
		var fetchXml = `?fetchXml=
		<fetch version='1.0' mapping='logical' no-lock='false' distinct='true'>
	<entity name='csz_bookreservation'>
		<attribute name='csz_bookreservationid' />
		<attribute name='csz_name' />
		<attribute name='createdon' />
		<attribute name='csz_bookitem' />
		<attribute name='csz_librarypatron' />
		<attribute name='csz_reservationstatus' />
		<attribute name='csz_expirydate' />
		<attribute name='csz_collectionstartdate' />
		<attribute name='csz_enddate' />
		<order attribute='createdon' descending='true' />
		<attribute name='csz_reservationby' />
		<attribute name='csz_book' />
		<order attribute="createdon" descending="false" />
		<filter type='and'>
			<condition attribute='csz_reservationstatus' operator='eq' value='1' />
			<condition attribute='csz_book' operator='eq' value='${book[0].id}' uitype='csz_book' />
		</filter>
	</entity>
</fetch>`;
		Xrm.WebApi.retrieveMultipleRecords("csz_bookreservation", fetchXml).then(function success(result) {
			if (result.entities.length > 0) {
				var waitingReservation = result.entities[0];
				var waitingReservationId = waitingReservation.csz_bookreservationid;

				var pageInput = {
					pageType: "entityrecord",
					entityName: "csz_bookreservation",
					entityId: waitingReservationId,
					data: {
						csz_bookitem: formContext.data.entity.getEntityReference()
					}
				};
				var navigationOptions = {
					target: 2,
					height: { value: 80, unit: "%" },
					width: { value: 70, unit: "%" },
					position: 1
				};
				Xrm.Navigation.navigateTo(pageInput, navigationOptions).then(
					function success(result) {

					},
					function error() {
						console.log(error.message);
					}
				);
			}
		},
			function (error) { console.log(error.message); });
	}
}