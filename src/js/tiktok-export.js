// src/js/tiktok-export.js
// Export journal entries as TikTok-ready content

class TikTokExport {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // TikTok vertical format (9:16 ratio)
        this.width = 1080;
        this.height = 1920;
        
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }
    
    async createStoryImage(data) {
        // Clear canvas
        this.ctx.fillStyle = this.getGradientBackground();
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Add decorative elements
        this.drawDecorativeElements();
        
        // Add date header
        this.drawDateHeader(data.dateString);
        
        // Add location if available
        if (data.location && data.location.city) {
            this.drawLocation(data.location);
        }
        
        // Add verse if available
        if (data.verse) {
            this.drawVerse(data.verse);
        }
        
        // Add photos in grid
        if (data.photos && data.photos.length > 0) {
            await this.drawPhotoGrid(data.photos);
        }
        
        // Add notes
        if (data.notes && data.notes.length > 0) {
            this.drawNotes(data.notes);
        }
        
        // Add stickers/decorations
        this.drawStickers();
        
        // Add watermark
        this.drawWatermark();
        
        // Convert to blob
        return await this.canvasToBlob();
    }
    
    async createVideoFrames(data) {
        const frames = [];
        const frameDuration = 1000; // 1 second per frame
        
        // Frame 1: Title card
        frames.push(await this.createTitleFrame(data));
        
        // Frame 2: Photos (if any)
        if (data.photos && data.photos.length > 0) {
            frames.push(await this.createPhotosFrame(data.photos));
        }
        
        // Frame 3: Notes
        if (data.notes && data.notes.length > 0) {
            frames.push(await this.createNotesFrame(data.notes));
        }
        
        // Frame 4: Verse (if any)
        if (data.verse) {
            frames.push(await this.createVerseFrame(data.verse));
        }
        
        // Frame 5: Outro with location
        frames.push(await this.createOutroFrame(data));
        
        return frames;
    }
    
    getGradientBackground() {
        const gradient = this.ctx.createLinearGradient(0, 0, this.width, this.height);
        gradient.addColorStop(0, '#667eea');
        gradient.addColorStop(0.5, '#764ba2');
        gradient.addColorStop(1, '#f093fb');
        return gradient;
    }
    
    drawDecorativeElements() {
        // Add subtle pattern overlay
        this.ctx.globalAlpha = 0.1;
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        
        // Draw diagonal lines pattern
        for (let i = -this.height; i < this.width; i += 50) {
            this.ctx.beginPath();
            this.ctx.moveTo(i, 0);
            this.ctx.lineTo(i + this.height, this.height);
            this.ctx.stroke();
        }
        
        this.ctx.globalAlpha = 1;
    }
    
    drawDateHeader(dateString) {
        // Background card for date
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        this.roundRect(50, 100, this.width - 100, 200, 30);
        this.ctx.fill();
        
        // Date text
        this.ctx.fillStyle = '#764ba2';
        this.ctx.font = 'bold 72px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        // Split date for better formatting
        const dateParts = dateString.split(',');
        if (dateParts.length > 1) {
            this.ctx.font = 'bold 48px Arial';
            this.ctx.fillText(dateParts[0], this.width / 2, 160);
            this.ctx.font = 'bold 60px Arial';
            this.ctx.fillText(dateParts[1].trim(), this.width / 2, 230);
        } else {
            this.ctx.fillText(dateString, this.width / 2, 200);
        }
    }
    
    drawLocation(location) {
        // Location pin icon and text
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.roundRect(50, 330, this.width - 100, 100, 20);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#FF4444';
        this.ctx.font = '48px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('📍', 80, 380);
        
        this.ctx.fillStyle = '#333';
        this.ctx.font = '36px Arial';
        this.ctx.fillText(`${location.city || 'Unknown Location'}`, 150, 380);
    }
    
    drawVerse(verse) {
        // Verse background
        this.ctx.fillStyle = 'rgba(255, 236, 179, 0.9)';
        this.roundRect(50, 460, this.width - 100, 300, 25);
        this.ctx.fill();
        
        // Verse text
        this.ctx.fillStyle = '#5a4a42';
        this.ctx.font = 'italic 32px Georgia';
        this.ctx.textAlign = 'center';
        
        // Word wrap verse text
        const words = verse.content.split(' ');
        let line = '';
        let y = 530;
        const lineHeight = 45;
        const maxWidth = this.width - 150;
        
        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = this.ctx.measureText(testLine);
            const testWidth = metrics.width;
            
            if (testWidth > maxWidth && n > 0) {
                this.ctx.fillText(line, this.width / 2, y);
                line = words[n] + ' ';
                y += lineHeight;
            } else {
                line = testLine;
            }
        }
        this.ctx.fillText(line, this.width / 2, y);
        
        // Reference
        this.ctx.font = '28px Arial';
        this.ctx.fillStyle = '#8a7a72';
        this.ctx.fillText(verse.title || '', this.width / 2, y + 60);
    }
    
    async drawPhotoGrid(photos) {
        const gridY = 800;
        const photoSize = 400;
        const padding = 20;
        const cols = 2;
        
        // Background for photo section
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.roundRect(30, gridY - 20, this.width - 60, photoSize * 2 + padding * 3, 30);
        this.ctx.fill();
        
        // Draw up to 4 photos in a grid
        for (let i = 0; i < Math.min(4, photos.length); i++) {
            const row = Math.floor(i / cols);
            const col = i % cols;
            
            const x = 50 + col * (photoSize + padding) + (this.width - (photoSize * 2 + padding)) / 2 - 50;
            const y = gridY + row * (photoSize + padding);
            
            // Photo frame
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillRect(x - 5, y - 5, photoSize + 10, photoSize + 10);
            
            // Load and draw photo
            try {
                const img = await this.loadImage(photos[i]);
                this.ctx.drawImage(img, x, y, photoSize, photoSize);
            } catch (e) {
                // Placeholder if image fails
                this.ctx.fillStyle = '#ddd';
                this.ctx.fillRect(x, y, photoSize, photoSize);
                this.ctx.fillStyle = '#999';
                this.ctx.font = '24px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('Photo ' + (i + 1), x + photoSize / 2, y + photoSize / 2);
            }
        }
    }
    
    drawNotes(notes) {
        const noteY = 1650;
        const maxNotes = 2; // Show first 2 notes
        
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        this.roundRect(50, noteY, this.width - 100, 200, 25);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#444';
        this.ctx.font = '28px Arial';
        this.ctx.textAlign = 'left';
        
        let y = noteY + 50;
        for (let i = 0; i < Math.min(maxNotes, notes.length); i++) {
            const noteText = notes[i].content.substring(0, 50) + '...';
            this.ctx.fillText(`• ${noteText}`, 80, y);
            y += 40;
        }
        
        if (notes.length > maxNotes) {
            this.ctx.fillStyle = '#999';
            this.ctx.font = 'italic 24px Arial';
            this.ctx.fillText(`+${notes.length - maxNotes} more notes...`, 80, y + 20);
        }
    }
    
    drawStickers() {
        const stickers = ['✨', '💝', '🌸', '🦋', '🌈'];
        const positions = [
            {x: 100, y: 50},
            {x: this.width - 100, y: 50},
            {x: 80, y: 1850},
            {x: this.width - 80, y: 1850},
            {x: this.width / 2, y: 1870}
        ];
        
        this.ctx.font = '60px Arial';
        this.ctx.textAlign = 'center';
        
        stickers.forEach((sticker, i) => {
            if (positions[i]) {
                // Add shadow for depth
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
                this.ctx.fillText(sticker, positions[i].x + 3, positions[i].y + 3);
                
                // Draw sticker
                this.ctx.fillStyle = '#ffffff';
                this.ctx.fillText(sticker, positions[i].x, positions[i].y);
            }
        });
    }
    
    drawWatermark() {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.font = '24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('My Journal ♥', this.width / 2, this.height - 30);
    }
    
    async createTitleFrame(data) {
        this.ctx.fillStyle = this.getGradientBackground();
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Animated-style text
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 120px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        this.ctx.shadowBlur = 20;
        this.ctx.shadowOffsetX = 5;
        this.ctx.shadowOffsetY = 5;
        
        this.ctx.fillText('My Day', this.width / 2, this.height / 2 - 100);
        
        this.ctx.font = '60px Arial';
        this.ctx.fillText(data.dateString, this.width / 2, this.height / 2 + 100);
        
        this.ctx.shadowBlur = 0;
        
        return this.canvasToBlob();
    }
    
    async createPhotosFrame(photos) {
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Create photo collage
        await this.drawPhotoGrid(photos);
        
        return this.canvasToBlob();
    }
    
    async createNotesFrame(notes) {
        this.ctx.fillStyle = this.getGradientBackground();
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        this.drawNotes(notes);
        
        return this.canvasToBlob();
    }
    
    async createVerseFrame(verse) {
        this.ctx.fillStyle = this.getGradientBackground();
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        this.drawVerse(verse);
        
        return this.canvasToBlob();
    }
    
    async createOutroFrame(data) {
        this.ctx.fillStyle = this.getGradientBackground();
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        if (data.location) {
            this.drawLocation(data.location);
        }
        
        this.drawStickers();
        this.drawWatermark();
        
        return this.canvasToBlob();
    }
    
    async loadImage(photo) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            
            try {
                const imageData = JSON.parse(photo.content);
                img.src = imageData.original || imageData.thumbnail;
            } catch {
                img.src = photo.content;
            }
        });
    }
    
    roundRect(x, y, width, height, radius) {
        this.ctx.beginPath();
        this.ctx.moveTo(x + radius, y);
        this.ctx.lineTo(x + width - radius, y);
        this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.ctx.lineTo(x + width, y + height - radius);
        this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.ctx.lineTo(x + radius, y + height);
        this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.ctx.lineTo(x, y + radius);
        this.ctx.quadraticCurveTo(x, y, x + radius, y);
        this.ctx.closePath();
    }
    
    async canvasToBlob() {
        return new Promise((resolve) => {
            this.canvas.toBlob(resolve, 'image/jpeg', 0.95);
        });
    }
    
    async exportAsImage(data) {
        const blob = await this.createStoryImage(data);
        return blob;
    }
    
    async exportAsVideo(data) {
        // For video, we'd need to use MediaRecorder API or a library like ffmpeg.js
        // For now, return frames that could be assembled into a video
        const frames = await this.createVideoFrames(data);
        return frames;
    }
}

export default TikTokExport;