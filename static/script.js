// script.js

document.addEventListener('DOMContentLoaded', () => {
    const voiceBtn = document.getElementById('voice-btn');
    const voiceStatus = document.getElementById('voice-status');

    if (!voiceBtn || !voiceStatus) return;

    // Support standard Web Speech API + all browser vendor prefixes (Chrome, Safari, Edge, Opera, Android, etc.)
    const SpeechRecognition = window.SpeechRecognition || 
                              window.webkitSpeechRecognition || 
                              window.mozSpeechRecognition || 
                              window.msSpeechRecognition || 
                              window.oSpeechRecognition;

    const useMediaRecorderFallback = !SpeechRecognition;

    let recognition = null;
    let isListening = false;
    let shouldListen = false;

    // -------------------------------------------------------
    // Fallback Recorder Engine (Firefox/Universal compatibility)
    // -------------------------------------------------------
    let mediaRecorder = null;
    let audioChunks = [];

    async function startRecordingFallback() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunks.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const apiKey = localStorage.getItem('groq_api_key');
                if (!apiKey) {
                    voiceStatus.textContent = '🔒 Groq Key Missing: Click the ⚙️ gear settings icon, enter a Groq API Key to enable voice fallback in Firefox!';
                    voiceBtn.classList.remove('listening');
                    voiceBtn.textContent = '🎤 Enable Voice Control';
                    isListening = false;
                    return;
                }

                voiceStatus.textContent = '⚡ Transcribing your voice...';

                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                const formData = new FormData();
                formData.append('file', audioBlob, 'audio.webm');
                formData.append('model', 'whisper-large-v3');

                try {
                    const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${apiKey}`
                        },
                        body: formData
                    });

                    if (!res.ok) throw new Error("Whisper transcription failed");
                    const data = await res.json();
                    
                    if (data.text && data.text.trim()) {
                        processVoiceTranscript(data.text);
                    } else {
                        voiceStatus.textContent = 'No voice detected. Click Enable and try again!';
                        voiceBtn.classList.remove('listening');
                        voiceBtn.textContent = '🎤 Enable Voice Control';
                        isListening = false;
                    }
                } catch (e) {
                    console.error("Whisper transcription error:", e);
                    voiceStatus.textContent = '❌ Transcription failed. Verify your Groq Key in settings.';
                    voiceBtn.classList.remove('listening');
                    voiceBtn.textContent = '🎤 Enable Voice Control';
                    isListening = false;
                }
            };

            mediaRecorder.start();
            isListening = true;
            voiceBtn.classList.add('listening');
            voiceBtn.textContent = '🛑 Stop & Transcribe';
            voiceStatus.textContent = 'Recording command... Click STOP when finished speaking.';
        } catch (e) {
            console.error("Mic access error:", e);
            voiceStatus.textContent = '🔒 Mic Blocked: Please allow microphone access in your browser settings and try again!';
        }
    }

    // Initialize native engine if supported
    if (!useMediaRecorderFallback) {
        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        shouldListen = true; // Auto-start natively supported browsers
    } else {
        voiceStatus.textContent = 'Click to record voice commands (Firefox Universal Fallback)...';
    }

    // Start native recognition
    function startRecognition() {
        if (!shouldListen || !recognition) return;
        try {
            recognition.start();
        } catch (e) {
            // Already active
        }
    }

    if (recognition) {
        // Try to auto-start native engine on page load
        startRecognition();

        // Native lifecycle events
        recognition.onstart = () => {
            isListening = true;
            voiceBtn.classList.add('listening');
            voiceBtn.textContent = '🛑 Stop Listening';
            voiceStatus.textContent = 'Listening... Speak your commands.';
        };

        recognition.onend = () => {
            isListening = false;
            if (shouldListen) {
                voiceStatus.textContent = '🔄 Reconnecting mic...';
                setTimeout(() => startRecognition(), 300);
            } else {
                voiceBtn.classList.remove('listening');
                voiceBtn.textContent = '🎤 Enable Voice Control';
            }
        };

        recognition.onerror = (event) => {
            console.error("Speech recognition error:", event.error);
            if (event.error === 'no-speech') {
                if (shouldListen) {
                    setTimeout(() => startRecognition(), 300);
                }
            } else if (event.error === 'not-allowed') {
                isListening = false;
                shouldListen = false;
                voiceBtn.classList.remove('listening');
                voiceBtn.textContent = '🎤 Enable Voice Control';
                voiceStatus.textContent = '🔒 Mic Blocked: Click the settings icon in the Chrome URL bar (left of localhost:8000), toggle Microphone to ALLOW, and click Enable!';
            } else if (event.error === 'audio-capture') {
                isListening = false;
                shouldListen = false;
                voiceBtn.classList.remove('listening');
                voiceBtn.textContent = '🎤 Enable Voice Control';
                voiceStatus.textContent = 'Bluetooth Mic Error: Set your headset as default input device in Windows Sound settings.';
            } else if (event.error !== 'aborted') {
                isListening = false;
                shouldListen = false;
                voiceBtn.classList.remove('listening');
                voiceBtn.textContent = '🎤 Enable Voice Control';
                voiceStatus.textContent = `Mic Error: ${event.error}. Please check your connection.`;
            }
        };

        recognition.onresult = (event) => {
            const idx = event.results.length - 1;
            const rawText = event.results[idx][0].transcript;
            processVoiceTranscript(rawText);
        };
    }

    // -------------------------------------------------------
    // Universal Toggle Button Action
    // -------------------------------------------------------
    voiceBtn.addEventListener('click', () => {
        if (useMediaRecorderFallback) {
            if (isListening) {
                if (mediaRecorder && mediaRecorder.state !== 'inactive') {
                    mediaRecorder.stop();
                    mediaRecorder.stream.getTracks().forEach(track => track.stop());
                }
            } else {
                startRecordingFallback();
            }
            return;
        }

        // Native speech engine toggler
        if (isListening) {
            shouldListen = false;
            try { recognition.stop(); } catch(e) {}
            voiceBtn.classList.remove('listening');
            voiceBtn.textContent = '🎤 Enable Voice Control';
            voiceStatus.textContent = 'Voice stopped. Click to re-enable.';
        } else {
            shouldListen = true;
            voiceBtn.classList.add('listening');
            voiceBtn.textContent = '🛑 Stop Listening';
            voiceStatus.textContent = 'Listening... Speak your commands.';
            startRecognition();
        }
    });

    // -------------------------------------------------------
    // Core Voice Command Routing Dispatcher (Shared by both engines)
    // -------------------------------------------------------
    function processVoiceTranscript(rawText) {
        let transcript = rawText.toLowerCase().trim();
        let rawTranscript = rawText.trim();

        // Strip trailing punctuation (.?! etc) that browsers append to spoken text
        transcript = transcript.replace(/[\.\?\!]+$/, '').trim();
        rawTranscript = rawTranscript.replace(/[\.\?\!]+$/, '').trim();

        voiceStatus.textContent = `You said: "${rawTranscript}"`;

        const currentPage = window.location.pathname.split('/').pop() || 'index.html';

        // -------------------------------------------------------
        // NAVIGATION COMMANDS (work on all pages)
        // -------------------------------------------------------
        if (transcript === 'go home' || transcript === 'home' || transcript === 'go back') {
            voiceStatus.textContent = 'Navigating to home...';
            setTimeout(() => { window.location.href = 'index.html'; }, 800);
            return;
        }
        if (transcript.includes('open prescription') || transcript.includes('get prescription') || transcript.includes('chatbot')) {
            voiceStatus.textContent = 'Opening prescription chatbot...';
            setTimeout(() => { window.location.href = 'chatbot.html'; }, 800);
            return;
        }
        if (transcript.includes('patient form') || transcript.includes('register patient')) {
            voiceStatus.textContent = 'Opening patient form...';
            setTimeout(() => { window.location.href = 'patient_form.html'; }, 800);
            return;
        }
        if (transcript.includes('doctor form') || transcript.includes('add doctor')) {
            voiceStatus.textContent = 'Opening doctor registration form...';
            setTimeout(() => { window.location.href = 'doctor_form.html'; }, 800);
            return;
        }
        if (transcript.includes('find doctor') || transcript.includes('book doctor') || transcript.includes('book a doctor')) {
            voiceStatus.textContent = 'Opening doctor booking page...';
            setTimeout(() => { window.location.href = 'doctor.html'; }, 800);
            return;
        }

        // -------------------------------------------------------
        // CHATBOT PAGE (chatbot.html)
        // -------------------------------------------------------
        if (currentPage === 'chatbot.html') {
            const chatInput = document.getElementById('chat-input');
            if (chatInput) {
                if (transcript.includes('send') || transcript === 'send message') {
                    if (typeof sendMessage === 'function') {
                        sendMessage();
                    }
                } else {
                    chatInput.value = rawTranscript;
                    voiceStatus.textContent = `Typed: "${rawTranscript}" — say "send" to send it.`;
                }
            }
            return;
        }

        // -------------------------------------------------------
        // DOCTOR SYMPTOM SEARCH PAGE (doctor.html)
        // -------------------------------------------------------
        if (currentPage === 'doctor.html') {
            // "Select Doctor [name]" or "Book visit with [name]" — clicks the Select Doctor button
            const selectMatch = transcript.match(/(?:select|choose|book visit with|book)\s+(?:doctor\s+)?([a-z]+(?:\s+[a-z]+)?)/i);
            if (selectMatch) {
                const nameQuery = selectMatch[1].toLowerCase();
                const allDocBtns = document.querySelectorAll('.primary-btn');
                let clicked = false;
                allDocBtns.forEach(btn => {
                    if (btn.getAttribute('onclick') && btn.getAttribute('onclick').toLowerCase().includes(nameQuery)) {
                        btn.click();
                        voiceStatus.textContent = `Booking visit with doctor matching "${nameQuery}"...`;
                        clicked = true;
                    }
                });
                if (!clicked) voiceStatus.textContent = `Could not find doctor "${nameQuery}" on screen.`;
                return;
            }

            // Symptom input + auto-search
            const symptomInput = document.getElementById('symptom-input');
            if (symptomInput) {
                let symptomStr = rawTranscript;
                if (transcript.includes('symptoms are')) {
                    symptomStr = rawTranscript.split(/symptoms are/i)[1];
                } else if (transcript.includes('symptom is')) {
                    symptomStr = rawTranscript.split(/symptom is/i)[1];
                } else if (transcript.includes('i have')) {
                    symptomStr = rawTranscript.split(/i have/i)[1];
                } else if (transcript.includes('i am having')) {
                    symptomStr = rawTranscript.split(/i am having/i)[1];
                }
                symptomStr = symptomStr.trim();
                if (symptomStr) {
                    symptomInput.value = symptomStr;
                    voiceStatus.textContent = `Symptom set: "${symptomStr}" — saying "find" will search.`;
                }
            }

            // Find / Search trigger
            if (transcript.includes('find') || transcript.includes('search') || transcript.includes('look up')) {
                if (typeof findDoctors === 'function') {
                    findDoctors();
                    voiceStatus.textContent = 'Searching for matching doctors...';
                }
            }
            return;
        }

        // -------------------------------------------------------
        // PATIENT FORM PAGE (patient_form.html)
        // -------------------------------------------------------
        if (currentPage === 'patient_form.html') {
            // Name
            if (transcript.includes('my name is') || transcript.includes('name is')) {
                const nameInput = document.getElementById('patient-name-field');
                if (nameInput) {
                    let nameStr = transcript.includes('my name is')
                        ? rawTranscript.split(/my name is/i)[1]
                        : rawTranscript.split(/name is/i)[1];
                    if (nameStr) {
                        nameInput.value = nameStr.trim();
                        voiceStatus.textContent = `Name set to: "${nameStr.trim()}"`;
                    }
                }
                return;
            }

            // Age
            if (transcript.includes('age is') || transcript.includes('my age is') || /age\s+\d+/.test(transcript)) {
                const ageField = document.getElementById('patient-age-field');
                if (ageField) {
                    const ageMatch = transcript.match(/(?:age(?:\s+is)?)\s+(\d+)/);
                    if (ageMatch) {
                        ageField.value = ageMatch[1];
                        voiceStatus.textContent = `Age set to: ${ageMatch[1]}`;
                    }
                }
                return;
            }

            // Hospital
            if (transcript.includes('hospital')) {
                const hospField = document.getElementById('patient-hospital-field');
                if (hospField) {
                    let hospStr = transcript.split('hospital')[1].trim();
                    for (let i = 0; i < hospField.options.length; i++) {
                        if (hospField.options[i].text.toLowerCase().includes(hospStr)) {
                            hospField.selectedIndex = i;
                            voiceStatus.textContent = `Hospital selected: "${hospField.options[i].text}"`;
                            break;
                        }
                    }
                }
                return;
            }

            // Submit
            if (transcript.includes('submit') || transcript.includes('register') || transcript.includes('confirm')) {
                const submitBtn = document.querySelector('#patient-form .primary-btn') ||
                                  document.querySelector('button[onclick*="submitPatientForm"]');
                if (submitBtn) {
                    voiceStatus.textContent = 'Submitting patient form...';
                    submitBtn.click();
                }
                return;
            }
        }

        // -------------------------------------------------------
        // DOCTOR REGISTRATION FORM PAGE (doctor_form.html)
        // -------------------------------------------------------
        if (currentPage === 'doctor_form.html') {
            // Name
            if (transcript.includes('name is') || transcript.includes('doctor name')) {
                const nameInput = document.getElementById('doc-name');
                if (nameInput) {
                    let nameStr = transcript.includes('my name is')
                        ? rawTranscript.split(/my name is/i)[1]
                        : rawTranscript.split(/name is/i)[1];
                    if (nameStr) {
                        nameInput.value = nameStr.trim();
                        voiceStatus.textContent = `Doctor name set to: "${nameStr.trim()}"`;
                    }
                }
                return;
            }

            // Specialist
            if (transcript.includes('specialist') || transcript.includes('specialization')) {
                const specInput = document.getElementById('doc-specialist');
                if (specInput) {
                    let specStr = transcript.includes('specialist is')
                        ? rawTranscript.split(/specialist is/i)[1]
                        : rawTranscript.split(/specialization is/i)[1] || rawTranscript.split(/specialist/i)[1];
                    if (specStr) {
                        specInput.value = specStr.trim();
                        voiceStatus.textContent = `Specialist set to: "${specStr.trim()}"`;
                    }
                }
                return;
            }

            // Hospital
            if (transcript.includes('hospital')) {
                const hospInput = document.getElementById('doc-hospital');
                if (hospInput) {
                    let hospStr = rawTranscript.split(/hospital/i)[1];
                    if (hospStr) {
                        hospInput.value = hospStr.trim();
                        voiceStatus.textContent = `Hospital set to: "${hospStr.trim()}"`;
                    }
                }
                return;
            }

            // Submit
            if (transcript.includes('submit') || transcript.includes('register') || transcript.includes('add')) {
                const submitBtn = document.querySelector('button[onclick*="handleRegister"]');
                if (submitBtn) {
                    voiceStatus.textContent = 'Registering doctor...';
                    submitBtn.click();
                }
                return;
            }
        }
    }
});
