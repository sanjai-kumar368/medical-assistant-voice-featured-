// script.js

document.addEventListener('DOMContentLoaded', () => {

    const voiceBtn = document.getElementById('voice-btn');
    const voiceStatus = document.getElementById('voice-status');

    if (!voiceBtn || !voiceStatus) return;

    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition ||
        window.mozSpeechRecognition ||
        window.msSpeechRecognition ||
        window.oSpeechRecognition;

    const useMediaRecorderFallback = !SpeechRecognition;

    let recognition = null;
    let isListening = false;
    let shouldListen = false;

    let mediaRecorder = null;
    let audioChunks = [];

    // -------------------------------------------------------
    // FIREFOX FALLBACK
    // -------------------------------------------------------

    async function startRecordingFallback() {

        try {

            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true
            });

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

                    voiceStatus.textContent =
                        'Groq API Key Missing';

                    resetVoiceButton();
                    return;
                }

                voiceStatus.textContent =
                    'Transcribing voice...';

                const audioBlob = new Blob(audioChunks, {
                    type: 'audio/webm'
                });

                const formData = new FormData();

                formData.append(
                    'file',
                    audioBlob,
                    'audio.webm'
                );

                formData.append(
                    'model',
                    'whisper-large-v3'
                );

                try {

                    const response = await fetch(
                        'https://api.groq.com/openai/v1/audio/transcriptions',
                        {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${apiKey}`
                            },
                            body: formData
                        }
                    );

                    const data = await response.json();

                    if (data.text) {
                        processVoiceTranscript(data.text);
                    }

                } catch (error) {

                    console.error(error);

                    voiceStatus.textContent =
                        'Voice transcription failed';

                    resetVoiceButton();
                }
            };

            mediaRecorder.start();

            isListening = true;

            voiceBtn.classList.add('listening');

            voiceBtn.textContent =
                'Stop Recording';

            voiceStatus.textContent =
                'Recording voice...';

        } catch (error) {

            console.error(error);

            voiceStatus.textContent =
                'Microphone access denied';
        }
    }

    // -------------------------------------------------------
    // SPEECH ENGINE
    // -------------------------------------------------------

    if (!useMediaRecorderFallback) {

        recognition = new SpeechRecognition();

        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        shouldListen = true;
    }

    function startRecognition() {

        if (!recognition) return;

        try {
            recognition.start();
        } catch (error) {}
    }

    if (recognition) {

        startRecognition();

        recognition.onstart = () => {

            isListening = true;

            voiceBtn.classList.add('listening');

            voiceBtn.textContent =
                'Stop Listening';

            voiceStatus.textContent =
                'Listening...';
        };

        recognition.onend = () => {

            isListening = false;

            if (shouldListen) {

                setTimeout(() => {
                    startRecognition();
                }, 300);

            } else {

                resetVoiceButton();
            }
        };

        recognition.onerror = (event) => {

            console.error(event.error);

            if (event.error !== 'aborted') {

                resetVoiceButton();

                voiceStatus.textContent =
                    `Voice Error: ${event.error}`;
            }
        };

        recognition.onresult = (event) => {

            const idx =
                event.results.length - 1;

            const transcript =
                event.results[idx][0].transcript;

            processVoiceTranscript(transcript);
        };
    }

    // -------------------------------------------------------
    // BUTTON TOGGLE
    // -------------------------------------------------------

    voiceBtn.addEventListener('click', () => {

        if (useMediaRecorderFallback) {

            if (isListening) {

                mediaRecorder.stop();

                mediaRecorder.stream
                    .getTracks()
                    .forEach(track => track.stop());

            } else {

                startRecordingFallback();
            }

            return;
        }

        if (isListening) {

            shouldListen = false;

            recognition.stop();

            resetVoiceButton();

            voiceStatus.textContent =
                'Voice disabled';

        } else {

            shouldListen = true;

            startRecognition();
        }
    });

    function resetVoiceButton() {

        isListening = false;

        voiceBtn.classList.remove('listening');

        voiceBtn.textContent =
            'Enable Voice';
    }

    // -------------------------------------------------------
    // VOICE COMMAND ROUTER
    // -------------------------------------------------------

    function processVoiceTranscript(rawText) {

        let transcript =
            rawText.toLowerCase().trim();

        transcript =
            transcript.replace(/[.!?]+$/, '');

        voiceStatus.textContent =
            `You said: "${rawText}"`;

        const currentPage =
            window.location.pathname;

        // -------------------------------------------------------
        // NAVIGATION
        // -------------------------------------------------------

        if (
            transcript === 'home' ||
            transcript === 'go home'
        ) {

            window.location.href = '/';
            return;
        }

        if (
            transcript.includes('chatbot') ||
            transcript.includes('prescription')
        ) {

            window.location.href = '/chatbot';
            return;
        }

        if (
            transcript.includes('patient form')
        ) {

            window.location.href = '/patient-form';
            return;
        }

        if (
            transcript.includes('doctor form')
        ) {

            window.location.href = '/doctor-form';
            return;
        }

        if (
            transcript.includes('doctor') ||
            transcript.includes('book doctor')
        ) {

            window.location.href = '/doctor';
            return;
        }

        // -------------------------------------------------------
        // CHATBOT PAGE
        // -------------------------------------------------------

        if (currentPage === '/chatbot') {

            const chatInput =
                document.getElementById('chat-input');

            if (!chatInput) return;

            if (
                transcript === 'send' ||
                transcript === 'send message'
            ) {

                if (typeof sendMessage === 'function') {
                    sendMessage();
                }

            } else {

                chatInput.value = rawText;
            }
        }

        // -------------------------------------------------------
        // DOCTOR PAGE
        // -------------------------------------------------------

        if (currentPage === '/doctor') {

            const symptomInput =
                document.getElementById('symptom-input');

            if (
                transcript.includes('find') ||
                transcript.includes('search')
            ) {

                if (typeof findDoctors === 'function') {
                    findDoctors();
                }

            } else if (symptomInput) {

                symptomInput.value = rawText;
            }
        }

        // -------------------------------------------------------
        // PATIENT FORM
        // -------------------------------------------------------

        if (currentPage === '/patient-form') {

            if (
                transcript.includes('submit')
            ) {

                const btn =
                    document.querySelector(
                        '#patient-form button'
                    );

                if (btn) {
                    btn.click();
                }
            }
        }

        // -------------------------------------------------------
        // DOCTOR FORM
        // -------------------------------------------------------

        if (currentPage === '/doctor-form') {

            if (
                transcript.includes('submit')
            ) {

                const btn =
                    document.querySelector(
                        'button[onclick*="handleRegister"]'
                    );

                if (btn) {
                    btn.click();
                }
            }
        }
    }
});