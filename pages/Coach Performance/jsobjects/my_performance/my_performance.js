export default {

	day: function(){
		const currentDate = new Date();
		const formattedDate = currentDate.toISOString().slice(0, 10);
		formattedDate;
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
		await SM.run();
		await QA_Attendance.run();
		my_performance.my_search_T1();
		my_performance.my_search_OS();
		my_performance.my_search_PS();
		my_performance.my_search_SM();
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
		return averageScore + '%';
 },
	edit: function (){
		InputCahnnel.setVisibility(true);
		Text119Copy3.setVisibility(true);
		Text119Copy2.setVisibility(true);
		Button2Copy.setVisibility(true);
		Button2.setVisibility(true);
		Introduction.setDisabled(false); // interaction protocols
		RadioGroup5.setDisabled(false);  // Understanding
		RadioGroup2.setDisabled(false);  // responsiveness
		RadioGroup3.setDisabled(false);  // Effectiveness
		RadioGroup4.setDisabled(false);  //SoftSkills
		RadioGroup7.setDisabled(false);  //Language
		RadioGroup8.setDisabled(false);  // FCR
		RadioGroup9Verification.setDisabled(false); // Ownerships
		RadioGroup12Ownership.setDisabled(false);  // Product Awareness
		RadioGroup10TempoValues.setDisabled(false);  // Tempovalues
		RadioGroup11Resolution.setDisabled(false);  // Process awareness
		RadioGroup13.setDisabled(false);  // Documentation
		RadioGroup14.setDisabled(false);  // CRM Updates
		RadioGroup14Copy.setDisabled(false);  // Workflow
		Introduction_C.setDisabled(false); // comment interaction protocols
		Input9.setDisabled(false);  // comment understanding
		Input6.setDisabled(false);  // comment responsiveness
		Input7.setDisabled(false);  // comment Effectiveness
		Input8.setDisabled(false);  // comment Softskills
		Input11.setDisabled(false);  // comment Language
		Input12.setDisabled(false);  // comment FCR
		Input13.setDisabled(false);  // comment Ownership
		Input16.setDisabled(false);  // comment Product awareness
		Input14.setDisabled(false);  // comment Tempovalues
		Input15.setDisabled(false);  // comment Process awareness
		Input17.setDisabled(false);  // comment Documentation
		Input18.setDisabled(false);  // comment CRM Updates
		Input18Copy.setDisabled(false);  // comment Workflow
		Input16Copy.setDisabled(false); // comment Verification
		RadioGroup12OwnershipCopy.setDisabled(false); // Verification

 },
	discard: function () {
		InputCahnnel.setVisibility(false);
		Text119Copy3.setVisibility(false);
		Text119Copy2.setVisibility(false);
		Button2Copy.setVisibility(false);
		Button2.setVisibility(false);
		Introduction.setDisabled(true); // interaction protocols
		RadioGroup5.setDisabled(true);  // Understanding
		RadioGroup2.setDisabled(true);  // responsiveness
		RadioGroup3.setDisabled(true);  // Effectiveness
		RadioGroup4.setDisabled(true);  //SoftSkills
		RadioGroup7.setDisabled(true);  //Language
		RadioGroup8.setDisabled(true);  // FCR
		RadioGroup9Verification.setDisabled(true); // Ownerships
		RadioGroup12Ownership.setDisabled(true);  // Product Awareness
		RadioGroup10TempoValues.setDisabled(true);  // Tempovalues
		RadioGroup11Resolution.setDisabled(true);  // Process awareness
		RadioGroup13.setDisabled(true);  // Documentation
		RadioGroup14.setDisabled(true);  // CRM Updates
		RadioGroup14Copy.setDisabled(true);  // Workflow
		Introduction_C.setDisabled(true); // comment interaction protocols
		Input9.setDisabled(true);  // comment understanding
		Input6.setDisabled(true);  // comment responsiveness
		Input7.setDisabled(true);  // comment Effectiveness
		Input8.setDisabled(true);  // comment Softskills
		Input11.setDisabled(true);  // comment Language
		Input12.setDisabled(true);  // comment FCR
		Input13.setDisabled(true);  // comment Ownership
		Input16.setDisabled(true);  // comment Product awareness
		Input14.setDisabled(true);  // comment Tempovalues
		Input15.setDisabled(true);  // comment Process awareness
		Input17.setDisabled(true);  // comment Documentation
		Input18.setDisabled(true);  // comment CRM Updates
		Input18Copy.setDisabled(true);  // comment Workflow
		Input16Copy.setDisabled(true); // comment Verification
		RadioGroup12OwnershipCopy.setDisabled(true); // Verification

 },
	calculateTotal: function () {
		const group1 = [Introduction.selectedOptionValue, RadioGroup2.selectedOptionValue, RadioGroup14.selectedOptionValue];
		const group2 = [RadioGroup5.selectedOptionValue, RadioGroup4.selectedOptionValue, RadioGroup8.selectedOptionValue];
		const group3 = [RadioGroup10TempoValues.selectedOptionValue,	RadioGroup12OwnershipCopy.selectedOptionValue,	RadioGroup9Verification.selectedOptionValue,	RadioGroup12Ownership.selectedOptionValue,	RadioGroup11Resolution.selectedOptionValue];
		const group4 = [RadioGroup7.selectedOptionValue,	RadioGroup3.selectedOptionValue,	RadioGroup14Copy.selectedOptionValue,	RadioGroup13.selectedOptionValue];

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
		const group1 = [Interaction_Protocols.selectedOptionValue, CRM_Updates.selectedOptionValue];

		const group2 = [Effectiveness___FCR.selectedOptionValue, Offering_Alternatives.selectedOptionValue, Documentation.selectedOptionValue];

		const group3 = [Product_Awareness.selectedOptionValue, Process_Awareness.selectedOptionValue, Tempo_Values.selectedOptionValue, Verfication.selectedOptionValue, Verfication.selectedOptionValue];

		const group4 = [Understanding.selectedOptionValue, Engagement___Langauge.selectedOptionValue, Retention_Skills.selectedOptionValue, Workflow.selectedOptionValue];

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
		InputCahnnel.setVisibility(true);
		Interaction_Protocols.setDisabled(false);
		Comment_Interaction_Protocols.setDisabled(false);
		Understanding.setDisabled(false);
		Comment_Understanding.setDisabled(false);
		Engagement___Langauge.setDisabled(false);
		Comment_Engagement___Langauge.setDisabled(false);
		Effectiveness___FCR.setDisabled(false);
		Comment_Effectiveness___FCR.setDisabled(false);
		Retention_Skills.setDisabled(false);
		Comment_Retention_Skills.setDisabled(false);
		Offering_Alternatives.setDisabled(false);
		Comment_Offering_Alternatives.setDisabled(false);
		Product_Awareness.setDisabled(false);
		Comment_Product_Awareness.setDisabled(false);
		Process_Awareness.setDisabled(false);
		Comment_Process_Awareness.setDisabled(false);
		ownershipas.setDisabled(false);
		Comment_ownership.setDisabled(false);
		Tempo_Values.setDisabled(false);
		Comment_Tempo_Values.setDisabled(false);
		Verfication.setDisabled(false);
		Comment_Verfication.setDisabled(false);
		CRM_Updates.setDisabled(false);
		Comment_CRM_Updates.setDisabled(false);
		Documentation.setDisabled(false);
		Comment_Documentation.setDisabled(false);
		Workflow.setDisabled(false);
		Comment_Workflow.setDisabled(false);

 },
	discardOS: function(){
		Button2CopyCopy1.setVisibility(false);
		Button2Copy2.setVisibility(false);
		Text119Copy2Copy.setVisibility(false);
		Text119Copy3Copy.setVisibility(false);
			InputCahnnel.setVisibility(true);
		Interaction_Protocols.setDisabled(true);
		Comment_Interaction_Protocols.setDisabled(true);
		Understanding.setDisabled(true);
		Comment_Understanding.setDisabled(true);
		Engagement___Langauge.setDisabled(true);
		Comment_Engagement___Langauge.setDisabled(true);
		Effectiveness___FCR.setDisabled(true);
		Comment_Effectiveness___FCR.setDisabled(true);
		Retention_Skills.setDisabled(true);
		Comment_Retention_Skills.setDisabled(true);
		Offering_Alternatives.setDisabled(true);
		Comment_Offering_Alternatives.setDisabled(true);
		Product_Awareness.setDisabled(true);
		Comment_Product_Awareness.setDisabled(true);
		Process_Awareness.setDisabled(true);
		Comment_Process_Awareness.setDisabled(true);
		ownershipas.setDisabled(true);
		Comment_ownership.setDisabled(true);
		Tempo_Values.setDisabled(true);
		Comment_Tempo_Values.setDisabled(true);
		Verfication.setDisabled(true);
		Comment_Verfication.setDisabled(true);
		CRM_Updates.setDisabled(true);
		Comment_CRM_Updates.setDisabled(true);
		Documentation.setDisabled(true);
		Comment_Documentation.setDisabled(true);
		Workflow.setDisabled(true);
		Comment_Workflow.setDisabled(true);
 },
	calculateTotalPS: function () {
		const group1 = [IntroductionCopy.selectedOptionValue, Closure.selectedOptionValue, Empathy.selectedOptionValue, Positive_Attitude.selectedOptionValue];
		const group2 = [Professionalism.selectedOptionValue, Active_Listening.selectedOptionValue, Friendly_and_Engaging.selectedOptionValue, Language_Skills.selectedOptionValue, CRM_UpdatesCopy.selectedOptionValue];
		const group3 = [Knowledge.selectedOptionValue, Accuracy.selectedOptionValue, Follow_Up.selectedOptionValue, Brand_Representation.selectedOptionValue, Appropriate_Comments.selectedOptionValue];
		const group4 = [Explanation.selectedOptionValue, DocumentationCopy.selectedOptionValue];
		const valuesAssignedg1 = group1.map(value => value === "Yes" ? 5 : (value === "N/A" ? 5 : 0));
		const valuesAssignedg2 = group2.map(value => value === "Yes" ? 10 : 0);
		const valuesAssignedg3 = group3.map(value => value === "No" ? 1 : 0);
		const valuesAssignedg4 = group4.map(value => value === "Yes" ? 15 : 0);

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
		IntroductionCopy.setDisabled(false);
		com_Introduction.setDisabled(false);
		Professionalism.setDisabled(false);
		com_Professionalism.setDisabled(false);
		Closure.setDisabled(false);
		com_Closure.setDisabled(false);
		Active_Listening.setDisabled(false);
		com_Active_Listening.setDisabled(false);
		Empathy.setDisabled(false);
		com_Empathy.setDisabled(false);
		Positive_Attitude.setDisabled(false);
		com_Positive_Attitude.setDisabled(false);
		Friendly_and_Engaging.setDisabled(false);
		com_Friendly_and_Engaging.setDisabled(false);
		Language_Skills.setDisabled(false);
		com_Language_Skills.setDisabled(false);
		Explanation.setDisabled(false);
		com_Explanation.setDisabled(false);
		Knowledge.setDisabled(false);
		com_Knowledge.setDisabled(false);
		Accuracy.setDisabled(false);
		com_Accuracy.setDisabled(false);
		Follow_Up.setDisabled(false);
		com_Follow_Up.setDisabled(false);
		Brand_Representation.setDisabled(false);
		com_Brand_Representation.setDisabled(false);
		Appropriate_Comments.setDisabled(false);
		com_Appropriate_Comments.setDisabled(false);
		CRM_UpdatesCopy.setDisabled(false);
		com_CRM_Updates.setDisabled(false);
		DocumentationCopy.setDisabled(false);
		com_Documentation.setDisabled(false);

 },

	discardPS: function() {
		Text119Copy2CopyCopy.setVisibility(false);
		Text119Copy3CopyCopy.setVisibility(false);
		Button2CopyCopy1Copy.setVisibility(false);
		Button2Copy2Copy.setVisibility(false);
		IntroductionCopy.setDisabled(true);
		com_Introduction.setDisabled(true);
		Professionalism.setDisabled(true);
		com_Professionalism.setDisabled(true);
		Closure.setDisabled(true);
		com_Closure.setDisabled(true);
		Active_Listening.setDisabled(true);
		com_Active_Listening.setDisabled(true);
		Empathy.setDisabled(true);
		com_Empathy.setDisabled(true);
		Positive_Attitude.setDisabled(true);
		com_Positive_Attitude.setDisabled(true);
		Friendly_and_Engaging.setDisabled(true);
		com_Friendly_and_Engaging.setDisabled(true);
		Language_Skills.setDisabled(true);
		com_Language_Skills.setDisabled(true);
		Explanation.setDisabled(true);
		com_Explanation.setDisabled(true);
		Knowledge.setDisabled(true);
		com_Knowledge.setDisabled(true);
		Accuracy.setDisabled(true);
		com_Accuracy.setDisabled(true);
		Follow_Up.setDisabled(true);
		com_Follow_Up.setDisabled(true);
		Brand_Representation.setDisabled(true);
		com_Brand_Representation.setDisabled(true);
		Appropriate_Comments.setDisabled(true);
		com_Appropriate_Comments.setDisabled(true);
		CRM_UpdatesCopy.setDisabled(true);
		com_CRM_Updates.setDisabled(true);
		DocumentationCopy.setDisabled(true);
		com_Documentation.setDisabled(true);
 },

	editSM: function(){
		new_score_title.setVisibility(true);
		new_score.setVisibility(true);
		Button2CopyCopy1Copy1.setVisibility(true);
		Button2Copy2Copy1.setVisibility(true);
		AccuracyCopy.setDisabled(false);
		Relevance.setDisabled(false);
		Clarity.setDisabled(false);
		Tone.setDisabled(false);
		Responsiveness.setDisabled(false);
		EngagementCopy.setDisabled(false);
		Compliance.setDisabled(false);
		EmpathyCopy.setDisabled(false);
		Consistency.setDisabled(false);
		ResolutionCopy.setDisabled(false);
		comment_Accuracy.setDisabled(false);
		comment_Relevance.setDisabled(false);
		comment_Clarity.setDisabled(false);
		comment_Tone.setDisabled(false);
		comment_Responsiveness.setDisabled(false);
		comment_Engagement.setDisabled(false);
		comment_Compliance.setDisabled(false);
		comment_Empathy.setDisabled(false);
		comment_Consistency.setDisabled(false);
		comment_Resolution.setDisabled(false);
 },
	discardSM: function(){
		new_score_title.setVisibility(false);
		new_score.setVisibility(false);
		Button2CopyCopy1Copy1.setVisibility(false);
		Button2Copy2Copy1.setVisibility(false);
		AccuracyCopy.setDisabled(true);
		Relevance.setDisabled(true);
		Clarity.setDisabled(true);
		Tone.setDisabled(true);
		Responsiveness.setDisabled(true);
		EngagementCopy.setDisabled(true);
		Compliance.setDisabled(true);
		EmpathyCopy.setDisabled(true);
		Consistency.setDisabled(true);
		ResolutionCopy.setDisabled(true);
		comment_Accuracy.setDisabled(true);
		comment_Relevance.setDisabled(true);
		comment_Clarity.setDisabled(true);
		comment_Tone.setDisabled(true);
		comment_Responsiveness.setDisabled(true);
		comment_Engagement.setDisabled(true);
		comment_Compliance.setDisabled(true);
		comment_Empathy.setDisabled(true);
		comment_Consistency.setDisabled(true);
		comment_Resolution.setDisabled(true);
 },
	calculateTotalSM: function () {
		const group1 = [Tone?.selectedOptionValue];
		const group2 = [
			AccuracyCopy?.selectedOptionValue, EngagementCopy?.selectedOptionValue, 
			Clarity?.selectedOptionValue, Responsiveness?.selectedOptionValue, 
			EmpathyCopy?.selectedOptionValue, Consistency?.selectedOptionValue
		];
		const group3 = [
			Relevance?.selectedOptionValue, Compliance?.selectedOptionValue, 
			ResolutionCopy?.selectedOptionValue
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
	showdeleteSM: function(){
		Button2CopyCopyCopyCopy1.setVisibility(true);
		Button2Copy1CopyCopy1.setVisibility(true);
 },
	hidedeleteSM: function(){
		Button2CopyCopyCopyCopy1.setVisibility(false);
		Button2Copy1CopyCopy1.setVisibility(false);
 },
	my_search_SM: async function() {
		const responseData = SM.data;
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
		return averageScore + '%';
 }
}

