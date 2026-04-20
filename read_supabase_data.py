
import requests
import json

SUPABASE_URL = 'https://kupaxfvjfobfdgtbfnnt.supabase.co'
ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1cGF4ZnZqZm9iZmRndGJmbm50Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODQwNjAwOTgsImV4cCI6MTk5OTYzNjA5OH0.C-6VUYI6VT0qr39K5rTSLt_hq6Y-dRBjIm6Dr-OGsaw'

def read_login_data():
    print("Reading LoginData table...")
    
    url = f"{SUPABASE_URL}/rest/v1/LoginData?select=*"
    
    headers = {
        "apikey": ANON_KEY,
        "Authorization": f"Bearer {ANON_KEY}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.get(url, headers=headers)
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Record count: {len(data)}")
            if len(data) > 0:
                print("Sample Record:", json.dumps(data[0], indent=2))
                # Check for duplicate IDs
                ids = [r.get('id') for r in data]
                print(f"IDs found: {ids}")
        else:
            print(f"Error: {response.text}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    read_login_data()
