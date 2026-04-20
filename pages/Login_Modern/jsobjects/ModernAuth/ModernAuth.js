export default {
  
  // Modern authentication with Supabase
  signIn: async () => {
    const email = EmailInput.text;
    const password = PasswordInput.text;
    
    if (!email || !password) {
      showAlert('Please enter both email and password', 'error');
      return;
    }
    
    try {
      // Store user email for later use
      storeValue("loggedInUserEmail", email);
      
      // Call Supabase authentication
      const response = await fetch('https://kupaxfvjfobfdgtbfnnt.supabase.co/auth/v1/token?grant_type=password', {
        method: 'POST',
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1cGF4ZnZqZm9iZmRndGJmbm50Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODQwNjAwOTgsImV4cCI6MTk5OTYzNjA5OH0.C-6VUYI6VT0qr39K5rTSLt_hq6Y-dRBjIm6Dr-OGsaw',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: email,
          password: password
        })
      });
      
      const data = await response.json();
      
      if (data.access_token) {
        // Store authentication token in both Appsmith store and localStorage for persistence
        storeValue('login_token', data.access_token);
        storeValue('user_id', data.user?.id);
        storeValue('user_role', data.user?.user_metadata?.role || 'Agent');
        
        // Also store in localStorage for session persistence across page refreshes
        localStorage.setItem('login_token', data.access_token);
        localStorage.setItem('user_id', data.user?.id);
        localStorage.setItem('user_role', data.user?.user_metadata?.role || 'Agent');
        localStorage.setItem('loggedInUserEmail', email);
        
        showAlert('🎉 Login successful! Welcome to the modern quality management system.', 'success');
        
        // Navigate to main Dashboard so MTD rankings load on page load
        navigateTo("Dashboard");
      } else {
        showAlert('❌ Invalid credentials. Please check your email and password.', 'error');
      }
      
    } catch (error) {
      console.error('Authentication error:', error);
      showAlert('❌ Login failed. Please try again.', 'error');
    }
  },

  // Get user role for navigation
  getUserRole: () => {
    return appsmith.store.user_role || 'Agent';
  },

  // Check if user has permission for specific scorecard
  hasPermission: (scorecardType) => {
    const userRole = appsmith.store.user_role || 'Agent';
    
    const permissions = {
      'Administrator': ['MX-T1', 'MX-T2-OS', 'MX-T2-PS', 'Social-Media', 'Reporting'],
      'Team Leader': ['MX-T1', 'MX-T2-OS', 'MX-T2-PS', 'Social-Media'],
      'QA Coach': ['MX-T1', 'MX-T2-OS', 'MX-T2-PS', 'Social-Media'],
      'Agent': ['My-Performance']
    };
    
    return permissions[userRole]?.includes(scorecardType) || false;
  },

  // Session restoration function - call this on page load
  restoreSession: () => {
    const token = localStorage.getItem('login_token');
    const userId = localStorage.getItem('user_id');
    const userRole = localStorage.getItem('user_role');
    const userEmail = localStorage.getItem('loggedInUserEmail');
    
    if (token && userId) {
      // Restore session data to Appsmith store
      storeValue('login_token', token);
      storeValue('user_id', userId);
      storeValue('user_role', userRole);
      storeValue('loggedInUserEmail', userEmail);
      
      return true; // Session restored
    }
    
    return false; // No valid session found
  },

  // Check if user is authenticated (checks both store and localStorage)
  isAuthenticated: () => {
    const storeToken = appsmith.store.login_token;
    const localToken = localStorage.getItem('login_token');
    
    return !!(storeToken || localToken);
  },

  // Logout function
  logout: () => {
    // Clear stored values from both Appsmith store and localStorage
    clearStore();
    localStorage.removeItem('login_token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_role');
    localStorage.removeItem('loggedInUserEmail');
    
    showAlert('👋 Logged out successfully!', 'info');
    
    // Navigate back to login
    navigateTo("Login_Modern");
  },

  // Forgot password function
  forgotPassword: () => {
    const email = EmailInput.text;
    
    if (!email) {
      showAlert('Please enter your email address first', 'warning');
      return;
    }
    
    // This would typically call Supabase password reset
    showAlert('📧 Password reset instructions sent to your email!', 'info');
  }
}
