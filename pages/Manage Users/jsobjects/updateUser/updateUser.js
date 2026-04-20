export default {
	updateUsers: async () => {
		if (1 === 1) { // Note: Use triple equals (===) for comparison, not single equals (=)
			await Update_users.run();
			await Read_all_users.run();
		}
	},

	logOut: () => {
		Object.keys(appsmith.store)
			.map(key => storeValue(key, undefined));
		navigateTo('Login_Modern')
	},

	role_count: function(){
		const adata = Read_all_users.data;
		const targetRole = ['Administrator','QA Coach','Trainer','Team Leader','MX-T1 User','MX-T2 OS User','MX-T2 PS User'];
		const resultCounts = {};
		for (const entry of adata) {
			if (targetRole.includes(entry.user_role)) {
				if (!resultCounts[entry.user_role]) {
					resultCounts[entry.user_role] = 1;
				} else {
					resultCounts[entry.user_role]++;
				}
			}
		}
		console.log("Counts for each Taker_Name:");
		for (const name in resultCounts) {
			// var result = (`- ${name}: ${resultCounts[name]}`);
		}
		return resultCounts;
	},

	role_countAll: function(){
		const all_user = Read_all_users.data.length;
		return all_user;
	},
	
	delete_user: async function (){
		await Delete_User.run();
	}
}
