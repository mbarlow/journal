// src/js/media-handler.js
// Media recording and processing for camera and audio

class MediaHandler {
    constructor() {
        this.mediaRecorder = null;
        this.audioChunks = [];
    }

    processImage(file, callback) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const originalDataUrl = e.target.result;
            const img = new Image();
            img.onload = () => {
                // Create low-res thumbnail for display on the page
                const canvas = document.createElement("canvas");
                const size = 64; // Small size for thumbnail
                canvas.width = size;
                canvas.height = size;
                const ctx = canvas.getContext("2d");
                
                // Draw and pixelate
                ctx.imageSmoothingEnabled = false;
                ctx.drawImage(img, 0, 0, size, size);
                
                const thumbnailUrl = canvas.toDataURL("image/jpeg", 0.7);
                
                // Store both thumbnail and original
                const imageData = {
                    thumbnail: thumbnailUrl,
                    original: originalDataUrl
                };
                
                if (callback) {
                    callback(JSON.stringify(imageData), "image");
                }
            };
            img.src = originalDataUrl;
        };
        reader.readAsDataURL(file);
    }

    async startRecording(audioButton, onComplete, onError) {
        try {
            // First check if mediaDevices is available
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                onError("Your browser doesn't support audio recording. Please use a modern browser.");
                return;
            }
            
            // Check current permission state if available
            if (navigator.permissions && navigator.permissions.query) {
                try {
                    const permissionStatus = await navigator.permissions.query({ name: 'microphone' });
                    
                    if (permissionStatus.state === 'denied') {
                        onError("Microphone access denied. Please enable microphone permissions in your browser settings and reload the page.");
                        return;
                    }
                } catch (e) {
                    // Permissions API might not support microphone query, continue anyway
                }
            }
            
            // Request microphone access
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100
                }
            });
            
            this.mediaRecorder = new MediaRecorder(stream);
            this.audioChunks = [];
            
            this.mediaRecorder.ondataavailable = (e) => {
                this.audioChunks.push(e.data);
            };
            
            this.mediaRecorder.onstop = () => {
                const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
                const reader = new FileReader();
                reader.onload = () => {
                    if (onComplete) {
                        onComplete(reader.result, "audio");
                    }
                };
                reader.readAsDataURL(audioBlob);
                
                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());
            };
            
            this.mediaRecorder.start();
            audioButton.innerHTML = `
                <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
                    <rect x="6" y="4" width="12" height="16" rx="2"></rect>
                </svg>
            `;
            audioButton.style.background = "rgba(255, 0, 0, 0.3)";
            
        } catch (error) {
            console.error("Error accessing microphone:", error);
            
            let message = "Could not access microphone. ";
            
            if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                message += "Please allow microphone access when prompted. If you previously denied access, go to your browser settings to enable it.";
            } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
                message += "No microphone found. Please connect a microphone and try again.";
            } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
                message += "Microphone is already in use by another application.";
            } else if (error.name === 'OverconstrainedError' || error.name === 'ConstraintNotSatisfiedError') {
                message += "Could not configure microphone with the requested settings.";
            } else if (error.name === 'NotSupportedError') {
                message += "Audio recording is not supported in this browser or context. Note: microphone access requires HTTPS or localhost.";
            } else {
                message += error.message || "Please check your browser settings.";
            }
            
            onError(message);
        }
    }

    stopRecording(audioButton) {
        if (this.mediaRecorder && this.mediaRecorder.state === "recording") {
            this.mediaRecorder.stop();
            audioButton.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                    <line x1="12" y1="19" x2="12" y2="23"></line>
                    <line x1="8" y1="23" x2="16" y2="23"></line>
                </svg>
            `;
            audioButton.style.background = "rgba(255, 255, 255, 0.1)";
        }
    }

    showPermissionMessage(message) {
        // Create a temporary message overlay
        const messageEl = document.createElement("div");
        messageEl.className = "permission-message";
        messageEl.innerHTML = `
            <div class="permission-message-content">
                <div class="permission-message-icon">🎤</div>
                <div class="permission-message-text">${message}</div>
                <button class="permission-message-close">OK</button>
            </div>
        `;
        
        document.body.appendChild(messageEl);
        
        // Show with animation
        setTimeout(() => {
            messageEl.classList.add("active");
        }, 10);
        
        // Close handler
        const close = () => {
            messageEl.classList.remove("active");
            setTimeout(() => {
                messageEl.remove();
            }, 300);
        };
        
        messageEl.querySelector(".permission-message-close").addEventListener("click", close);
        
        // Auto-close after 10 seconds
        setTimeout(close, 10000);
    }

    isRecording() {
        return this.mediaRecorder && this.mediaRecorder.state === "recording";
    }
}

export default MediaHandler;