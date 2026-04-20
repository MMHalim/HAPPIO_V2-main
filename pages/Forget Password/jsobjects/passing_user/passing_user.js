export default {
	getemail: ()=> {

		const retrievedValue = appsmith.store.myKey;
		return retrievedValue;

	},

	validation: ()=>{
		if (Input1Copy.inputText !== Input1.inputText || Input1Copy.inputText == "" || Input1.inputText == "" ) {
			showAlert("Password Mismatch, Please try again");
		}else{
			showAlert("Password Changed Successfully, Redirecting to Login Page....");
			navigateTo("Login");
		}
	},

	submit: async function () {
		Update_Password.run();
		// passing_user.validation();
	}

}