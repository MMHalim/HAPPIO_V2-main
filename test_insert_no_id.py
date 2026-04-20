
import requests
import json

SUPABASE_URL = 'https://kupaxfvjfobfdgtbfnnt.supabase.co'
ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1cGF4ZnZqZm9iZmRndGJmbm50Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODQwNjAwOTgsImV4cCI6MTk5OTYzNjA5OH0.C-6VUYI6VT0qr39K5rTSLt_hq6Y-dRBjIm6Dr-OGsaw'

def test_insert_no_id():
    print("Testing insertion WITHOUT id field...")
    
    url = f"{SUPABASE_URL}/rest/v1/LoginData"
    
    # Payload WITHOUT id
    payload = {
        "agent_name": "Test Agent No ID",
        "agent_email": "test_noid@example.com",
        "status": "Test_Login_NoID"
    }
    
    headers = {
        "apikey": ANON_KEY,
        "Authorization": f"Bearer {ANON_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
    }
    
    try:
        response = requests.post(url, headers=headers, json=payload)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 201:
            print("SUCCESS: Inserted record without ID.")
        else:
            print(f"FAILED: {response.text}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_insert_no_id()
