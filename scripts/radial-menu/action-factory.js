export class ActionFactory {
    constructor() {
        this.actions = new Map();
        this.registerDefaultActions();
    }
    
    registerDefaultActions() {
        this.register('note', this.createNoteAction);
        this.register('photo', this.createPhotoAction);
        this.register('audio', this.createAudioAction);
        this.register('video', this.createVideoAction);
        this.register('todos', this.createTodosAction);
        this.register('timer', this.createTimerAction);
        this.register('email', this.createEmailAction);
        this.register('thai', this.createThaiAction);
        this.register('ai', this.createAIAction);
    }
    
    register(type, factory) {
        this.actions.set(type, factory);
    }
    
    create(type, x, y, options = {}) {
        const factory = this.actions.get(type);
        if (!factory) {
            throw new Error(`Unknown action type: ${type}`);
        }
        
        return factory.call(this, x, y, options);
    }
    
    createNoteAction(x, y, options) {
        const note = {
            id: this.generateId(),
            type: 'note',
            content: '',
            x: x - 50,
            y: y - 50,
            width: 200,
            height: 150,
            shade: Math.floor(Math.random() * 5) + 1,
            date: options.date || this.getCurrentDateKey(),
            timestamp: Date.now()
        };
        
        const element = this.createNoteElement(note);
        this.enableEditing(element, note);
        
        return { note, element };
    }
    
    createPhotoAction(x, y, options) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.capture = 'environment';
        
        return new Promise((resolve) => {
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (!file) return resolve(null);
                
                const reader = new FileReader();
                reader.onload = (event) => {
                    const photo = {
                        id: this.generateId(),
                        type: 'photo',
                        content: event.target.result,
                        x: x - 75,
                        y: y - 75,
                        width: 150,
                        height: 150,
                        date: options.date || this.getCurrentDateKey(),
                        timestamp: Date.now()
                    };
                    
                    const element = this.createPhotoElement(photo);
                    resolve({ note: photo, element });
                };
                reader.readAsDataURL(file);
            };
            
            input.click();
        });
    }
    
    createAudioAction(x, y, options) {
        return this.createMediaAction('audio', x, y, options);
    }
    
    createVideoAction(x, y, options) {
        return this.createMediaAction('video', x, y, options);
    }
    
    createTodosAction(x, y, options) {
        const todos = {
            id: this.generateId(),
            type: 'todos',
            content: JSON.stringify([
                { text: 'New task', done: false }
            ]),
            x: x - 75,
            y: y - 50,
            width: 250,
            height: 200,
            shade: Math.floor(Math.random() * 5) + 1,
            date: options.date || this.getCurrentDateKey(),
            timestamp: Date.now()
        };
        
        const element = this.createTodosElement(todos);
        return { note: todos, element };
    }
    
    createTimerAction(x, y, options) {
        const timer = {
            id: this.generateId(),
            type: 'timer',
            content: JSON.stringify({
                duration: 25 * 60,
                remaining: 25 * 60,
                isRunning: false
            }),
            x: x - 60,
            y: y - 60,
            width: 120,
            height: 120,
            date: options.date || this.getCurrentDateKey(),
            timestamp: Date.now()
        };
        
        const element = this.createTimerElement(timer);
        return { note: timer, element };
    }
    
    createEmailAction(x, y, options) {
        window.open('mailto:?subject=Journal Entry&body=');
        return null;
    }
    
    createThaiAction(x, y, options) {
        const words = [
            { thai: 'สวัสดี', english: 'Hello', pronunciation: 'sawàtdii' },
            { thai: 'ขอบคุณ', english: 'Thank you', pronunciation: 'khɔ̀ɔp khun' },
            { thai: 'ไม่เป็นไร', english: "Never mind", pronunciation: 'mâi pen rai' }
        ];
        
        const word = words[Math.floor(Math.random() * words.length)];
        
        const thai = {
            id: this.generateId(),
            type: 'thai',
            content: JSON.stringify(word),
            x: x - 100,
            y: y - 50,
            width: 200,
            height: 100,
            shade: Math.floor(Math.random() * 5) + 1,
            date: options.date || this.getCurrentDateKey(),
            timestamp: Date.now()
        };
        
        const element = this.createThaiElement(thai);
        return { note: thai, element };
    }
    
    createAIAction(x, y, options) {
        const ai = {
            id: this.generateId(),
            type: 'ai',
            content: 'Ask me anything...',
            x: x - 100,
            y: y - 75,
            width: 250,
            height: 150,
            shade: Math.floor(Math.random() * 5) + 1,
            date: options.date || this.getCurrentDateKey(),
            timestamp: Date.now()
        };
        
        const element = this.createAIElement(ai);
        return { note: ai, element };
    }
    
    createMediaAction(type, x, y, options) {
        const media = {
            id: this.generateId(),
            type: type,
            content: '',
            x: x - 75,
            y: y - 50,
            width: 150,
            height: 100,
            date: options.date || this.getCurrentDateKey(),
            timestamp: Date.now()
        };
        
        const element = this.createMediaElement(media);
        return { note: media, element };
    }
    
    createNoteElement(note) {
        const element = document.createElement('div');
        element.className = `note-item note-shade-${note.shade}`;
        element.dataset.id = note.id;
        element.style.left = `${note.x}px`;
        element.style.top = `${note.y}px`;
        element.style.width = `${note.width}px`;
        element.style.height = `${note.height}px`;
        
        const content = document.createElement('div');
        content.className = 'note-content';
        content.contentEditable = true;
        content.textContent = note.content;
        
        element.appendChild(content);
        return element;
    }
    
    createPhotoElement(photo) {
        const element = document.createElement('div');
        element.className = 'note-item photo-item';
        element.dataset.id = photo.id;
        element.style.left = `${photo.x}px`;
        element.style.top = `${photo.y}px`;
        element.style.width = `${photo.width}px`;
        element.style.height = `${photo.height}px`;
        
        const img = document.createElement('img');
        img.src = photo.content;
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'cover';
        
        element.appendChild(img);
        return element;
    }
    
    createTodosElement(todos) {
        const element = document.createElement('div');
        element.className = `note-item todos-item note-shade-${todos.shade}`;
        element.dataset.id = todos.id;
        element.style.left = `${todos.x}px`;
        element.style.top = `${todos.y}px`;
        element.style.width = `${todos.width}px`;
        element.style.height = `${todos.height}px`;
        
        const list = document.createElement('ul');
        list.className = 'todos-list';
        
        const items = JSON.parse(todos.content);
        items.forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = `
                <input type="checkbox" ${item.done ? 'checked' : ''}>
                <span>${item.text}</span>
            `;
            list.appendChild(li);
        });
        
        element.appendChild(list);
        return element;
    }
    
    createTimerElement(timer) {
        const element = document.createElement('div');
        element.className = 'note-item timer-item';
        element.dataset.id = timer.id;
        element.style.left = `${timer.x}px`;
        element.style.top = `${timer.y}px`;
        element.style.width = `${timer.width}px`;
        element.style.height = `${timer.height}px`;
        
        const display = document.createElement('div');
        display.className = 'timer-display';
        display.textContent = '25:00';
        
        element.appendChild(display);
        return element;
    }
    
    createThaiElement(thai) {
        const element = document.createElement('div');
        element.className = `note-item thai-item note-shade-${thai.shade}`;
        element.dataset.id = thai.id;
        element.style.left = `${thai.x}px`;
        element.style.top = `${thai.y}px`;
        element.style.width = `${thai.width}px`;
        element.style.height = `${thai.height}px`;
        
        const word = JSON.parse(thai.content);
        element.innerHTML = `
            <div class="thai-word">${word.thai}</div>
            <div class="thai-pronunciation">${word.pronunciation}</div>
            <div class="thai-english">${word.english}</div>
        `;
        
        return element;
    }
    
    createAIElement(ai) {
        const element = document.createElement('div');
        element.className = `note-item ai-item note-shade-${ai.shade}`;
        element.dataset.id = ai.id;
        element.style.left = `${ai.x}px`;
        element.style.top = `${ai.y}px`;
        element.style.width = `${ai.width}px`;
        element.style.height = `${ai.height}px`;
        
        const content = document.createElement('div');
        content.className = 'ai-content';
        content.textContent = ai.content;
        
        element.appendChild(content);
        return element;
    }
    
    createMediaElement(media) {
        const element = document.createElement('div');
        element.className = `note-item ${media.type}-item`;
        element.dataset.id = media.id;
        element.style.left = `${media.x}px`;
        element.style.top = `${media.y}px`;
        element.style.width = `${media.width}px`;
        element.style.height = `${media.height}px`;
        
        const icon = media.type === 'audio' ? '🎵' : '🎬';
        element.innerHTML = `
            <div class="media-icon">${icon}</div>
            <div class="media-label">${media.type}</div>
        `;
        
        return element;
    }
    
    enableEditing(element, note) {
        const content = element.querySelector('.note-content');
        if (!content) return;
        
        content.addEventListener('input', () => {
            note.content = content.textContent;
        });
    }
    
    generateId() {
        return `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    
    getCurrentDateKey() {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
}

export default ActionFactory;