export default {

	getActiveAgents: async function () {
		try {
			// Run the API and get the response
			const response = await agentList.run();

			// Ensure the response is valid
			if (response.agents && Array.isArray(response.agents)) {
				// Filter and map the required fields
				const filteredAgents = response.agents
				.filter(agent => !agent.is_deactivated && !agent.is_deleted && agent.agent_capacity > 0)
				.map(agent => ({
					name: `${agent.first_name} ${agent.last_name}`,
					email: agent.email,
 }));

				return filteredAgents;
 } else {
				console.error("Invalid response format");
				return [];
 }
 } catch (error) {
			console.error("Error fetching agent list:", error);
			return [];
 }
 },

	getCal: async function() {
		Text119Copy.setVisibility(true);
		Text121Copy.setVisibility(true);
		const calYes = 'Yes';
		const amin = 'Mohamedamin@tempo.fit';
		storeValue('calYesStore', calYes);
		storeValue('calAminStore', amin);
		Input2.setSelectedOption(amin);

		await Channel.getThursdayOfCurrentWeek();
		await calibration.run();

		// Check if calibration.data exists and has at least one element
		if (calibration.data && calibration.data.length > 0 && calibration.data[0].Conversation_Id) {
			const calData = calibration.data[0].Conversation_Id;
			return calData;
 } else {
			return "No Data !";
 }
 },

	// getThursdayOfCurrentWeek: function() {
	// const currentDate = new Date();
	// const currentDayOfWeek = currentDate.getDay(); 
	// const difference = 4 - currentDayOfWeek; // 4 is Thursday
	// const thursdayDate = new Date(currentDate);
	// thursdayDate.setDate(currentDate.getDate() + difference); // Adjust to Thursday
	// const formattedThursday = thursdayDate.toISOString().slice(0, 10);
	// return formattedThursday;
	// },

	getThursdayOfCurrentWeek: function() {
		const currentDate = new Date();
		const currentDayOfWeek = currentDate.getDay();
		const difference = 4 - currentDayOfWeek; // 4 represents Thursday
		const thursdayDate = new Date(currentDate);
		thursdayDate.setDate(currentDate.getDate() + difference); // Adjust to Thursday

		// Subtract 7 days from the calculated Thursday date
		thursdayDate.setDate(thursdayDate.getDate() - 7);

		const formattedThursday = thursdayDate.toISOString().slice(0, 10);
		return formattedThursday;
 },

	// abuse: function(){
	// const caseId = Text119.text;
	// storeValue("caseMXT1", caseId);
	// },

	onUserRefresh: function () {
		Text119.setText(appsmith.store.caseMXT1);
 },

	visi: function(){
		if(1===1){
			return true;
 }else{
			return false;
 }
 },

	get_case: async function (){
		// Check if an option is selected
		if (rt_data.selectedOptionValue && rt_data.selectedOptionValue !== "Select Option") {
			await Channel.fa_order_RT();
			await agentRT.run();
			await Channel.visi();
 } else { // If no option is selected or it's the default "Select Option"
			await Channel.f_order();
 }
 },

	fa_order_RT: async function(){
		if(Text119.text > 0 ){
			showAlert("Please submit the current Case before asking for a new one !");
 } else {
			const emptyWidgets = [];
			if (Select2.selectedOptionLabel === "") emptyWidgets.push("Select Team");
			if (DatePicker1.formattedDate === "") emptyWidgets.push("Date From");
			if (DatePicker2.formattedDate === "") emptyWidgets.push("Date To");
			if (agent_email.text === "") emptyWidgets.push("Choose Agent");

			if (emptyWidgets.length > 0) {
				const emptyWidgetNames = emptyWidgets.join(', ');
				showAlert(`Please choose the missing: ${emptyWidgetNames}.`);
				return; // Exit the function if any widget is empty
 } else {
				try {
					await get_mx_conRT.run();
					await assigned.run();
 } catch (error) {
					console.error('An error occurred during execution:', error);
 }
 }
 }
 },

	f_order: async function () {

		if(Text119.text > 0 ){
			showAlert("Please submit the current Case before asking for a new one !");
 } else {
			const emptyWidgets = [];
			if (Select2.selectedOptionLabel === "") emptyWidgets.push("Select Team");
			if (DatePicker1.formattedDate === "") emptyWidgets.push("Date From");
			if (DatePicker2.formattedDate === "") emptyWidgets.push("Date To");
			if (agent_email.text === "") emptyWidgets.push("Choose Agent");

			if (emptyWidgets.length > 0) {
				const emptyWidgetNames = emptyWidgets.join(', ');
				showAlert(`Please choose the missing: ${emptyWidgetNames}.`);
				return; // Exit the function if any widget is empty
 } else {
				try {
					await get_mx_con.run();
					await assigned.run();
 } catch (error) {
					console.error('An error occurred during execution:', error);
 }
 }
 }

 },

	// f_order: async function () {
	// 
	// if(Text119.text > 0 ){
	// showAlert("Please submit the current Case before asking for a new one !")	
	// } else {
	// const emptyWidgets = [];
	// if (Select2.selectedOptionLabel === "") emptyWidgets.push("Select Team");
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
	// await Channel.abuse();
	// } catch (error) {
	// console.error('An error occurred during execution:', error);
	// showAlert(`An error occurred: ${error.message}`);
	// }
	// }
	// }
	// Channel.onUserRefresh();
	// },

	urlCal: function () {
		var txt1 = 'https://tempo-support.myfreshworks.com/crm/messaging/a/770177527280330/inbox/0/0/';
		var txt2 = "conversation/";
		var txt4 = Text121Copy.text;
		var combinedText = txt1.concat(txt2,txt4);
		return combinedText;
 },

	url: function () {
		var txt1 = 'https://tempo-support.myfreshworks.com/crm/messaging/a/770177527280330/inbox/0/0/';
		var txt2 = "conversation/";
		var txt4 = Con_ID.text;
		var combinedText = txt1.concat(txt2,txt4);
		return Input4 = combinedText;
 },

	calculateTotal: function () {
		const group1 = [Introduction.selectedOptionValue, RadioGroup2.selectedOptionValue, RadioGroup14.selectedOptionValue];

		const group2 = [RadioGroup5.selectedOptionValue, RadioGroup8.selectedOptionValue,  RadioGroup4.selectedOptionValue];

		const group3 = [RadioGroup9Verification.selectedOptionValue, RadioGroup10TempoValues.selectedOptionValue, RadioGroup11Resolution.selectedOptionValue, RadioGroup12Ownership.selectedOptionValue, RadioGroup12OwnershipCopy.selectedOptionValue];

		const group4 = [RadioGroup3.selectedOptionValue, RadioGroup13.selectedOptionValue, RadioGroup7.selectedOptionValue,RadioGroup14Copy.selectedOptionValue];

		const valuesAssignedg1 = group1.map(value => value === "Yes" ? 5 : (value === "N/A" ? 5 : 0));
		const valuesAssignedg2 = group2.map(value => value === "Yes" ? 15 : 0);
		const valuesAssignedg3 = group3.map(value => value === "No" ? 1 : 0);
		const valuesAssignedg4 = group4.map(value => {
			if (value === "Yes" || value === "N/A") {
				return 10;
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
		if (Con_ID.text === "") emptyWidgets.push("Conversation ID");
		if (Input2.selectedOptionValue === "") emptyWidgets.push("Agent Name");
		if (InputCahnnel.selectedOptionValue === "") emptyWidgets.push("Channel");
		if (MonitoringTeam.selectedOptionValue === "") emptyWidgets.push("Monitoring Level");
		if (Introduction.selectedOptionValue === "") emptyWidgets.push("Interaction Protocols");
		if (RadioGroup5.selectedOptionValue === "") emptyWidgets.push("Understanding");
		if (RadioGroup2.selectedOptionValue === "") emptyWidgets.push("Responsiveness");
		if (RadioGroup3.selectedOptionValue === "") emptyWidgets.push("Effectiveness");
		if (RadioGroup4.selectedOptionValue === "") emptyWidgets.push("Soft Skills");
		if (RadioGroup7.selectedOptionValue === "") emptyWidgets.push("Language");
		if (RadioGroup8.selectedOptionValue === "") emptyWidgets.push("FCR");
		if (RadioGroup9Verification.selectedOptionValue === "") emptyWidgets.push("Ownership");
		if (RadioGroup12Ownership.selectedOptionValue === "") emptyWidgets.push("Product Awareness");
		if (RadioGroup10TempoValues .selectedOptionValue === "") emptyWidgets.push("Tempo Values");
		if (RadioGroup11Resolution.selectedOptionValue === "") emptyWidgets.push("Process Awareness");
		if (RadioGroup12OwnershipCopy.selectedOptionValue === "") emptyWidgets.push("Verification");
		if (RadioGroup13.selectedOptionValue === "") emptyWidgets.push("Documentation");
		if (RadioGroup14 .selectedOptionValue === "") emptyWidgets.push(" CRM Updates");
		if (RadioGroup14Copy.selectedOptionValue === "") emptyWidgets.push("Workflow");
		if (MultiSelect2.selectedOptionValue === "") emptyWidgets.push("SME");
		if (MultiSelect1.selectedOptionValue === "") emptyWidgets.push("Answer provided by SME");
		if (MultiSelect4.selectedOptionValue === "") emptyWidgets.push("Monitoring type");
		if (MultiSelect3.selectedOptionValue === "") emptyWidgets.push("SME following process");
		if (MultiSelect5.selectedOptionValue.length === 0) emptyWidgets.push("Interaction related to");
		if (RadioGroup15.selectedOptionValue === "") emptyWidgets.push("Certification Scorecard");
		if (Input20.text === "") emptyWidgets.push("Comments SME Related");
		if (MultiSelectTstatus.selectedOptionValue === "") emptyWidgets.push("Ticket Status");
		if (sales_comments === "") emptyWidgets.push("Comments on Sales");
		if (Sales.selectedOptionValue === "") emptyWidgets.push("Sales");
		if (Con_ID.text === "{}") emptyWidgets.push("Conversation Id");
		if (Calibration.selectedOptionValue === "Null") emptyWidgets.push("Calibration ?");
		if (emptyWidgets.length > 0) {
			const emptyWidgetNames = emptyWidgets.join(', ');
			showAlert(`The following attributes are empty: ${emptyWidgetNames}. Please fill them in.`);
 } else if (Calibration.selectedOptionValue === "Yes") {
			try {
				await T1_Calibration.run();
				await Send_to_agent_passed.run();
				await QAED.run();
				await Channel.clean();
				await Channel.reset();
				await empty.run();
				await removeValue('calAminStore');
				await removeValue('calYesStore');
				await	removeValue('Calibation');
				Text119Copy.setVisibility(false);
				Text121Copy.setVisibility(false);
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
				await removeValue('calAminStore');
				await removeValue('calYesStore');
				await	removeValue('Calibation');
				Text119Copy.setVisibility(false);
				Text121Copy.setVisibility(false);
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
		resetWidget("Container4", true);
		removeValue('calYesStore');
 },

	resetModal: async function(){
		await Channel.reset();
		await closeModal("Modal1", true);
 },

	logOut: () => {
		Object.keys(appsmith.store)
			.map(key => storeValue(key, undefined));
		navigateTo('Login_Modern')
 },

	startCounter() {
		let count = 60; 
		let timer;
		function updateCounter() {
			count--;
			storeValue('count', count);
			if (count <= 0) {
				clearInterval(timer);

 }
 }

		timer = setInterval(() => {
			updateCounter();

			if (!appsmith.store.access_token || count % 60 === 0) {
				if (!appsmith.store.access_token) {
					Channel.logOut();
 }
 }
 }, 1000);

		return timer;
 },

	deleteStore  ()  {
		Object.keys(appsmith.store)
			.map(key => storeValue(key, undefined));
 },
	clean: function(){
		resetWidget(Text119.setText(""));
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
			resetWidget('Input19');
			closeModal(Modal2);
			await Skip.run();
			await get_mx_con.run();
 }
 }
}
