export default {
	startCounter() {
		if (!appsmith.store.login_token) {
			Logout.logOut();
		}
	},

	calculateTotal: function () {
		const group1 = [Tone?.selectedOptionValue];
		const group2 = [
			Accuracy?.selectedOptionValue, Engagement?.selectedOptionValue, 
			Clarity?.selectedOptionValue, Responsiveness?.selectedOptionValue, 
			Empathy?.selectedOptionValue, Consistency?.selectedOptionValue
		];
		const group3 = [
			Relevance?.selectedOptionValue, Compliance?.selectedOptionValue, 
			Resolution?.selectedOptionValue
		];
		const group4 = [];

		const valuesAssignedg1 = group1.map(value => value === "Yes" ? 10 : 0);
		const valuesAssignedg2 = group2.map(value => value === "Yes" ? 15 : 0);
		const valuesAssignedg3 = group3.map(value => value === "No" ? 1 : 0);
		const valuesAssignedg4 = group4.map(value => {
			return (value === "Yes" || value === "N/A") ? 15 : 0;
		});

		const totalg1 = valuesAssignedg1.reduce((acc, curr) => acc + curr, 0);
		const totalg2 = valuesAssignedg2.reduce((acc, curr) => acc + curr, 0);
		const totalg3 = valuesAssignedg3.reduce((acc, curr) => acc + curr, 0);
		const totalg4 = valuesAssignedg4.reduce((acc, curr) => acc + curr, 0);

		const final = totalg1 + totalg2 + totalg3 + totalg4;
		const percentFinal = final.toFixed(2) + "%";

		return totalg3 > 0 ? "0.00%" : percentFinal;
	},

	pass_fail: function () {
		const score = parseFloat(Text4.text);
		return (Text4.text === "0.00%" || score < 90.00) ? 'Failed' : 'Passed';
	},

	submit: async function () {
		const emptyWidgets = [];
		if (!fitness?.selectedOptionValue) emptyWidgets.push("Fitness Fluency");
		if (!channel?.selectedOptionValue) emptyWidgets.push("Channel");
		if (!Con_ID?.text) emptyWidgets.push("Post URL");
		if (!agent_name?.selectedOptionValue) emptyWidgets.push("Agent Name");
		if (!Monitoring_level?.selectedOptionValue) emptyWidgets.push("Monitoring Level");
		if (!Accuracy?.selectedOptionValue) emptyWidgets.push("Accuracy");
		if (!Responsiveness?.selectedOptionValue) emptyWidgets.push("Responsiveness");
		if (!Engagement?.selectedOptionValue) emptyWidgets.push("Engagement");
		if (!Clarity?.selectedOptionValue) emptyWidgets.push("Clarity");
		if (!Relevance?.selectedOptionValue) emptyWidgets.push("Relevance");
		if (!Empathy?.selectedOptionValue) emptyWidgets.push("Empathy");
		if (!Consistency?.selectedOptionValue) emptyWidgets.push("Consistency");
		if (!Compliance?.selectedOptionValue) emptyWidgets.push("Compliance");
		if (!Resolution?.selectedOptionValue) emptyWidgets.push("Resolution");
		if (!Tone?.selectedOptionValue) emptyWidgets.push("Tone");
		if (!int_related_to?.selectedOptionValue?.length) emptyWidgets.push("Interaction related to");
		if (!certification?.selectedOptionValue) emptyWidgets.push("Certification Scorecard?");
		if (Calibration?.selectedOptionValue === "Null") emptyWidgets.push("Calibration?");

		if (emptyWidgets.length > 0) {
			showAlert(`The following attributes are empty: ${emptyWidgets.join(', ')}. Please fill them in.`);
		} else {
			try {
				await Chat_Scorecard.run();
				await Send_to_agent_passed.run();
				await Channel.clean();
				await Channel.reset();
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

	resetModal: async function () {
		await Channel.reset();
		await closeModal("Modal1", true);
	},

	logOut: () => {
		removeValue("role");
		removeValue("login_token");
		navigateTo("Login");
	},

	deleteStore() {
		Object.keys(appsmith.store).forEach(key => storeValue(key, undefined));
	},

	clean: function () {
		resetWidget("Text119", true);
		resetWidget("Input1", true);
		resetWidget("Input4", true);
	},


};
