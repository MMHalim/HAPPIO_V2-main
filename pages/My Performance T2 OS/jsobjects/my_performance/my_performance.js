export default {
	
	searchOS: function(){
		if(my_performance.my_search.data.length > 0)
			my_performance.my_search.call();
 },

modalPop: function() {
  if (Select1.selectedOptionValue === "T2_OS_NEW_2025") {
    showModal(Modal1.name);
 } else if (Select1.selectedOptionValue === "T1_QA_New_Scorecards") {
    showModal(Modal1Copy.name);
 } else {
    showAlert("Please Select Scorecard !");
 }
},

	getSatisfaction: () => {
		const dataSource = {
			chart: {
				subCaption: "(Average Quality Score based on selected date range)",
				subCaptionFontColor: "#000000",
				lowerlimit: "0",
				upperlimit: "100",
				showvalue: "1",
				numbersuffix: "%",
				theme: "fusion",
				showtooltip: "0",
 },
			colorrange: {
				color: [
					{
						minvalue: "0",
						maxvalue: "25",
						code: "#b91c1c",
 },
					{
						minvalue: "25",
						maxvalue: "50",
						code: "#ef4444",
 },
					{
						minvalue: "50",
						maxvalue: "75",
						code: "#fef08a",
 },
					{
						minvalue: "75",
						maxvalue: "100",
						code: "#62B58F",
 },
				],
 },
			dials: {
				dial: [
					{
						value: TextScore.text.replace('%',''),
 },
				],
 },
			trendpoints: {
				point: [
					{
						startvalue: "90",
						displayvalue: "90% Target",
						thickness: "2",
						color: "#000000",
						usemarker: "1",
						markerbordercolor: "#000000",
						markertooltext: "80%",
 },
				],
 },
 };

		return {
			type: "angulargauge",
			dataFormat: "json",
			dataSource,
 };
 },
	my_search: async function() {
		await my_figures.run();
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
 }
}

