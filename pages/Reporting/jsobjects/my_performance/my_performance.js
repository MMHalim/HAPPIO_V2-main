export default {
	my_search: async function() {
		await my_figures_T1_user.run();
		const responseData = my_figures_T1_user.data;
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
			averageScore = (sum / count).toFixed(0); 
		}
		console.log("Average Score:", averageScore);
		return averageScore + '%';
	},
	my_search_allusers: async function() {
		await my_figures_T1_alluser.run()();
		const responseData = my_figures_T1_user.data;
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
			averageScore = (sum / count).toFixed(0); 
		}
		console.log("Average Score:", averageScore);
		return averageScore + '%';
	},

	run: function () {
		if (Input2Copy.filterText === "") {
			return my_figures_T1_alluser.run();
		} else {
			return my_figures_T1_user.run();
		}
	}
}