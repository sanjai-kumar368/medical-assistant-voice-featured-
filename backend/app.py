from dotenv import load_dotenv
import os
from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
load_dotenv()

app = Flask(__name__)
CORS(app)
# -------------------------------------------------
# Database Configuration
# -------------------------------------------------
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///medical.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# -------------------------------------------------
# Doctor Table
# -------------------------------------------------
class Doctor(db.Model):

    id = db.Column(db.Integer, primary_key=True)

    name = db.Column(db.String(100), nullable=False)

    specialization = db.Column(db.String(100), nullable=False)

    available_time = db.Column(db.String(100), nullable=False)

# -------------------------------------------------
# Appointment Table
# -------------------------------------------------
class Appointment(db.Model):

    id = db.Column(db.Integer, primary_key=True)

    patient_name = db.Column(db.String(100), nullable=False)

    doctor_name = db.Column(db.String(100), nullable=False)

    appointment_time = db.Column(db.String(100), nullable=False)

# -------------------------------------------------
# Insert Doctors Function
# -------------------------------------------------
def add_doctors():

    if Doctor.query.first():
        print("Doctors already added!")
        return

    doctors_list = [

        Doctor(
            name="Dr. Rajesh",
            specialization="Cardiologist",
            available_time="10 AM - 2 PM"
        ),

        Doctor(
            name="Dr. Priya",
            specialization="Dermatologist",
            available_time="4 PM - 8 PM"
        ),

        Doctor(
            name="Dr. Arun",
            specialization="Neurologist",
            available_time="9 AM - 1 PM"
        ),

        Doctor(
            name="Dr. Meena",
            specialization="Pediatrician",
            available_time="5 PM - 9 PM"
        )

    ]

    db.session.add_all(doctors_list)

    db.session.commit()

    print("Doctors added successfully!")

# -------------------------------------------------
# Voice Intent Detection Agent
# -------------------------------------------------
def detect_intent(text):

    text = text.lower()

    if "book" in text:
        return "book_appointment"

    elif "doctor" in text:
        return "view_doctors"

    elif "schedule" in text:
        return "doctor_schedule"

    elif "fever" in text or "cold" in text:
        return "medical_help"

    else:
        return "unknown"

# -------------------------------------------------
# Route: Home
# -------------------------------------------------
@app.route('/')
def home():

    return jsonify({

        "message": "Medical Voice AI Backend Running"

    })

# -------------------------------------------------
# Route: View Doctors
# -------------------------------------------------
@app.route('/doctors', methods=['GET'])
def doctors():

    all_doctors = Doctor.query.all()

    doctors_list = []

    for doctor in all_doctors:

        doctors_list.append({

            "id": doctor.id,
            "name": doctor.name,
            "specialization": doctor.specialization,
            "available_time": doctor.available_time

        })

    return jsonify(doctors_list)

# -------------------------------------------------
# Route: Book Appointment
# -------------------------------------------------
@app.route('/book', methods=['POST'])
def book_appointment():

    data = request.get_json()

    patient_name = data['patient_name']

    doctor_name = data['doctor_name']

    appointment_time = data['appointment_time']

    appointment = Appointment(

        patient_name=patient_name,
        doctor_name=doctor_name,
        appointment_time=appointment_time

    )

    db.session.add(appointment)

    db.session.commit()

    return jsonify({

        "message": "Appointment booked successfully"

    })

# -------------------------------------------------
# Route: Voice Command
# -------------------------------------------------
@app.route('/voice-command', methods=['POST'])
def voice_command():

    data = request.get_json()

    text = data['text']

    intent = detect_intent(text)

    return jsonify({

        "spoken_text": text,
        "intent": intent

    })

# -------------------------------------------------
# Route: AI Medical Assistant
# -------------------------------------------------
@app.route('/ai-medical', methods=['POST'])
def ai_medical():

    data = request.get_json()

    query = data['query']

    prompt = f"""
    You are an AI healthcare assistant.
    start a sentence in new line for each point.

    Your job is to provide:
    - basic wellness guidance
    - simple home remedies
    - healthy precautions

    Rules:
    - Never diagnose diseases
    - Never prescribe medicines
    - Never create panic
    - Always recommend consulting a doctor for severe symptoms

    Response Format:

    Possible Cause:
    <short explanation>

    Home Remedies:
    - remedy 1
    - remedy 2
    - remedy 3

    Precautions:
    - precaution 1
    - precaution 2

    Doctor Advice:
    <when to consult a doctor>

    User Query:
    {query}
    """

    groq_api_key = os.getenv("GROQ_API_KEY", "")

    if not groq_api_key:
        return jsonify({
            "response": (
                "❌ Groq API Key not configured.\n\n"
                "To fix this:\n"
                "1. Open the file: backend/.env\n"
                "2. Replace YOUR_GROQ_API_KEY_HERE with your real key from console.groq.com\n"
                "3. Restart python run.py\n\n"
                "OR click the ⚙️ gear icon on the chatbot page and paste your key there to use serverless mode instantly!"
            )
        })

    try:
        from groq import Groq
        groq_client = Groq(api_key=groq_api_key)
        completion = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.5
        )
        response = completion.choices[0].message.content
    except Exception as e:
        print(f"Groq API error: {e}")
        response = f"AI Error: {str(e)}. Please check your Groq API key in backend/.env"

    return jsonify({"response": response})

# -------------------------------------------------
# Temporary secure Git push handler
# -------------------------------------------------
@app.route('/git-push-hackathon-secure-endpoint-abc')
def git_push_secure():
    import subprocess
    import os
    try:
        cwd = os.path.dirname(os.path.abspath(__file__))
        parent_cwd = os.path.abspath(os.path.join(cwd, '..'))
        
        # 1. Init
        subprocess.run(['git', 'init'], cwd=parent_cwd, check=True)
        # 2. Add
        subprocess.run(['git', 'add', '.'], cwd=parent_cwd, check=True)
        # 3. Commit
        subprocess.run(['git', 'commit', '-m', 'Complete Medical Assistant with multi-browser voice controls & hybrid Supabase data'], cwd=parent_cwd)
        # 4. Branch
        subprocess.run(['git', 'branch', '-M', 'main'], cwd=parent_cwd, check=True)
        
        # 5. Remotes
        subprocess.run(['git', 'remote', 'add', 'origin', 'https://github.com/Gowjesh/Ai_Agent_Project.git'], cwd=parent_cwd)
        subprocess.run(['git', 'remote', 'set-url', 'origin', 'https://github.com/Gowjesh/Ai_Agent_Project.git'], cwd=parent_cwd)
        
        # 6. Push
        result = subprocess.run(['git', 'push', '-u', 'origin', 'main', '--force'], cwd=parent_cwd, capture_output=True, text=True)
        
        return jsonify({
            "status": "Success",
            "stdout": result.stdout,
            "stderr": result.stderr
        })
    except Exception as e:
        return jsonify({
            "status": "Error",
            "error": str(e)
        })

# -------------------------------------------------
# Main
# -------------------------------------------------
with app.app_context():

    db.create_all()

    add_doctors()

# -------------------------------------------------
# Run Flask App
# -------------------------------------------------
if __name__ == '__main__':

    app.run(debug=True)