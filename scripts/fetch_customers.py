import os
import json
import csv
import requests
import psycopg2
from dotenv import load_dotenv
from pathlib import Path

# Load .env from the project root
env_path = Path(__file__).resolve().parent.parent / ".env"
print("Loading .env from:", env_path)

load_dotenv(dotenv_path=env_path)

# Debug: print a few variables
print("JIRA_URL =", os.getenv("JIRA_BASE_URL"))

# Jira config from .env
JIRA_URL = os.getenv("JIRA_BASE_URL")  # e.g., https://cloud-hm.atlassian.net
WORKSPACE_ID = os.getenv("JIRA_WORKSPACE_ID")  # e.g., f3f38596-f7ca-487c-9b3c-bf6c2115aac5
OBJECT_SCHEMA_ID = os.getenv("JIRA_OBJECT_SCHEMA_ID")  # e.g., 8
OBJECT_TYPE_ID = os.getenv("JIRA_OBJECT_TYPE_ID")  # e.g., 101
JIRA_EMAIL = os.getenv("JIRA_EMAIL")
JIRA_API_TOKEN = os.getenv("JIRA_API_TOKEN")

# Create auth header from email and token
import base64
if JIRA_EMAIL and JIRA_API_TOKEN:
    auth_string = f"{JIRA_EMAIL}:{JIRA_API_TOKEN}"
    AUTH_HEADER = base64.b64encode(auth_string.encode()).decode()
else:
    AUTH_HEADER = os.getenv("JIRA_AUTH_HEADER")  # fallback to direct header

# Database config from .env
DATABASE_URL = os.getenv("DATABASE_URL")

# Parse DATABASE_URL for psycopg2
def parse_database_url(url):
    # Format: postgresql://admin:password@localhost:5432/watchover?schema=public
    import re
    match = re.match(r'postgresql://([^:]+):([^@]+)@([^:]+):(\d+)/([^?]+)', url)
    if match:
        return {
            'user': match.group(1),
            'password': match.group(2),
            'host': match.group(3),
            'port': int(match.group(4)),
            'database': match.group(5)  # This will be just 'watchover' now
        }
    return None

# Output paths (for backward compatibility/backup)
CSV_OUTPUT = "data/customers.csv"
JSON_OUTPUT = "data/customerMap.json"

# Jira AQL navlist endpoint
url = f"{JIRA_URL}gateway/api/jsm/assets/workspace/{WORKSPACE_ID}/v1/object/navlist/aql"

headers = {
    "Authorization": f"Basic {AUTH_HEADER}",
    "Content-Type": "application/json",
    "Accept": "application/json"
    # 'Cookie': 'atlassian.xsrf.token=e5a6af5ae8813c4473dc2f4a709d21fef81d3f6c_lin'
}

payload = json.dumps({
    "objectTypeId": OBJECT_TYPE_ID,
    "objectSchemaId": OBJECT_SCHEMA_ID,
    "includeAttributes": True,
    "page": 1,
    "resultsPerPage": 2000
})

def store_customers_in_db(customers):
    """Store customer data directly in PostgreSQL database"""
    db_config = parse_database_url(DATABASE_URL)
    if not db_config:
        print("❌ Failed to parse DATABASE_URL")
        return False
    
    try:
        # Connect to PostgreSQL
        conn = psycopg2.connect(**db_config)
        cursor = conn.cursor()
        
        # Clear existing customers (optional - you might want to update instead)
        print("🗑️ Clearing existing customer records...")
        cursor.execute("DELETE FROM customers")
        
        # Insert new customers
        print(f"📝 Inserting {len(customers)} customer records...")
        for customer in customers:
            cursor.execute(
                """
                INSERT INTO customers ("objectId", name, "objectKey", "createdAt", "updatedAt") 
                VALUES (%s, %s, %s, NOW(), NOW())
                ON CONFLICT ("objectId") 
                DO UPDATE SET name = EXCLUDED.name, "updatedAt" = NOW()
                """,
                (customer['objectId'], customer['label'], None)
            )
        
        # Commit changes
        conn.commit()
        cursor.close()
        conn.close()
        
        print(f"✅ Successfully stored {len(customers)} customers in database")
        return True
        
    except Exception as e:
        print(f"❌ Database error: {e}")
        return False

try:
    print("🔄 Fetching customer data from JIRA...")
    response = requests.post(url, headers=headers, data=payload)
    response.raise_for_status()
    data = response.json()

    results = []
    id_to_name = {}

    for item in data.get("objectEntries", data.get("values", [])):
        obj_id = str(item.get("id"))
        label = item.get("label")

        if obj_id and label:
            results.append({"objectId": obj_id, "label": label})
            id_to_name[obj_id] = label

    print(f"📊 Found {len(results)} customers from JIRA")

    # Store in database
    if results:
        success = store_customers_in_db(results)
        if not success:
            print("❌ Failed to store in database, falling back to files...")
    
    # Also save to files as backup (optional)
    os.makedirs("data", exist_ok=True)
    with open(CSV_OUTPUT, "w", newline='', encoding='utf-8') as file:
        writer = csv.DictWriter(file, fieldnames=["objectId", "label"])
        writer.writeheader()
        writer.writerows(results)
    print(f"✅ Backup CSV saved to {CSV_OUTPUT}")

    with open(JSON_OUTPUT, "w", encoding="utf-8") as json_file:
        json.dump(id_to_name, json_file, ensure_ascii=False, indent=2)
    print(f"✅ Backup JSON saved to {JSON_OUTPUT}")

except Exception as e:
    print(f"❌ Failed to fetch customer data: {e}")
