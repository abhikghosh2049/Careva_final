import os
from firebase_admin import initialize_app, credentials

# Use the native Google Cloud Firestore client
from google.cloud import firestore
from google.cloud.firestore_v1.base_query import FieldFilter
import json
import asyncio  # Keep asyncio for the main runner, but functions will be sync

# --- Firestore Initialization ---
# Use environment variables provided by the platform
app_id = os.environ.get("__app_id", "default-app-id")  # Default for local testing

try:
    # Initialize firebase-admin (for auth, finding project ID via ADC)
    initialize_app()
    print("Firebase Admin initialized (using default credentials).")

    # --- Use google.cloud.firestore.Client and pass database ID ---
    db = firestore.Client(database="ttyt")
    print("Firestore client created successfully (connected to 'ttyt' database).")

except Exception as e:
    print(f"Error initializing Firebase/Firestore: {e}")
    db = None


# --- Firestore Query Function (Now Synchronous) ---
def find_doctors_by_specialty(specialty: str):
    """Queries the public doctors collection for matches synchronously."""
    if not db:
        print("Firestore client not available.")
        return []

    # Ensure collection path uses the correct app_id from environment
    doctors_ref = db.collection(f"artifacts/{app_id}/public/data/doctors")

    # Capitalize to match the sample data
    query = doctors_ref.where(
        filter=FieldFilter("specialty", "==", specialty.capitalize())
    )

    try:
        # Use synchronous stream
        docs_stream = query.stream()

        results = []
        for doc in docs_stream:  # Iterate synchronously
            doctor_data = doc.to_dict()
            results.append(
                {
                    "name": doctor_data.get("name", "N/A"),
                    "specialty": doctor_data.get("specialty", "N/A"),
                    "contact": doctor_data.get("contact_info", "N/A"),
                    "location": doctor_data.get("location", "N/A"),
                }
            )
        print(f"Found {len(results)} doctors for specialty '{specialty}'")
        return results
    except Exception as e:
        print(f"Firestore query error: {e}")
        return []


# --- Function to add sample data (Now Synchronous) ---
def add_sample_doctors():
    if not db:
        print("Firestore client not available. Cannot add sample data.")
        return

    doctors_data = [
        {
            "name": "Dr. Priya Sharma",
            "specialty": "Cardiology",
            "contact_info": "9876543210",
            "location": "Rajpur Sonarpur Clinic A",
        },
        {
            "name": "Dr. Amit Roy",
            "specialty": "Dermatology",
            "contact_info": "9123456789",
            "location": "Rajpur Sonarpur Skin Center",
        },
        {
            "name": "Dr. Sneha Das",
            "specialty": "General Physician",
            "contact_info": "9988776655",
            "location": "Rajpur Sonarpur Health Hub",
        },
        {
            "name": "Dr. Vikram Singh",
            "specialty": "Cardiology",
            "contact_info": "9234567890",
            "location": "Apollo Clinic, Garia",
        },
    ]

    # Ensure collection path uses the correct app_id from environment
    collection_ref = db.collection(f"artifacts/{app_id}/public/data/doctors")
    print(
        f"Attempting to add sample data to: artifacts/{app_id}/public/data/doctors in database 'ttyt'"
    )

    added_count = 0
    errors = 0
    # Use batch writer for potentially faster writes
    batch = db.batch()
    doctors_added_names = set()  # To track added names within the batch

    for doctor in doctors_data:
        try:
            # Check if doctor with the same name already exists to avoid duplicates
            existing_docs_stream = (
                collection_ref.where(filter=FieldFilter("name", "==", doctor["name"]))
                .limit(1)
                .stream()
            )
            doc_exists = False
            # Iterate synchronously
            for _ in existing_docs_stream:
                doc_exists = True
                break  # Found one, no need to continue

            if not doc_exists and doctor["name"] not in doctors_added_names:
                doc_ref = collection_ref.document()  # Let Firestore generate ID
                batch.set(doc_ref, doctor)
                doctors_added_names.add(doctor["name"])
                added_count += 1
            elif doctor["name"] not in doctors_added_names:
                print(f"Doctor '{doctor['name']}' already exists in DB. Skipping.")
            # If name is in doctors_added_names, it's already in this batch, skip adding again.

        except Exception as e:
            print(f"Error preparing batch for doctor {doctor['name']}: {e}")
            errors += 1

    try:
        batch.commit()  # Commit the batch synchronously
        print(
            f"Sample data population complete. Added: {added_count}, Errors during prep: {errors}"
        )
    except Exception as e:
        print(f"Error committing batch to Firestore: {e}")


# Example of how to run the data population (do this once manually)
# Uncomment the following lines and run `python backend/database.py` from your root directory
# Make sure your Firebase environment variables are set correctly before running.
#if __name__ == "__main__":
 #   # No async needed here anymore
   # add_sample_doctors()
