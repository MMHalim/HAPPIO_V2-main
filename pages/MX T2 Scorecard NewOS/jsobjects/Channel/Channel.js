export default {

	calibration: function(){
		if(Calibration.selectedOptionValue.length === 3){
			return "false"
		} else{
			return "true"
		}
	},

	startCounter() {
		// Check both Appsmith store and localStorage for authentication
		const storeToken = appsmith.store.login_token;
		const localToken = localStorage.getItem('login_token');
		
		// If no token found in either location, logout
		if (!storeToken && !localToken) {
			Logout.logOut();
		} else if (!storeToken && localToken) {
			// Restore session from localStorage if store is empty
			storeValue('login_token', localToken);
			storeValue('user_id', localStorage.getItem('user_id'));
			storeValue('user_role', localStorage.getItem('user_role'));
			storeValue('loggedInUserEmail', localStorage.getItem('loggedInUserEmail'));
		}
	},

	abuse: function(){
		const caseId = Text119.text;
		storeValue("caseMXT1", caseId);
	},

	onUserRefresh: function () {
		console.log("Page refreshed by the user!");
		Text119.setText(appsmith.store.caseMXT1);
	},

	f_order: async function () {

		if(Text119.text > 0){
			showAlert("Please submit the current Case before asking for a new one !");
		} else {
			const emptyWidgets = [];
			if (DatePicker1.formattedDate === "") emptyWidgets.push("Date From");
			if (DatePicker2.formattedDate === "") emptyWidgets.push("Date To");
			if (agent_email.text === "") emptyWidgets.push("Choose Agent");

			if (emptyWidgets.length > 0) {
				const emptyWidgetNames = emptyWidgets.join(', ');
				showAlert(`Please choose the missing: ${emptyWidgetNames}.`);
				return; // Exit the function if any widget is empty
			}

			try {
				await get_mx_con.run();
				await assigned.run();
				await Channel.abuse();
			} catch (error) {
				console.error('An error occurred during execution:', error);
				showAlert(`An error occurred: ${error.message}`);
			}
		}
		// Channel.onUserRefresh();
	},

	// f_order: async function () {
	// 
	// if(Text119.text > 0){
	// showAlert("Please submit the current Case before asking for a new one !")	
	// } else {
	// const emptyWidgets = [];
	// // if (Select2.selectedOptionLabel === "") emptyWidgets.push("Select Team");
	// if (DatePicker1.formattedDate === "") emptyWidgets.push("Date From");
	// if (DatePicker2.formattedDate === "") emptyWidgets.push("Date To");
	// if(agent_email.text === "") emptyWidgets.push("Choose Agent");
	// if (emptyWidgets.length > 0) {
	// const emptyWidgetNames = emptyWidgets.join(', ');
	// showAlert(`Please choose the missing: ${emptyWidgetNames}.`);
	// } else {
	// try {
	// await get_mx_con.run();
	// await assigned.run();
	// // await Kustomer_Message.run();
	// await Channel.abuse();
	// } catch (error) {
	// console.error('An error occurred during execution:', error);
	// showAlert(`An error occurred: ${error.message}`);
	// }
	// }
	// }
	// // Channel.onUserRefresh();
	// },

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
		}
	},


	calculateTotal: function () {
		const group1 = [];

		const group2 = [Interaction_Protocols.selectedOptionValue, Offering_Alternatives.selectedOptionValue, CRM_Updates.selectedOptionValue, Documentation.selectedOptionValue];

		const group3 = [Ownership.selectedOptionValue, Resolution.selectedOptionValue, Tempo_Values.selectedOptionValue, Verification.selectedOptionValue];

		const group4 = [Understanding.selectedOptionValue, Engagement.selectedOptionValue, Retention_Skills.selectedOptionValue, Workflow.selectedOptionValue];

		const valuesAssignedg1 = group1.map(value => value === "Yes" ? 5 : (value === "N/A" ? 5 : 0));
		const valuesAssignedg2 = group2.map(value => value === "Yes" ? 10 : 0);
		const valuesAssignedg3 = group3.map(value => value === "No" ? 1 : 0);
		const valuesAssignedg4 = group4.map(value => {
			if (value === "Yes" || value === "N/A") {
				return 15;
			} else {
				return 0;
			}
		});
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
		if (fitness.selectedOptionValue === "") emptyWidgets.push("Fitness Fluency");
		if (retained.selectedOptionValue === "") emptyWidgets.push("Customer Retained");
		if (Con_ID.text === "") emptyWidgets.push("Conversation ID");
		if (Input2.selectedOptionValue === "") emptyWidgets.push("Agent Name");
		// if (InputCahnnel.selectedOptionValue === "") emptyWidgets.push("Channel");
		if (MonitoringTeam.selectedOptionValue === "") emptyWidgets.push("Monitoring Level");
		if (Interaction_Protocols.selectedOptionValue === "") emptyWidgets.push("Interaction Protocols");
		if (Retention_Skills.selectedOptionValue === "") emptyWidgets.push("Retention Skills");
		if (Offering_Alternatives.selectedOptionValue === "") emptyWidgets.push("Offering Alternatives");
		if (Understanding.selectedOptionValue === "") emptyWidgets.push("Understanding");
		if (Ownership.selectedOptionValue === "") emptyWidgets.push("Ownership");
		if (Tempo_Values.selectedOptionValue === "") emptyWidgets.push("Tempo Values");
		if (Verification.selectedOptionValue === "") emptyWidgets.push("Verification");
		if (Documentation.selectedOptionValue === "") emptyWidgets.push("Documentation");
		if (MultiSelectTstatus.selectedOptionValue === "") emptyWidgets.push("Ticket Status");
		if (Input20.text === "") emptyWidgets.push("General Comments");
		if (MultiSelect4.selectedOptionValue === "") emptyWidgets.push("Monitoring type");
		if (Engagement.selectedOptionValue === "") emptyWidgets.push("Engagement");
		if (MultiSelect5.selectedOptionValue.length === 0) emptyWidgets.push("Interaction related to");
		if (RadioGroup15.selectedOptionValue === "") emptyWidgets.push("Certification Scorecard ?");
		if (Calibration.selectedOptionValue === "Null") emptyWidgets.push("Calibration ?");
		if (Con_ID.text === "") emptyWidgets.push("Conversation Id ?");
		if (emptyWidgets.length > 0) {
			const emptyWidgetNames = emptyWidgets.join(', ');
			showAlert(`The following attributes are empty: ${emptyWidgetNames}. Please fill them in.`);
		} else if (Calibration.selectedOptionValue === "Yes") {
			try {
				await Calibration_T2.run();
				await Send_to_agent_passed.run();
				await QAED.run();
				await Channel.clean();
				await Channel.reset();
				await empty.run();
			} catch (error) {
				console.error('An error occurred while running Calibration:', error);
			}
		} else if (Calibration.selectedOptionValue === "No"){
			try {
				await Chat_Scorecard.run();
				await Send_to_agent_passed.run();
				await QAED.run();
				await Channel.clean();
				await Channel.reset();
				await empty.run();
				await new_sc_data.run();
			} catch (error) {
				console.error('An error occurred:', error);
			}
		}
	},

	reset: function () {
		resetWidget("Text5", true);
		resetWidget("Container2", true);
		resetWidget("Container3", true);
		resetWidget("MX_T1", true);
		resetWidget("Container4", true);

	},

	resetModal: async function(){
		await Channel.reset();
		await UJET.clear();
		await closeModal("Modal1", true);
	},

	logOut: () => {
		removeValue("role");
		removeValue('login_token');
		navigateTo('Login_Modern');
	},

	deleteStore  ()  {
		Object.keys(appsmith.store)
			.map(key => storeValue(key, undefined));
	},
	clean: function(){
		resetWidget(Text119.setText(""));
		resetWidget(Input1.setValue(""));
		resetWidget(Input4.setValue(""));
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
			await get_mx_con.run();
		}
	}

}
