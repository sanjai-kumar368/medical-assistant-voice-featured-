from dotenv import load_dotenv
import os
from flask import Flask, jsonify, request, render_template
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS

load_dotenv()

app = Flask(
    __name__,
    template_folder='templates',
    static_folder='static'
)

CORS(app)

# Database Configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///medical.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# Doctor Table
class Doctor(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    specialization = db.Column(db.String(100), nullable=False)
    available_time = db.Column(db.String(100), nullable=False)

# Appointment Table
class Appointment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    patient_name = db.Column(db.String(100), nullable=False)
    doctor_name = db.Column(db.String(100), nullable=False)
    appointment_time = db.Column(db.String(100), nullable=False)

# Add Doctors
def add_doctors():

    if Doctor.query.first():
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

# Home Route
@app.route('/')
def home():
    return render_template('index.html')

# Other Pages
@app.route('/doctor')
def doctor_page():
    return render_template('doctor.html')

@app.route('/chatbot')
def chatbot_page():
    return render_template('chatbot.html')

@app.route('/doctor-form')
def doctor_form():
    return render_template('doctor_form.html')

@app.route('/doctor-login')
def doctor_login():
    return render_template('doctor_login.html')

# View Doctors
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

# Book Appointment
@app.route('/book', methods=['POST'])
def book_appointment():

    data = request.get_json()

    appointment = Appointment(
        patient_name=data['patient_name'],
        doctor_name=data['doctor_name'],
        appointment_time=data['appointment_time']
    )

    db.session.add(appointment)
    db.session.commit()

    return jsonify({
        "message": "Appointment booked successfully"
    })

# Voice Command
@app.route('/voice-command', methods=['POST'])
def voice_command():

    data = request.get_json()
    text = data['text']

    return jsonify({
        "spoken_text": text,
        "intent": "processed"
    })

# AI Medical Assistant
@app.route('/ai-medical', methods=['POST'])
def ai_medical():

    data = request.get_json()
    query = data['query']

    return jsonify({
        "response": f"You asked: {query}"
    })

# Initialize Database
with app.app_context():
    db.create_all()
    add_doctors()

# Run App
if __name__ == '__main__':
    app.run(debug=True)