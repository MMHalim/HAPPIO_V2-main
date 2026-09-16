export default {

	abuse: function(){
		const caseId = Text119Copy.text;
		storeValue("caseT2PS", caseId);
 },

	onUserRefresh: function () {
		Text119Copy.setText(appsmith.store.caseT2PS);
		showAlert('You have refreshed the page, Please complete the current assigned conversartion !')
		Kustomer_Message.run();
 },

	f_order: async function () {

		if(Text119Copy.text > 0){
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
					await get_T2_PS.run();
					await assigned.run();
					await Kustomer_Message.run();
					await Channel.abuse();
 } catch (error) {
					console.error('An error occurred during execution:', error);
					showAlert(`An error occurred: ${error.message}`);
 }
 }
 }
		// Channel.onUserRefresh();
 },

	url: function () {
		var txt1 = 'https://tempo-support.myfreshworks.com/crm/messaging/a/770177527280330/inbox/0/0/';
		var txt2 = "conversation/";
		var txt4 = Con_ID.text;
		var combinedText = txt1.concat(txt2,txt4);
		return Input4 = combinedText;
 },

	cid: function() {
		if (Input1.value !== null) {
			Kustomer_Message.run();
 }
 },

	calculateTotal: function () {
		const group1 = [RadioGroup1.selectedOptionValue, RadioGroup3.selectedOptionValue];
		const group2 = [RadioGroup2.selectedOptionValue, RadioGroup8.selectedOptionValue, RadioGroup13.selectedOptionValue];
		const group3 = [RadioGroup9Verification.selectedOptionValue, RadioGroup10TempoValues.selectedOptionValue, RadioGroup11Resolution.selectedOptionValue, RadioGroup12Ownership.selectedOptionValue];
		const group4 = [RadioGroup5.selectedOptionValue, RadioGroup6.selectedOptionValue, RadioGroup7.selectedOptionValue];
		const valuesAssignedg1 = group1.map(value => value === "Yes" ? 5 : (value === "N/A" ? 5 : 0));
		const valuesAssignedg2 = group2.map(value => value === "Yes" ? 10 : 0);
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
		if(Text4.text === 0.00 + "%" ||Text4.text <90.00 + "%"){
			return 'Failed'
 }else{
			return 'Passed'
 }

 },
	// submit:async function () {
		// const emptyWidgets = [];
		// if (Con_ID.text === "") emptyWidgets.push("Conversation ID");
		// if (Input2.selectedOptionValue === "") emptyWidgets.push("Agent Name");
		// if (MonitoringTeam.selectedOptionValue === "") emptyWidgets.push("Monitoring Level");
		// if (RadioGroup1.selectedOptionValue === "") emptyWidgets.push("Introduction");
		// if (RadioGroup2.selectedOptionValue === "") emptyWidgets.push("Language Skills");
		// if (RadioGroup3.selectedOptionValue === "") emptyWidgets.push("Closure");
		// if (RadioGroup5.selectedOptionValue === "") emptyWidgets.push("Communication");
		// if (RadioGroup6.selectedOptionValue === "") emptyWidgets.push("Correctly Diagnosing");
		// if (RadioGroup7.selectedOptionValue === "") emptyWidgets.push("Documentation");
		// if (RadioGroup8.selectedOptionValue === "") emptyWidgets.push("Workflow");
		// if (RadioGroup9Verification.selectedOptionValue === "") emptyWidgets.push("Information Verification");
		// if (RadioGroup10TempoValues.selectedOptionValue === "") emptyWidgets.push("Tempo Values");
		// if (RadioGroup11Resolution.selectedOptionValue === "") emptyWidgets.push("Resolution");
		// if (RadioGroup12Ownership.selectedOptionValue === "") emptyWidgets.push("Ownership");
		// if (RadioGroup13.selectedOptionValue === "") emptyWidgets.push("Kustomer Updates");
		// if (MultiSelect4.selectedOptionValue === "") emptyWidgets.push("Monitoring type");
		// if (MultiSelect5.selectedOptionValues.length === 0) emptyWidgets.push("Interaction related to");
		// if (RadioGroup15.selectedOptionValue === "") emptyWidgets.push("Certification Scorecard ?");
		// if (Calibration.selectedOptionValue === "Null") emptyWidgets.push("Calibration ?");
		// if (emptyWidgets.length > 0) {
			// const emptyWidgetNames = emptyWidgets.join(', ');
			// showAlert(`The following attributes are empty: ${emptyWidgetNames}. Please fill them in.`);
		// } if (Calibration.selectedOptionValue === "Yes") {
			// try {
				// await Calibration_PS.run();
				// await Send_to_agent_passed.run();
				// await QAED.run();
				// await Channel.clean();
				// await Channel.reset();
				// await empty.run();
				// await get_T2_PS.run();
			// } catch (error) {
				// console.error('An error occurred while running Calibration:', error);
			// }
		// } else if (Calibration.selectedOptionValue === "No"){
			// try {
				// await PS_Scorecard.run();
				// await Send_to_agent_passed.run();
				// await QAED.run();
				// await Channel.clean();
				// await Channel.reset();
				// await empty.run();
				// await get_T2_PS.run();
			// } catch (error) {
				// console.error('An error occurred:', error);
			// }
		// }
	// },
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
    if (Calibration.selectedOptionValue === "Null") emptyWidgets.push("Calibration ?");

    if (emptyWidgets.length > 0) {
        const emptyWidgetNames = emptyWidgets.join(', ');
        showAlert(`The following attributes are empty: ${emptyWidgetNames}. Please fill them in.`);
        return; // Exit the function if any widget is empty
 }

    try {
        if (Calibration.selectedOptionValue === "Yes") {
            await Calibration_PS.run();
 } else if (Calibration.selectedOptionValue === "No") {
            await PS_Scorecard.run();
 }
        await Send_to_agent_passed.run();
        await QAED.run();
        await Channel.clean();
        await Channel.reset();
        await empty.run();
        await get_T2_PS.run();
 } catch (error) {
        console.error('An error occurred:', error);
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
		Calibration.setData("Null");
 },

	resetModal: async function(){
		await Channel.reset();
		await closeModal("Modal1", true);
 },
	search: async function(){
		await Kustomer_Message.run();
		await User_details.run();
 },
	logOut: () => {
		removeValue("role");
		removeValue('login_token');
		navigateTo('Login_Modern');
 },

	skip_empty: function(){
		if(!Text119Copy.text){
			showAlert("Please Get Case first to continue !")
 }else{
			showModal('Modal2');
 }
 },
	skip: async function (){
		if(!Text119Copy.text){
			showAlert("Please Add Skip Reason to continue !")	
 }else{
			resetWidget('Input19')
			closeModal(Modal2);
			await Skip.run();
			get_T2_PS.run();
			await Kustomer_Message.run();
 }
 }
}
