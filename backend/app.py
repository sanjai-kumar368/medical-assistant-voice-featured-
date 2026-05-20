from dotenv import load_dotenv
import os

from flask import Flask, jsonify, request, render_template
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from werkzeug.exceptions import BadRequest
from groq import Groq

load_dotenv()

app = Flask(
    __name__,
    template_folder='templates',
    static_folder='static'
)

CORS(app)

app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv(
    'DATABASE_URL',
    'sqlite:///medical.db'
)

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# ---------------- GROQ CLIENT ----------------

client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)

# ---------------- DATABASE MODELS ----------------

class Doctor(db.Model):

    id = db.Column(db.Integer, primary_key=True)

    name = db.Column(
        db.String(100),
        nullable=False
    )

    specialization = db.Column(
        db.String(100),
        nullable=False
    )

    available_time = db.Column(
        db.String(100),
        nullable=False
    )


class Appointment(db.Model):

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    patient_name = db.Column(
        db.String(100),
        nullable=False
    )

    doctor_name = db.Column(
        db.String(100),
        nullable=False
    )

    appointment_time = db.Column(
        db.String(100),
        nullable=False
    )

# ---------------- DEFAULT DOCTORS ----------------

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

# ---------------- PAGE ROUTES ----------------

@app.route('/')
def home():
    return render_template('index.html')


@app.route('/doctor')
def doctor_page():
    return render_template('doctor.html')


@app.route('/patient-form')
def patient_form():

    doctor_name = request.args.get(
        'doctor_name',
        ''
    )

    return render_template(
        'patient_form.html',
        doctor_name=doctor_name
    )


@app.route('/chatbot')
def chatbot_page():
    return render_template('chatbot.html')


@app.route('/doctor-form')
def doctor_form():
    return render_template('doctor_form.html')


@app.route('/doctor-login')
def doctor_login():
    return render_template('doctor_login.html')

# ---------------- DOCTORS API ----------------

@app.route('/doctors', methods=['GET'])
def doctors():

    all_doctors = Doctor.query.all()

    doctors_list = [

        {
            "id": doctor.id,
            "name": doctor.name,
            "specialization": doctor.specialization,
            "available_time": doctor.available_time
        }

        for doctor in all_doctors
    ]

    return jsonify(doctors_list)

# ---------------- BOOK APPOINTMENT ----------------

@app.route('/book', methods=['POST'])
def book_appointment():

    data = request.get_json(silent=True)

    if not data:
        raise BadRequest(
            "Request body must be valid JSON."
        )

    patient_name = data.get(
        'patient_name',
        ''
    ).strip()

    doctor_name = data.get(
        'doctor_name',
        ''
    ).strip()

    appointment_time = data.get(
        'appointment_time',
        ''
    ).strip()

    if (
        not patient_name or
        not doctor_name or
        not appointment_time
    ):

        return jsonify({
            "error": (
                "patient_name, doctor_name, "
                "and appointment_time are required."
            )
        }), 400

    appointment = Appointment(
        patient_name=patient_name,
        doctor_name=doctor_name,
        appointment_time=appointment_time
    )

    db.session.add(appointment)
    db.session.commit()

    return jsonify({
        "message": "Appointment booked successfully"
    }), 201

# ---------------- VOICE COMMAND ----------------

@app.route('/voice-command', methods=['POST'])
def voice_command():

    data = request.get_json(silent=True)

    if not data:
        raise BadRequest(
            "Request body must be valid JSON."
        )

    text = data.get(
        'text',
        ''
    ).strip()

    if not text:

        return jsonify({
            "error": "text is required"
        }), 400

    return jsonify({
        "spoken_text": text,
        "intent": "processed"
    })

# ---------------- AI MEDICAL CHATBOT ----------------

@app.route('/ai-medical', methods=['POST'])
def ai_medical():

    data = request.get_json(silent=True)

    if not data:
        raise BadRequest(
            "Request body must be valid JSON."
        )

    query = data.get(
        'query',
        ''
    ).strip()

    if not query:

        return jsonify({
            "error": "query is required"
        }), 400

    try:

        completion = client.chat.completions.create(

            model="llama-3.3-70b-versatile",

            messages=[

                {
                    "role": "system",

                    "content": (
                        "You are a helpful AI medical assistant. "
                        "Provide safe health guidance but avoid "
                        "diagnosis. Keep responses simple and "
                        "user-friendly."
                        "make each sentences into points and always start them in new line"
                    )
                },

                {
                    "role": "user",
                    "content": query
                }
            ],

            temperature=0.3,
            max_tokens=1024
        )

        ai_response = (
            completion
            .choices[0]
            .message
            .content
        )

        return jsonify({
            "response": ai_response
        })

    except Exception as e:

        print("Groq Error:", e)

        return jsonify({
            "error": str(e)
        }), 500

# ---------------- ERROR HANDLER ----------------

@app.errorhandler(BadRequest)
def handle_bad_request(e):

    return jsonify({
        "error": str(e.description)
    }), 400

# ---------------- DATABASE INIT ----------------

with app.app_context():

    db.create_all()
    add_doctors()

# ---------------- RUN APP ----------------

if __name__ == '__main__':
    app.run(debug=True)