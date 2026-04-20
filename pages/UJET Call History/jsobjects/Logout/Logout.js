export default {
	logOut: () => {
		removeValue("role");
		removeValue('login_token');
		// Also clear localStorage
		localStorage.removeItem('login_token');
		localStorage.removeItem('user_id');
		localStorage.removeItem('user_role');
		localStorage.removeItem('loggedInUserEmail');
		navigateTo('Login_Modern');
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
	}
}