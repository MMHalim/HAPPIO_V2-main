export default {
    getMondayOfCurrentWeek: function() {
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

	storeConversationID: function(){
		const conId = Input19.text;
		storeValue('calibration', conId);
	},



	coaching: async function(){
		if(Checkbox1.isChecked){
			await	Text1111.setText("true");
			await Coaching_T1.run();
		} else if (!Checkbox1.isChecked){
			await Text1111.setText("false");
			await Coaching_T1.run();
		}
	},
	coachingOS: async function(){
		if(Checkbox1Copy.isChecked){
			await	Text1111Copy.setText("true");
			await Coaching_T2OS.run();
		} else if (!Checkbox1.isChecked){
			await Text1111Copy.setText("false");
			await Coaching_T2OS.run();
		}
	},
	coachingPS: async function(){
		if(Checkbox1CopyCopy.isChecked){
			await	Text1111CopyCopy.setText("true");
			await Coaching_T2PS.run();
		} else if (!Checkbox1CopyCopy.isChecked){
			await Text1111CopyCopy.setText("false");
			await Coaching_T2PS.run();
		}
	},



	all_apis: async function(){
		await my_figures.run();
		await my_figuresCopy.run();
		await my_figuresTech.run();
		my_performance.my_search_T1();
		my_performance.my_search_OS();
		my_performance.my_search_PS();
	},
	showdelete: function(){
		Button2CopyCopy.setVisibility(true);
		Button2Copy1.setVisibility(true);
	},
	hidedelete: function(){
		Button2CopyCopy.setVisibility(false);
		Button2Copy1.setVisibility(false);
	},
	showdeleteOS: function(){
		Button2CopyCopyCopy.setVisibility(true);
		Button2Copy1Copy.setVisibility(true);
	},
	hidedeleteOS: function(){
		Button2CopyCopyCopy.setVisibility(false);
		Button2Copy1Copy.setVisibility(false);
	},
	showdeletePS: function(){
		Button2CopyCopyCopyCopy.setVisibility(true);
		Button2Copy1CopyCopy.setVisibility(true);
	},
	hidedeletePS: function(){
		Button2Copy1CopyCopy.setVisibility(false);
		Button2CopyCopyCopyCopy.setVisibility(false);
	},
	datepicker: function(){
		const date = new Date();
		let currentDay= String(date.getDate()).padStart(2, '0');
		let currentMonth = String(date.getMonth()+1).padStart(2,"0");
		let currentYear = date.getFullYear();
		let currentDate = `${currentDay}-${currentMonth}-${currentYear}`;
		console.log("The current date is " + currentDate); 
	},
	datepickermonday: function(){
		const date = new Date();
		const currentDay = date.getDay();
		const daysUntilLastMonday = (currentDay + 6) % 7; 
		date.setDate(date.getDate() - daysUntilLastMonday);
		const currentYear = date.getFullYear();
		const currentMonth = String(date.getMonth() + 1).padStart(2, '0');
		const currentDayFormatted = String(date.getDate()).padStart(2, '0');
		const lastMondayDate = `${currentYear}-${currentMonth}-${currentDayFormatted}`;
		return lastMondayDate;
	},
	my_search_OS: async function() {
		const responseData = my_figuresCopy.data;
		let sum = 0;
		let count = 0;
		for (const item of responseData) {
			const finalScoreText = item.Final_Score === 'null%' ? '0%' : item.Final_Score;
			const finalScore = parseFloat(finalScoreText.replace('%', ''));
			if (!isNaN(finalScore)) {
				sum += finalScore;
				count++;
			}
		}
		let averageScore = 0;
		if (count > 0) {
			averageScore = (sum / count).toFixed(0); // Rounded to 2 decimal places
		}
		console.log("Average Score:", averageScore);
		return averageScore + '%';
	},
	my_search_T1: async function() {
		const responseData = my_figures.data;
		let sum = 0;
		let count = 0;
		for (const item of responseData) {
			const finalScoreText = item.Final_Score === 'null%' ? '0%' : item.Final_Score;
			const finalScore = parseFloat(finalScoreText.replace('%', ''));
			if (!isNaN(finalScore)) {
				sum += finalScore;
				count++;
			}
		}
		let averageScore = 0;
		if (count > 0) {
			averageScore = (sum / count).toFixed(0); // Rounded to 2 decimal places
		}
		console.log("Average Score:", averageScore);
		return averageScore + '%';
	},
	my_search_PS: async function() {
		const responseData = my_figuresTech.data;
		let sum = 0;
		let count = 0;
		for (const item of responseData) {
			const finalScoreText = item.Final_Score === 'null%' ? '0%' : item.Final_Score;
			const finalScore = parseFloat(finalScoreText.replace('%', ''));
			if (!isNaN(finalScore)) {
				sum += finalScore;
				count++;
			}
		}
		let averageScore = 0;
		if (count > 0) {
			averageScore = (sum / count).toFixed(0); // Rounded to 2 decimal places
		}
		console.log("Average Score:", averageScore);
		return averageScore + '%';
	},
	edit: function (){
		Text119Copy3.setVisibility(true);
		Text119Copy2.setVisibility(true);
		Button2Copy.setVisibility(true);
		Button2.setVisibility(true);
		Introduction.setDisabled(false);
		RadioGroup5.setDisabled(false);
		RadioGroup2.setDisabled(false);
		RadioGroup3.setDisabled(false);
		RadioGroup4.setDisabled(false);
		RadioGroup7.setDisabled(false);
		RadioGroup8.setDisabled(false);
		RadioGroup9Verification.setDisabled(false);
		RadioGroup12Ownership.setDisabled(false);
		RadioGroup10TempoValues.setDisabled(false);
		RadioGroup11Resolution.setDisabled(false);
		RadioGroup12OwnershipCopyCopy.setDisabled(false);
		RadioGroup13.setDisabled(false);
		RadioGroup14.setDisabled(false);
		RadioGroup14Copy.setDisabled(false);
		Introduction_C.setDisabled(false);
		Input9.setDisabled(false);
		Input6.setDisabled(false);
		Input7.setDisabled(false);
		Input8.setDisabled(false);
		Input11.setDisabled(false);
		Input12.setDisabled(false);
		Input13.setDisabled(false);
		Input16.setDisabled(false);
		Input14.setDisabled(false);
		Input15.setDisabled(false);
		Input17.setDisabled(false);
		Input18.setDisabled(false);
		Input18Copy.setDisabled(false);
		Input16CopyCopy.setDisabled(false);

	},
	discard: function () {
		Text119Copy3.setVisibility(false);
		Text119Copy2.setVisibility(false);
		Button2Copy.setVisibility(false);
		Button2.setVisibility(false);
		RadioGroup5.setDisabled(true);
		RadioGroup2.setDisabled(true);
		RadioGroup3.setDisabled(true);
		RadioGroup4.setDisabled(true);
		RadioGroup7.setDisabled(true);
		RadioGroup8.setDisabled(true);
		RadioGroup9Verification.setDisabled(true);
		RadioGroup12OwnershipCopyCopy.setDisabled(true);
		RadioGroup10TempoValues.setDisabled(true);
		RadioGroup11Resolution.setDisabled(true);
		RadioGroup13.setDisabled(true);
		RadioGroup14.setDisabled(true);
		RadioGroup14Copy.setDisabled(true);
		Introduction_C.setDisabled(true);
		Input9.setDisabled(true);
		Input6.setDisabled(true);
		Input7.setDisabled(true);
		Input8.setDisabled(true);
		Input11.setDisabled(true);
		Input12.setDisabled(true);
		Input13.setDisabled(true);
		Input16.setDisabled(true);
		Input14.setDisabled(true);
		Input15.setDisabled(true);
		Input17.setDisabled(true);
		Input18.setDisabled(true);
		Input18Copy.setDisabled(true);
		Input16CopyCopy.setDisabled(true);
		Introduction.setDisabled(true);

	},
	calculateTotal: function () {
		const group1 = [Introduction.selectedOptionValue, RadioGroup2.selectedOptionValue, RadioGroup14.selectedOptionValue];
		const group2 = [RadioGroup5.selectedOptionValue, RadioGroup8.selectedOptionValue,  RadioGroup4.selectedOptionValue];
		const group3 = [RadioGroup9Verification.selectedOptionValue, RadioGroup10TempoValues.selectedOptionValue, RadioGroup11Resolution.selectedOptionValue, RadioGroup12Ownership.selectedOptionValue, RadioGroup12OwnershipCopyCopy.selectedOptionValue];
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
	calculateTotalOS: function () {
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
	editOS: function(){
		Button2CopyCopy1.setVisibility(true);
		Button2Copy2.setVisibility(true);
		Text119Copy2Copy.setVisibility(true);
		Text119Copy3Copy.setVisibility(true);
		Engagement.setDisabled(false);
		Interaction_Protocols.setDisabled(false);
		Ownership.setDisabled(false);
		Understanding.setDisabled(false);
		Retention_Skills.setDisabled(false);
		Offering_Alternatives.setDisabled(false);
		Resolution.setDisabled(false);
		Tempo_Values.setDisabled(false);
		Verification.setDisabled(false);
		CRM_Updates.setDisabled(false);
		Documentation.setDisabled(false);
		Workflow.setDisabled(false);
		Interaction_Protocols_C.setDisabled(false);
		Ownership_C.setDisabled(false);
		Understanding_C.setDisabled(false);
		Retention_Skills_C.setDisabled(false);
		Offering_Alternatives_C.setDisabled(false);
		Resolution_C.setDisabled(false);
		Tempo_Values_C.setDisabled(false);
		Verification_C.setDisabled(false);
		CRM_Updates_C.setDisabled(false);
		Documentation_C.setDisabled(false);
		Workflow_C.setDisabled(false);
		Engagement_C.setDisabled(false);
	},
	discardOS: function(){
		Button2CopyCopy1.setVisibility(false);
		Button2Copy2.setVisibility(false);
		Text119Copy2Copy.setVisibility(false);
		Text119Copy3Copy.setVisibility(false);
		Engagement.setDisabled(true);
		Interaction_Protocols.setDisabled(true);
		Ownership.setDisabled(true);
		Understanding.setDisabled(true);
		Retention_Skills.setDisabled(true);
		Offering_Alternatives.setDisabled(true);
		Resolution.setDisabled(true);
		Tempo_Values.setDisabled(true);
		Verification.setDisabled(true);
		CRM_Updates.setDisabled(true);
		Documentation.setDisabled(true);
		Workflow.setDisabled(true);
		Interaction_Protocols_C.setDisabled(true);
		Ownership_C.setDisabled(true);
		Understanding_C.setDisabled(true);
		Retention_Skills_C.setDisabled(true);
		Offering_Alternatives_C.setDisabled(true);
		Resolution_C.setDisabled(true);
		Tempo_Values_C.setDisabled(true);
		Verification_C.setDisabled(true);
		CRM_Updates_C.setDisabled(true);
		Documentation_C.setDisabled(true);
		Workflow_C.setDisabled(true);
		Engagement_C.setDisabled(true);

	},
	calculateTotalPS: function () {
		const group1 = [RadioGroup1Copy1.selectedOptionValue, RadioGroup3Copy1.selectedOptionValue];
		const group2 = [RadioGroup8Copy1.selectedOptionValue, RadioGroup13Copy1.selectedOptionValue, RadioGroup2Copy1.selectedOptionValue];
		const group3 = [RadioGroup9VerificationCopy1.selectedOptionValue, RadioGroup12OwnershipCopy1.selectedOptionValue, RadioGroup11ResolutionCopy1.selectedOptionValue, RadioGroup10TempoValuesCopy1.selectedOptionValue];
		const group4 = [RadioGroup5Copy1.selectedOptionValue, RadioGroup6Copy1.selectedOptionValue, RadioGroup7Copy1.selectedOptionValue];
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
	editPS: function() {
		Text119Copy2CopyCopy.setVisibility(true);
		Text119Copy3CopyCopy.setVisibility(true);
		Button2CopyCopy1Copy.setVisibility(true);
		Button2Copy2Copy.setVisibility(true);
		RadioGroup6Copy1.setDisabled(false);
		RadioGroup1Copy1.setDisabled(false);
		Input5Copy1.setDisabled(false);
		RadioGroup5Copy1.setDisabled(false);
		Input9Copy1.setDisabled(false);
		Input10Copy1.setDisabled(false);
		RadioGroup2Copy1.setDisabled(false);
		Input6Copy1.setDisabled(false);
		RadioGroup3Copy1.setDisabled(false);
		Input7Copy1.setDisabled(false);
		RadioGroup7Copy1.setDisabled(false);
		Input11Copy1.setDisabled(false);
		RadioGroup8Copy1.setDisabled(false);
		Input12Copy1.setDisabled(false);
		RadioGroup13Copy1.setDisabled(false);
		Input17Copy1.setDisabled(false);
		RadioGroup9VerificationCopy1.setDisabled(false);
		Input13Copy1.setDisabled(false);
		RadioGroup12OwnershipCopy1.setDisabled(false);
		Input16Copy1.setDisabled(false);
		RadioGroup11ResolutionCopy1.setDisabled(false);
		Input15Copy1.setDisabled(false);
		RadioGroup10TempoValuesCopy1.setDisabled(false);
		Input14Copy1.setDisabled(false);
	},

	discardPS: function() {
		Text119Copy2CopyCopy.setVisibility(false);
		Text119Copy3CopyCopy.setVisibility(false);
		Button2CopyCopy1Copy.setVisibility(false);
		Button2Copy2Copy.setVisibility(false);
		RadioGroup6Copy1.setDisabled(true);
		RadioGroup1Copy1.setDisabled(true);
		Input5Copy1.setDisabled(true);
		RadioGroup5Copy1.setDisabled(true);
		Input9Copy1.setDisabled(true);
		Input10Copy1.setDisabled(true);
		RadioGroup2Copy1.setDisabled(true);
		Input6Copy1.setDisabled(true);
		RadioGroup3Copy1.setDisabled(true);
		Input7Copy1.setDisabled(true);
		RadioGroup7Copy1.setDisabled(true);
		Input11Copy1.setDisabled(true);
		RadioGroup8Copy1.setDisabled(true);
		Input12Copy1.setDisabled(true);
		RadioGroup13Copy1.setDisabled(true);
		Input17Copy1.setDisabled(true);
		RadioGroup9VerificationCopy1.setDisabled(true);
		Input13Copy1.setDisabled(true);
		RadioGroup12OwnershipCopy1.setDisabled(true);
		Input16Copy1.setDisabled(true);
		RadioGroup11ResolutionCopy1.setDisabled(true);
		Input15Copy1.setDisabled(true);
		RadioGroup10TempoValuesCopy1.setDisabled(true);
		Input14Copy1.setDisabled(true);
	},

}

