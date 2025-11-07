import json
import os
from datetime import datetime

# Use backend folder - this script is already in backend directory
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(BASE_DIR, "reflections.json")

def add_reflection():
    print("=" * 50)
    print("    ADD NEW REFLECTION - FLASK BACKEND")
    print("=" * 50)
    
    # Ask user for input
    name = input("Enter your name: ").strip()
    if not name:
        name = "Anonymous"
    
    reflection_text = input("Enter your reflection: ").strip()
    if not reflection_text:
        print("❌ Reflection cannot be empty!")
        return
    
    # New reflection to add
    new_reflection = {
        "name": name,
        "date": datetime.now().strftime("%a %b %d %Y"),
        "reflection": reflection_text
    }
    
    # Load existing data
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, "r", encoding='utf-8') as f:
            try:
                reflections = json.load(f)
                print(f"📁 Loaded {len(reflections)} existing reflections")
            except json.JSONDecodeError:
                reflections = []
                print("⚠️  File exists but is empty or corrupted, starting fresh")
    else:
        reflections = []
        print("📝 Creating new reflections file")
    
    # Append new entry
    reflections.append(new_reflection)
    
    # Save back to JSON
    with open(DATA_FILE, "w", encoding='utf-8') as f:
        json.dump(reflections, f, indent=2)
    
    print(f"✅ Reflection added successfully!")
    print(f"📊 Total reflections: {len(reflections)}")
    print(f"📅 Date: {new_reflection['date']}")
    print(f"👤 Name: {new_reflection['name']}")
    print(f"💭 Reflection: {new_reflection['reflection'][:50]}...")

def view_reflections():
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, "r", encoding='utf-8') as f:
            try:
                reflections = json.load(f)
                print(f"\n📚 REFLECTIONS ({len(reflections)} entries)")
                print("=" * 60)
                
                if not reflections:
                    print("No reflections found. Add some using option 1!")
                    return
                
                for i, reflection in enumerate(reflections, 1):
                    print(f"\n{i}. {reflection['date']} - {reflection['name']}")
                    print(f"   {reflection['reflection']}")
                    print("-" * 50)
                    
            except json.JSONDecodeError:
                print("❌ Error: reflections.json is corrupted or empty")
    else:
        print("❌ No reflections file found. Add some reflections first!")

def delete_reflection():
    if not os.path.exists(DATA_FILE):
        print("❌ No reflections file found")
        return
        
    with open(DATA_FILE, "r", encoding='utf-8') as f:
        try:
            reflections = json.load(f)
        except json.JSONDecodeError:
            print("❌ Error reading reflections file")
            return
    
    if not reflections:
        print("❌ No reflections to delete")
        return
    
    print(f"\n🗑️  DELETE REFLECTION")
    print("=" * 40)
    for i, reflection in enumerate(reflections, 1):
        print(f"{i}. {reflection['date']} - {reflection['name']}")
        print(f"   {reflection['reflection'][:50]}...")
    
    try:
        choice = int(input(f"\nEnter number to delete (1-{len(reflections)}): "))
        if 1 <= choice <= len(reflections):
            deleted = reflections.pop(choice - 1)
            with open(DATA_FILE, "w", encoding='utf-8') as f:
                json.dump(reflections, f, indent=2)
            print(f"✅ Deleted: {deleted['date']} - {deleted['name']}")
            print(f"📊 Remaining reflections: {len(reflections)}")
        else:
            print("❌ Invalid choice")
    except ValueError:
        print("❌ Please enter a valid number")

def clear_all_reflections():
    if not os.path.exists(DATA_FILE):
        print("❌ No reflections file found")
        return
        
    with open(DATA_FILE, "r", encoding='utf-8') as f:
        try:
            reflections = json.load(f)
        except json.JSONDecodeError:
            print("❌ Error reading reflections file")
            return
    
    if not reflections:
        print("❌ No reflections to clear")
        return
    
    print(f"\n⚠️  CLEAR ALL REFLECTIONS")
    print("=" * 40)
    print(f"This will delete ALL {len(reflections)} reflections!")
    confirm = input("Type 'DELETE' to confirm: ")
    
    if confirm.upper() == 'DELETE':
        with open(DATA_FILE, "w", encoding='utf-8') as f:
            json.dump([], f, indent=2)
        print("✅ All reflections cleared!")
    else:
        print("❌ Clear operation cancelled")

def show_file_info():
    if os.path.exists(DATA_FILE):
        file_stats = os.stat(DATA_FILE)
        with open(DATA_FILE, "r", encoding='utf-8') as f:
            try:
                reflections = json.load(f)
                print(f"\n📁 FILE INFORMATION")
                print("=" * 40)
                print(f"File: {DATA_FILE}")
                print(f"Size: {file_stats.st_size} bytes")
                print(f"Entries: {len(reflections)}")
                print(f"Created: {datetime.fromtimestamp(file_stats.st_ctime).strftime('%Y-%m-%d %H:%M:%S')}")
                print(f"Modified: {datetime.fromtimestamp(file_stats.st_mtime).strftime('%Y-%m-%d %H:%M:%S')}")
            except json.JSONDecodeError:
                print("❌ File exists but is corrupted")
    else:
        print("❌ No reflections file found")

def main():
    while True:
        print("\n" + "=" * 60)
        print("           LEARNING JOURNAL - FLASK BACKEND MANAGER")
        print("=" * 60)
        print("1. Add New Reflection")
        print("2. View All Reflections")
        print("3. Delete Reflection")
        print("4. Clear All Reflections")
        print("5. File Information")
        print("6. Exit")
        print("-" * 60)
        
        choice = input("\nChoose an option (1-6): ").strip()
        
        if choice == '1':
            add_reflection()
        elif choice == '2':
            view_reflections()
        elif choice == '3':
            delete_reflection()
        elif choice == '4':
            clear_all_reflections()
        elif choice == '5':
            show_file_info()
        elif choice == '6':
            print("\n👋 Goodbye! Your reflections are ready for Flask backend!")
            print("🌐 Visit your PythonAnywhere site to see them online!")
            break
        else:
            print("❌ Invalid choice. Please try again.")

if __name__ == "__main__":
    # Check if we're in the right directory
    current_dir = os.path.basename(os.path.dirname(os.path.abspath(__file__)))
    if current_dir != "backend":
        print("⚠️  Warning: This script should be run from the backend directory!")
        print(f"   Current directory: {current_dir}")
        print("   Please move this script to the backend folder")
    
    main()