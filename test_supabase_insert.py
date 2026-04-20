
import requests
import json
import time

SUPABASE_URL = 'https://kupaxfvjfobfdgtbfnnt.supabase.co'
ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1cGF4ZnZqZm9iZmRndGJmbm50Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODQwNjAwOTgsImV4cCI6MTk5OTYzNjA5OH0.C-6VUYI6VT0qr39K5rTSLt_hq6Y-dRBjIm6Dr-OGsaw'

def test_login_data_insert():
    print("Testing insertion into LoginData table...")
    
    # We need a valid JWT token to write if RLS is enabled for authenticated users only
    # But first, let's try with just the ANON key to see if it's open (unlikely)
    # Or we need to simulate a login to get a token.
    
    # Since I don't have a user's password, I can't easily generate a token here without user interaction.
    # However, I can try to see if I can read from the table or if I get a specific error.
    
    url = f"{SUPABASE_URL}/rest/v1/LoginData"
    
    # Test Payload
    payload = {
        "id": 11, # Using the ID from the user's example
        "agent_name": "Test Agent",
        "agent_email": "test@example.com",
        "status": "Test_Login"
    }
    
    headers = {
        "apikey": ANON_KEY,
        "Authorization": f"Bearer {ANON_KEY}", # Trying with Anon first
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
    }
    
    try:
        response = requests.post(url, headers=headers, json=payload)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 201:
            print("SUCCESS: Inserted record with Anon key.")
        else:
            print("FAILED with Anon key. This is expected if RLS requires auth.")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_login_data_insert()
