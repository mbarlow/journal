// src/js/export-handler.js
// Export functionality for journal entries with photobooth strip layout

class ExportHandler {
    constructor(noteManager) {
        this.noteManager = noteManager;
        this.currentLocation = null;
        this.initLocationTracking();
    }
    
    initLocationTracking() {
        // Get current location when app loads
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async position => {
                    this.currentLocation = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        accuracy: position.coords.accuracy
                    };
                    
                    // Try to get city/area name via reverse geocoding
                    try {
                        const response = await fetch(
                            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}&zoom=10`
                        );
                        const data = await response.json();
                        if (data && data.address) {
                            this.currentLocation.city = data.address.city || 
                                                       data.address.town || 
                                                       data.address.village || 
                                                       data.address.suburb || 
                                                       data.address.county;
                            this.currentLocation.country = data.address.country;
                            this.currentLocation.displayName = data.display_name;
                        }
                    } catch (err) {
                        console.log("Could not get location name:", err);
                    }
                },
                error => {
                    console.log("Location access denied or unavailable");
                }
            );
        }
    }
    
    async exportDay(currentDate) {
        const dateKey = this.getDateKey(currentDate);
        const dayNotes = this.noteManager.getNotesForDate(currentDate);
        
        // Create export data
        const exportData = {
            date: currentDate,
            dateString: this.formatDateString(currentDate),
            location: this.currentLocation,
            notes: dayNotes.filter(n => n.type === 'text'),
            photos: dayNotes.filter(n => n.type === 'image'),
            audio: dayNotes.filter(n => n.type === 'audio'),
            verse: dayNotes.find(n => n.type === 'verse')
        };
        
        // Generate HTML export
        const html = await this.generateHTML(exportData);
        
        // Show export options
        this.showExportOptions(html, exportData);
    }
    
    formatDateString(date) {
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        return date.toLocaleDateString('en-US', options);
    }
    
    async generateHTML(data) {
        const photoStrip = await this.createPhotoboothStrip(data.photos);
        const mapImage = this.generateMapImage(data.location);
        
        const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Journal Entry - ${data.dateString}</title>
    <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&family=Indie+Flower&display=swap" rel="stylesheet">
    <style>
        ${this.getExportStyles()}
    </style>
</head>
<body>
    <div class="journal-page">
        <div class="journal-header">
            <h1 class="journal-date">${data.dateString}</h1>
            ${data.location ? `
            <div class="location-info">
                <span class="location-icon">📍</span>
                <span class="location-name">${data.location.city ? `${data.location.city}${data.location.country ? ', ' + data.location.country : ''}` : ''}</span>
                <span class="coordinates">${data.location.lat.toFixed(4)}, ${data.location.lng.toFixed(4)}</span>
            </div>
            ` : ''}
        </div>
        
        ${data.verse ? `
        <div class="verse-section">
            <div class="verse-decoration">✨</div>
            <blockquote class="daily-verse">
                <p>${data.verse.content}</p>
                <footer>${data.verse.title}</footer>
            </blockquote>
        </div>
        ` : ''}
        
        ${photoStrip ? `
        <div class="photobooth-container">
            ${photoStrip}
        </div>
        ` : ''}
        
        <div class="notes-section">
            ${data.notes.map(note => `
                <div class="journal-note">
                    <div class="note-content">${this.escapeHtml(note.content)}</div>
                </div>
            `).join('')}
        </div>
        
        ${data.audio.length > 0 ? `
        <div class="audio-section">
            <h3 class="section-title">🎵 Audio Memories</h3>
            ${data.audio.map((audio, i) => `
                <div class="audio-player">
                    <audio controls>
                        <source src="${audio.content}" type="audio/webm">
                    </audio>
                    <span class="audio-label">Recording ${i + 1}</span>
                </div>
            `).join('')}
        </div>
        ` : ''}
        
        ${mapImage ? `
        <div class="map-section">
            ${mapImage}
        </div>
        ` : ''}
        
        <div class="journal-footer">
            <div class="sticker-row">
                <span class="sticker">💝</span>
                <span class="sticker">🌸</span>
                <span class="sticker">✨</span>
                <span class="sticker">🦋</span>
                <span class="sticker">🌈</span>
            </div>
            <p class="export-info">Exported with ❤️ from My Journal</p>
        </div>
    </div>
</body>
</html>`;
        
        return html;
    }
    
    async createPhotoboothStrip(photos) {
        if (photos.length === 0) return null;
        
        const stripHtml = `
        <div class="photobooth-strip">
            <div class="strip-holes top"></div>
            ${photos.slice(0, 4).map((photo, i) => {
                let imageSrc;
                try {
                    const imageData = JSON.parse(photo.content);
                    imageSrc = imageData.original || imageData.thumbnail;
                } catch {
                    imageSrc = photo.content;
                }
                
                return `
                <div class="photo-frame">
                    <img src="${imageSrc}" alt="Photo ${i + 1}">
                </div>
                `;
            }).join('')}
            <div class="strip-holes bottom"></div>
        </div>
        `;
        
        return stripHtml;
    }
    
    generateMapImage(location) {
        if (!location) return null;
        
        // For now, let's just use the cute SVG map since external services might be blocked
        // You can uncomment the external map code later if you want to try it
        
        return `
        <div class="map-container">
            <div class="map-wrapper">
                <svg class="simple-map" viewBox="0 0 400 250" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <linearGradient id="skyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" style="stop-color:#87CEEB;stop-opacity:1" />
                            <stop offset="100%" style="stop-color:#E0F6FF;stop-opacity:1" />
                        </linearGradient>
                        <linearGradient id="waterGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" style="stop-color:#4A90E2;stop-opacity:0.6" />
                            <stop offset="100%" style="stop-color:#6BB6FF;stop-opacity:0.3" />
                        </linearGradient>
                        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#FFFFFF" stroke-width="0.5" opacity="0.3"/>
                        </pattern>
                    </defs>
                    
                    <!-- Sky background -->
                    <rect width="400" height="250" fill="url(#skyGradient)"/>
                    
                    <!-- Water/map circles -->
                    <circle cx="200" cy="125" r="100" fill="url(#waterGradient)"/>
                    <circle cx="200" cy="125" r="70" fill="#6BB6FF" opacity="0.4"/>
                    <circle cx="200" cy="125" r="40" fill="#4A90E2" opacity="0.5"/>
                    
                    <!-- Grid overlay -->
                    <rect width="400" height="250" fill="url(#grid)"/>
                    
                    <!-- Location pin -->
                    <g transform="translate(200, 125)">
                        <!-- Pin shadow -->
                        <ellipse cx="0" cy="35" rx="15" ry="5" fill="#000000" opacity="0.3"/>
                        
                        <!-- Pin body -->
                        <path d="M0 -30 C-17 -30 -30 -17 -30 0 C-30 25 0 45 0 45 S30 25 30 0 C30 -17 17 -30 0 -30Z" 
                              fill="#FF4444" stroke="#CC0000" stroke-width="2"/>
                        
                        <!-- Pin inner circle -->
                        <circle r="10" fill="#FFFFFF"/>
                        <circle r="6" fill="#FF4444"/>
                    </g>
                    
                    <!-- Decorative clouds -->
                    <g opacity="0.7">
                        <ellipse cx="80" cy="40" rx="25" ry="12" fill="white"/>
                        <ellipse cx="100" cy="42" rx="20" ry="10" fill="white"/>
                        <ellipse cx="320" cy="60" rx="30" ry="14" fill="white"/>
                        <ellipse cx="340" cy="62" rx="20" ry="10" fill="white"/>
                    </g>
                </svg>
                
                <div class="map-location-info">
                    ${location.city ? `<div class="map-city">${location.city}</div>` : ''}
                    <div class="map-coords">${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}</div>
                </div>
            </div>
        </div>
        `;
    }
    
    getExportStyles() {
        return `
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Indie Flower', cursive;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        
        .journal-page {
            max-width: 800px;
            margin: 0 auto;
            background: #FFF9E6;
            border-radius: 10px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            padding: 30px;
            position: relative;
        }
        
        .journal-page::before {
            content: '';
            position: absolute;
            left: 50px;
            top: 0;
            bottom: 0;
            width: 2px;
            background: #FFB3B3;
            opacity: 0.5;
        }
        
        .journal-header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px dashed #FFB3B3;
        }
        
        .journal-date {
            font-family: 'Caveat', cursive;
            font-size: 2.5em;
            color: #764ba2;
            font-weight: 700;
            margin-bottom: 10px;
        }
        
        .location-info {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 4px;
            color: #666;
            font-size: 0.9em;
        }
        
        .location-name {
            font-weight: 600;
            color: #764ba2;
            font-size: 1.1em;
        }
        
        .coordinates {
            font-family: monospace;
            font-size: 0.8em;
            opacity: 0.7;
        }
        
        .verse-section {
            background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
            border-radius: 15px;
            padding: 20px;
            margin: 20px 0;
            position: relative;
        }
        
        .verse-decoration {
            position: absolute;
            top: -10px;
            right: 20px;
            font-size: 2em;
        }
        
        .daily-verse {
            font-style: italic;
            color: #5a4a42;
            border-left: 4px solid #ff9a9e;
            padding-left: 20px;
        }
        
        .daily-verse footer {
            text-align: right;
            margin-top: 10px;
            font-size: 0.9em;
            opacity: 0.8;
        }
        
        .photobooth-container {
            display: flex;
            justify-content: center;
            margin: 30px 0;
        }
        
        .photobooth-strip {
            background: #222;
            padding: 10px 5px;
            border-radius: 5px;
            position: relative;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        }
        
        .strip-holes {
            height: 20px;
            background: repeating-linear-gradient(
                90deg,
                transparent 0,
                transparent 10px,
                #fff 10px,
                #fff 20px
            );
            opacity: 0.3;
        }
        
        .strip-holes.top {
            margin-bottom: 5px;
        }
        
        .strip-holes.bottom {
            margin-top: 5px;
        }
        
        .photo-frame {
            width: 180px;
            height: 180px;
            background: #fff;
            margin: 5px;
            padding: 5px;
            border-radius: 3px;
        }
        
        .photo-frame img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: 2px;
        }
        
        .notes-section {
            margin: 30px 0;
        }
        
        .journal-note {
            background: rgba(255, 255, 255, 0.5);
            border-radius: 10px;
            padding: 15px;
            margin: 10px 0;
            line-height: 1.8;
            color: #444;
            font-size: 1.1em;
            border: 1px solid rgba(255, 179, 179, 0.3);
        }
        
        .audio-section {
            margin: 30px 0;
        }
        
        .section-title {
            font-family: 'Caveat', cursive;
            color: #764ba2;
            font-size: 1.5em;
            margin-bottom: 15px;
        }
        
        .audio-player {
            display: flex;
            align-items: center;
            gap: 15px;
            margin: 10px 0;
            padding: 10px;
            background: rgba(255, 255, 255, 0.5);
            border-radius: 10px;
        }
        
        .audio-label {
            font-size: 0.9em;
            color: #666;
        }
        
        audio {
            border-radius: 20px;
        }
        
        .map-container {
            margin: 30px 0;
            text-align: center;
        }
        
        .map-wrapper {
            position: relative;
            display: inline-block;
            border-radius: 15px;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            background: #F5F5DC;
        }
        
        .map-image {
            width: 100%;
            max-width: 400px;
            height: auto;
            display: block;
        }
        
        .simple-map {
            width: 100%;
            max-width: 400px;
            height: auto;
            display: block;
        }
        
        .map-location-info {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%);
            color: white;
            padding: 20px 10px 10px;
            text-align: center;
        }
        
        .map-city {
            font-size: 1.2em;
            font-weight: 600;
            margin-bottom: 5px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
        }
        
        .map-location-info .map-coords {
            font-size: 0.8em;
            opacity: 0.9;
            font-family: monospace;
            color: white;
            margin: 0;
        }
        
        .map-fallback {
            width: 100%;
            max-width: 400px;
            height: auto;
        }
        
        .journal-footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px dashed #FFB3B3;
            text-align: center;
        }
        
        .sticker-row {
            font-size: 2em;
            margin: 10px 0;
            display: flex;
            justify-content: center;
            gap: 15px;
        }
        
        .sticker {
            animation: float 3s ease-in-out infinite;
            cursor: pointer;
            transition: transform 0.2s;
        }
        
        .sticker:hover {
            transform: scale(1.2) rotate(10deg);
        }
        
        .sticker:nth-child(2) { animation-delay: 0.5s; }
        .sticker:nth-child(3) { animation-delay: 1s; }
        .sticker:nth-child(4) { animation-delay: 1.5s; }
        .sticker:nth-child(5) { animation-delay: 2s; }
        
        @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
        }
        
        .export-info {
            margin-top: 20px;
            font-size: 0.9em;
            color: #999;
        }
        
        @media (prefers-color-scheme: dark) {
            body {
                background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
            }
            
            .journal-page {
                background: #2a2a2a;
                color: #e0e0e0;
            }
            
            .journal-date {
                color: #BB86FC;
            }
            
            .verse-section {
                background: linear-gradient(135deg, #3a3a3a 0%, #4a4a4a 100%);
            }
            
            .daily-verse {
                color: #e0e0e0;
                border-left-color: #BB86FC;
            }
            
            .journal-note {
                background: rgba(60, 60, 60, 0.5);
                color: #e0e0e0;
                border-color: rgba(187, 134, 252, 0.3);
            }
        }
        
        @media print {
            body {
                background: white;
                padding: 0;
            }
            
            .journal-page {
                box-shadow: none;
                padding: 20px;
            }
        }
        `;
    }
    
    showExportOptions(html, data) {
        // Create export modal
        const modal = document.createElement('div');
        modal.className = 'export-modal';
        modal.innerHTML = `
            <div class="export-modal-content">
                <h2>Export Journal Entry</h2>
                <p>${data.dateString}</p>
                <div class="export-options">
                    <button class="export-btn" data-action="preview">
                        <span>👁️</span> Preview
                    </button>
                    <button class="export-btn" data-action="share">
                        <span>📤</span> Share
                    </button>
                    <button class="export-btn" data-action="download">
                        <span>💾</span> Download
                    </button>
                    <button class="export-btn" data-action="copy">
                        <span>📋</span> Copy HTML
                    </button>
                </div>
                <button class="export-close">✕</button>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add event listeners
        modal.querySelector('.export-close').addEventListener('click', () => {
            modal.remove();
        });
        
        modal.querySelectorAll('.export-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                this.handleExportAction(action, html, data);
            });
        });
        
        // Show modal with animation
        setTimeout(() => {
            modal.classList.add('active');
        }, 10);
    }
    
    async handleExportAction(action, html, data) {
        switch(action) {
            case 'preview':
                this.previewExport(html);
                break;
            case 'share':
                await this.shareExport(html, data);
                break;
            case 'download':
                this.downloadExport(html, data);
                break;
            case 'copy':
                this.copyHTML(html);
                break;
        }
    }
    
    previewExport(html) {
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
    }
    
    async shareExport(html, data) {
        if (navigator.share) {
            try {
                const blob = new Blob([html], { type: 'text/html' });
                const file = new File([blob], `journal-${data.dateString}.html`, { type: 'text/html' });
                
                await navigator.share({
                    title: `Journal Entry - ${data.dateString}`,
                    text: `My journal entry for ${data.dateString}`,
                    files: [file]
                });
            } catch (err) {
                console.log('Share failed:', err);
                // Fallback to download
                this.downloadExport(html, data);
            }
        } else {
            // Fallback for browsers that don't support Web Share API
            this.downloadExport(html, data);
        }
    }
    
    downloadExport(html, data) {
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `journal-${this.getDateKey(data.date)}.html`;
        a.click();
        URL.revokeObjectURL(url);
    }
    
    copyHTML(html) {
        navigator.clipboard.writeText(html).then(() => {
            this.showToast('HTML copied to clipboard!');
        });
    }
    
    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'export-toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    getDateKey(date) {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }
}

export default ExportHandler;