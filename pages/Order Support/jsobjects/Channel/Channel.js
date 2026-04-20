export default {

	abuse: function(){
		const caseId = Text119.text;
		storeValue("caseT2OS", caseId);
	},

	onUserRefresh: function () {
		console.log("Page refreshed by the user!");
		Text119.setText(appsmith.store.caseT2OS);
		showAlert('You have refreshed the page, Please complete the current assigned conversartion !')
		Kustomer_Message.run();
	},

	f_order: async function () {

		if(Text119.text > 0){
			showAlert("Please submit the current Case before asking for a new one !")	
		} else {

			const emptyWidgets = [];
			if (DatePicker1.formattedDate === "") emptyWidgets.push("Date From");
			if (DatePicker2.formattedDate === "") emptyWidgets.push("Date To");
			if(agent_email.text === "") emptyWidgets.push("Choose Agent");
			if (emptyWidgets.length > 0) {
				const emptyWidgetNames = emptyWidgets.join(', ');
				showAlert(`Please choose the missing: ${emptyWidgetNames}.`);
			} else {
				try {
					await get_T2_OS.run();
					await assigned.run();
					await Kustomer_Message.run();
					await Channel.abuse();
				} catch (error) {
					console.error('An error occurred during execution:', error);
					showAlert(`An error occurred: ${error.message}`);
				}
			}
		}
		Channel.onUserRefresh();
	},


	url: function () {
		var txt1 = 'https://tempo-support.myfreshworks.com/crm/messaging/a/770177527280330/inbox/0/0/';
		var txt2 = "conversation/";
		var txt4 = Con_ID.text;
		var combinedText = txt1.concat(txt2,txt4);
		console.log(combinedText);
		return Input4 = combinedText;
	},




	cid: function() {
		if (Input1.value !== null) {
			Kustomer_Message.run();
		}
	},
	preview: function() {  
		var messageCount = Kustomer_Message.data.data.length;
		var previewMessages = [];

		for (var i = 0; i < messageCount; i++) {
			var previewMessage = Kustomer_Message.data.data[i].attributes.preview;

			// var zmessage = Kustomer_Message.data.data[20].attributes.preview

			if (typeof previewMessage !== 'undefined') {
				previewMessage = previewMessage.replace(/\n\n/g, "\n").replace(/\n/g, "");

				// Find assigned user dynamically
				var assignedUsers = Kustomer_Message.data.data[i].attributes.assignedUsers;
				var assignedUser = assignedUsers.length > 0 ? assignedUsers[0] : null;

				// Add assigned user to the preview message
				var messageWithAssignedUser = previewMessage;
				if (assignedUser !== null) {
					var userDetails = User_details.data.data.attributes.name;
					var assignedUserName = userDetails;
					messageWithAssignedUser += "\nAgent Name: " + assignedUserName;
				}
				previewMessages.push(messageWithAssignedUser);
			}
		}
		// Update all previews with assigned user information
		for (var k = 0; k < previewMessages.length; k++) {
			Kustomer_Message.data.data[k].attributes.preview = previewMessages[k];
		}
		return previewMessages.join("\n\n");
	},
	assigneduserIndex: function() {
		var messageCount = Kustomer_Message.data.data.length;
		var previewMessages = [];
		var targetText = "Hello, thank you for contacting Tempo Support, this is";
		var targetDataIndex = -1;
		for (var i = 0; i < messageCount; i++) {
			var previewMessage = Kustomer_Message.data.data[i].attributes.preview;

			if (typeof previewMessage !== 'undefined') {
				previewMessage = previewMessage.replace(/\n\n/g, "\n").replace(/\n/g, "");

				if (previewMessage.indexOf(targetText) !== -1) {
					targetDataIndex = i;
					break;
				}
				previewMessages.push(previewMessage);
			}
		}
		for (var k = 0; k < previewMessages.length; k++) {
			Kustomer_Message.data.data[k].attributes.preview = previewMessages[k];
		}
		return	Kustomer_Message.data.data[targetDataIndex].attributes.assignedUsers[0];
	},
	calculateTotal: function () {
		const group1 = [RadioGroup1.selectedOptionValue, RadioGroup2.selectedOptionValue, RadioGroup3.selectedOptionValue, RadioGroup4.selectedOptionValue];
		const group2 = [RadioGroup5.selectedOptionValue, RadioGroup6.selectedOptionValue, RadioGroup7.selectedOptionValue, RadioGroup13.selectedOptionValue];
		const group3 = [RadioGroup9Verification.selectedOptionValue, RadioGroup10TempoValues.selectedOptionValue, RadioGroup11Resolution.selectedOptionValue, RadioGroup12Ownership.selectedOptionValue];
		const group4 = [RadioGroup8.selectedOptionValue];


		const valuesAssignedg1 = group1.map(value => value === "Yes" ? 5 : (value === "N/A" ? 5 : 0));
		const valuesAssignedg2 = group2.map(value => value === "Yes" ? 15 : 0);
		const valuesAssignedg3 = group3.map(value => value === "No" ? 1 : 0);
		const valuesAssignedg4 = group4.map(value => value === "Yes" ? 20 : 0);
		const totalg1 = valuesAssignedg1.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
		const totalg2 = valuesAssignedg2.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
		const totalg3 = valuesAssignedg3.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
		const totalg4 = valuesAssignedg4.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
		const final = totalg1+totalg2+totalg3+totalg4;
		const percentFinal = final.toFixed(2) + "%";
		if (totalg3 > 0) {
			return 0.00 + "%";
		} else {
			return percentFinal;
		}
	},
	pass_fail: function () {
		const text = Text4.text;
		const parsed = typeof text === 'string' ? parseFloat(text.replace('%','')) : Number(text);
		const score = isNaN(parsed) ? 0 : parsed;
		return (score === 0 || score < 90) ? 'Failed' : 'Passed';
	},
	submit: async function () {
		const emptyWidgets = [];
		if (Con_ID.text === "") emptyWidgets.push("Conversation ID");
		if (Input2.selectedOptionValue === "") emptyWidgets.push("Agent Name");
		if (MonitoringTeam.selectedOptionValue === "") emptyWidgets.push("Monitoring Level");
		if (RadioGroup1.selectedOptionValue === "") emptyWidgets.push("Introduction");
		if (RadioGroup2.selectedOptionValue === "") emptyWidgets.push("Language Skills");
		if (RadioGroup3.selectedOptionValue === "") emptyWidgets.push("Closure");
		if (RadioGroup5.selectedOptionValue === "") emptyWidgets.push("Communication");
		if (RadioGroup6.selectedOptionValue === "") emptyWidgets.push("Correctly Diagnosing");
		if (RadioGroup7.selectedOptionValue === "") emptyWidgets.push("Documentation");
		if (RadioGroup8.selectedOptionValue === "") emptyWidgets.push("Workflow");
		if (RadioGroup9Verification.selectedOptionValue === "") emptyWidgets.push("Information Verification");
		if (RadioGroup10TempoValues.selectedOptionValue === "") emptyWidgets.push("Tempo Values");
		if (RadioGroup11Resolution.selectedOptionValue === "") emptyWidgets.push("Resolution");
		if (RadioGroup12Ownership.selectedOptionValue === "") emptyWidgets.push("Ownership");
		if (RadioGroup13.selectedOptionValue === "") emptyWidgets.push("Kustomer Updates");
		if (MultiSelect4.selectedOptionValue === "") emptyWidgets.push("Monitoring type");
		if (MultiSelect5.selectedOptionValues.length === 0) emptyWidgets.push("Interaction related to");
		if (RadioGroup15.selectedOptionValue === "") emptyWidgets.push("Certification Scorecard ?");
		if (emptyWidgets.length > 0) {
			const emptyWidgetNames = emptyWidgets.join(', ');
			showAlert(`The following attributes are empty: ${emptyWidgetNames}. Please fill them in.`);
		} else {
			try {
				await OS_Scorecard.run();
				await Send_to_agent_passed.run();
				await	QAED.run();
				await Channel.clean();
				await Channel.reset();
				await empty.run();
			} catch (error) {
				console.error('An error occurred:', error);
			}
		}
	},
	clean: function(){
		resetWidget(Text119.setText(""));
		resetWidget(Input1.setValue(""));
		resetWidget(Input4.setValue(""));
	},
	reset: function () {
		resetWidget("Text5", true);
		resetWidget("Container2", true);
		resetWidget("Container3", true);
		resetWidget("MX_T1", true);
		resetWidget("Container4", true);
		User_details.clear();
		Input4.setValue("");
	},
	resetModal: async function(){
		await Channel.reset();
		await UJET.clear();
		await closeModal("Modal1", true);
	},
	search: async function(){
		await Kustomer_Message.run();
		Channel.assigneduserIndex.run;
		await User_details.run();
	},
	logOut: () => {
		Object.keys(appsmith.store)
			.map(key => storeValue(key, undefined));
		navigateTo('Login_Modern')
	},
	skip_empty: function(){
		if(!Text119.text){
			showAlert("Please Get Case first to continue !")
		}else{
			showModal('Modal2');
		}
	},
	skip: async function (){
		if(!Input19.text){
			showAlert("Please Add Skip Reason to continue !")
		}else{
			resetWidget('Input19')
			closeModal(Modal2);
			await Skip.run();
			await get_T2_OS.run();
			await Kustomer_Message.run();
		}
	},

}
