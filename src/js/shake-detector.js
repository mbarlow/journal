// src/js/shake-detector.js
// Shake detection for triggering export functionality

class ShakeDetector {
    constructor(onShake) {
        this.onShake = onShake;
        this.lastX = null;
        this.lastY = null;
        this.lastZ = null;
        this.shakeThreshold = 15;
        this.shakeTimeout = null;
        this.isListening = false;
        
        this.setupShakeDetection();
    }
    
    setupShakeDetection() {
        if (window.DeviceMotionEvent) {
            // Request permission for iOS 13+
            if (typeof DeviceMotionEvent.requestPermission === 'function') {
                DeviceMotionEvent.requestPermission()
                    .then(response => {
                        if (response === 'granted') {
                            this.addShakeListener();
                        }
                    })
                    .catch(console.error);
            } else {
                // Non-iOS devices
                this.addShakeListener();
            }
        }
    }
    
    addShakeListener() {
        window.addEventListener('devicemotion', this.handleMotion.bind(this));
        this.isListening = true;
    }
    
    handleMotion(event) {
        const current = event.accelerationIncludingGravity;
        
        if (this.lastX === null) {
            this.lastX = current.x;
            this.lastY = current.y;
            this.lastZ = current.z;
            return;
        }
        
        const deltaX = Math.abs(this.lastX - current.x);
        const deltaY = Math.abs(this.lastY - current.y);
        const deltaZ = Math.abs(this.lastZ - current.z);
        
        if (deltaX + deltaY + deltaZ > this.shakeThreshold) {
            // Only trigger if not in timeout
            if (!this.shakeTimeout) {
                this.triggerShake();
                
                // Set timeout to prevent multiple triggers
                this.shakeTimeout = setTimeout(() => {
                    this.shakeTimeout = null;
                }, 1000);
            }
        }
        
        this.lastX = current.x;
        this.lastY = current.y;
        this.lastZ = current.z;
    }
    
    triggerShake() {
        // Play cute pop sound
        this.playPopSound();
        
        // Trigger vibration feedback
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
        
        // Call the shake callback
        if (this.onShake) {
            this.onShake();
        }
    }
    
    playPopSound() {
        // Create a cute pop sound using Web Audio API
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    }
    
    destroy() {
        if (this.isListening) {
            window.removeEventListener('devicemotion', this.handleMotion);
            this.isListening = false;
        }
    }
}

export default ShakeDetector;