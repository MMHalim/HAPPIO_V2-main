export default {
	auditors: async function(){
		await MX_T1.run();
		await T2_OS.run();
		await T2_PS.run();
		await audit_count.audits_count();
		await audit_count.audits_count_os();
		await audit_count.audits_count_ps();
	},

	audits_count: function() {
		const adata = MX_T1.data;
		const targetNames = Input2.text;
		const resultCounts = {};
		for (const entry of adata) {
			if (targetNames.includes(entry.Taker_Name)) {
				if (!resultCounts[entry.Taker_Name]) {
					resultCounts[entry.Taker_Name] = 1;
				} else {
					resultCounts[entry.Taker_Name]++;
				}
			}
		}
		console.log("Counts for each Taker_Name:");
		for (const name in resultCounts) {
			console.log(`- ${name}: ${resultCounts[name]}`);
		}
		return resultCounts;
	},
	audits_count_os: function() {
		const adata = T2_OS.data;
		const targetNames = Input2.text;
		const resultCounts = {};
		for (const entry of adata) {
			if (targetNames.includes(entry.Taker_Name)) {
				if (!resultCounts[entry.Taker_Name]) {
					resultCounts[entry.Taker_Name] = 1;
				} else {
					resultCounts[entry.Taker_Name]++;
				}
			}
		}
		console.log("Counts for each Taker_Name:");
		for (const name in resultCounts) {
			console.log(`- ${name}: ${resultCounts[name]}`);
		}
		return resultCounts;
	},
	audits_count_ps: function() {
		const adata = T2_PS.data;
		const targetNames = Input2.text;
		const resultCounts = {};
		for (const entry of adata) {
			if (targetNames.includes(entry.Taker_Name)) {
				if (!resultCounts[entry.Taker_Name]) {
					resultCounts[entry.Taker_Name] = 1;
				} else {
					resultCounts[entry.Taker_Name]++;
				}
			}
		}
		console.log("Counts for each Taker_Name:");
		for (const name in resultCounts) {
			console.log(`- ${name}: ${resultCounts[name]}`);
		}
		return resultCounts;
	},
  getDeliveries: () => {
    const dataSource = {
      chart: {
        xAxisname: "Month",
        yAxisName: "Number of orders",
        theme: "fusion",
        palette: "2",
        paletteColors: "#00BC62, #7441F6",
      },
      categories: [
        {
          category: [
            {
              label: "Jan",
            },
            {
              label: "Feb",
            },
            {
              label: "Mar",
            },
            {
              label: "Apr",
            },
            {
              label: "May",
            },
            {
              label: "Jun",
            },
            {
              label: "Jul",
            },
            {
              label: "Aug",
            },
            {
              label: "Sep",
            },
            {
              label: "Oct",
            },
            {
              label: "Nov",
            },
            {
              label: "Dec",
            },
          ],
        },
      ],
      dataset: [
        {
          seriesname: "Expected",
          data: [
            {
              value: monthlyExpectedDeliveryDates.data[0].value,
            },
            {
              value: monthlyExpectedDeliveryDates.data[1].value,
            },
            {
              value: monthlyExpectedDeliveryDates.data[2].value,
            },
            {
              value: monthlyExpectedDeliveryDates.data[3].value,
            },
            {
              value: monthlyExpectedDeliveryDates.data[4].value,
            },
            {
              value: monthlyExpectedDeliveryDates.data[5].value,
            },
            {
              value: monthlyExpectedDeliveryDates.data[6].value,
            },
            {
              value: monthlyExpectedDeliveryDates.data[7].value,
            },
            {
              value: monthlyExpectedDeliveryDates.data[8].value,
            },
            {
              value: monthlyExpectedDeliveryDates.data[9].value,
            },
            {
              value: monthlyExpectedDeliveryDates.data[10].value,
            },
            {
              value: monthlyExpectedDeliveryDates.data[11].value,
            },
          ],
        },
        {
          seriesname: "Actual",
          data: [
            {
              value: monthlyDeliveryDates.data[0].value,
            },
            {
              value: monthlyDeliveryDates.data[1].value,
            },
            {
              value: monthlyDeliveryDates.data[2].value,
            },
            {
              value: monthlyDeliveryDates.data[3].value,
            },
            {
              value: monthlyDeliveryDates.data[4].value,
            },
            {
              value: monthlyDeliveryDates.data[5].value,
            },
            {
              value: monthlyDeliveryDates.data[6].value,
            },
            {
              value: monthlyDeliveryDates.data[7].value,
            },
            {
              value: monthlyDeliveryDates.data[8].value,
            },
            {
              value: monthlyDeliveryDates.data[9].value,
            },
            {
              value: monthlyDeliveryDates.data[10].value,
            },
            {
              value: monthlyDeliveryDates.data[11].value,
            },
          ],
        },
      ],
    };

    return {
      type: "mscolumn2d",
      dataFormat: "json",
      dataSource,
    };
  },
	
}