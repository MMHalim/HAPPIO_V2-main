// Test script to verify Supabase connection
const testSupabaseConnection = async () => {
  const SUPABASE_URL = 'https://kupaxfvjfobfdgtbfnnt.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1cGF4ZnZqZm9iZmRndGJmbm50Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODQwNjAwOTgsImV4cCI6MTk5OTYzNjA5OH0.C-6VUYI6VT0qr39K5rTSLt_hq6Y-dRBjIm6Dr-OGsaw';

  try {
    
    // Test authentication endpoint
    const authResponse = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
 },
      body: JSON.stringify({
        email: 'someone@email.com',
        password: 'FjTfHUrrCZpwTrJYyBxH'
 })
 });

    if (authResponse.ok) {
      const authData = await authResponse.json();
 } else {
 }

    // Test REST API endpoint
    const restResponse = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
 }
 });

    if (restResponse.ok) {
 } else {
 }

 } catch (error) {
    console.error('❌ Connection test failed:', error.message);
 }
};

// Run the test
testSupabaseConnection();
