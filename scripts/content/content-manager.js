export class ContentManager {
    constructor(container, storage, options = {}) {
        this.container = container;
        this.storage = storage;
        this.items = new Map();
        this.currentDate = null;
        
        this.callbacks = {
            onItemCreate: options.onItemCreate || null,
            onItemUpdate: options.onItemUpdate || null,
            onItemDelete: options.onItemDelete || null
        };
        
        this.dragController = null;
        this.trashZone = document.getElementById('trash-zone');
    }
    
    setDragController(dragController) {
        this.dragController = dragController;
    }
    
    async loadContent(date) {
        try {
            this.currentDate = date;
            const dateKey = this.formatDate(date);
            const items = await this.storage.getItemsByDate(dateKey);
            
            this.items.clear();
            this.container.innerHTML = '';
            
            items.forEach(item => {
                this.items.set(item.id, item);
                const element = this.createElement(item);
                this.container.appendChild(element);
                this.setupItemInteractions(element, item);
            });
            
            return items;
        } catch (error) {
            console.error('Failed to load content:', error);
            return [];
        }
    }
    
    async addItem(item) {
        try {
            if (!item.date) {
                item.date = this.formatDate(this.currentDate || new Date());
            }
            
            await this.storage.saveItem(item);
            this.items.set(item.id, item);
            
            const element = this.createElement(item);
            this.container.appendChild(element);
            this.setupItemInteractions(element, item);
            
            if (this.callbacks.onItemCreate) {
                this.callbacks.onItemCreate(item);
            }
            
            return element;
        } catch (error) {
            console.error('Failed to add item:', error);
            throw error;
        }
    }
    
    async updateItem(id, updates) {
        try {
            const item = this.items.get(id);
            if (!item) throw new Error(`Item ${id} not found`);
            
            Object.assign(item, updates);
            await this.storage.saveItem(item);
            
            const element = this.container.querySelector(`[data-id="${id}"]`);
            if (element) {
                this.updateElement(element, item);
            }
            
            if (this.callbacks.onItemUpdate) {
                this.callbacks.onItemUpdate(item);
            }
            
            return item;
        } catch (error) {
            console.error('Failed to update item:', error);
            throw error;
        }
    }
    
    async deleteItem(id) {
        try {
            const item = this.items.get(id);
            if (!item) return;
            
            await this.storage.deleteItem(id);
            this.items.delete(id);
            
            const element = this.container.querySelector(`[data-id="${id}"]`);
            if (element) {
                element.remove();
            }
            
            if (this.callbacks.onItemDelete) {
                this.callbacks.onItemDelete(item);
            }
            
            return item;
        } catch (error) {
            console.error('Failed to delete item:', error);
            throw error;
        }
    }
    
    createElement(item) {
        const element = document.createElement('div');
        element.className = `note-item ${item.type}-item ${this.getShadeClass(item)}`;
        element.dataset.id = item.id;
        element.dataset.type = item.type;
        
        this.positionElement(element, item);
        this.populateElement(element, item);
        
        return element;
    }
    
    updateElement(element, item) {
        this.positionElement(element, item);
        this.populateElement(element, item);
    }
    
    positionElement(element, item) {
        element.style.left = `${item.x}px`;
        element.style.top = `${item.y}px`;
        
        if (item.width) element.style.width = `${item.width}px`;
        if (item.height) element.style.height = `${item.height}px`;
    }
    
    populateElement(element, item) {
        switch (item.type) {
            case 'note':
                this.populateNoteElement(element, item);
                break;
            case 'photo':
                this.populatePhotoElement(element, item);
                break;
            case 'audio':
            case 'video':
                this.populateMediaElement(element, item);
                break;
            case 'todos':
                this.populateTodosElement(element, item);
                break;
            case 'timer':
                this.populateTimerElement(element, item);
                break;
            case 'thai':
                this.populateThaiElement(element, item);
                break;
            case 'ai':
                this.populateAIElement(element, item);
                break;
            default:
                element.textContent = item.content;
        }
    }
    
    populateNoteElement(element, item) {
        element.innerHTML = '';
        const content = document.createElement('div');
        content.className = 'note-content';
        content.contentEditable = true;
        content.textContent = item.content;
        
        content.addEventListener('input', () => {
            this.updateItem(item.id, { content: content.textContent });
        });
        
        element.appendChild(content);
    }
    
    populatePhotoElement(element, item) {
        element.innerHTML = '';
        const img = document.createElement('img');
        img.src = item.content;
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'cover';
        img.style.borderRadius = 'inherit';
        element.appendChild(img);
    }
    
    populateMediaElement(element, item) {
        element.innerHTML = '';
        const icon = item.type === 'audio' ? '🎵' : '🎬';
        const container = document.createElement('div');
        container.className = 'media-container';
        container.innerHTML = `
            <div class="media-icon">${icon}</div>
            <div class="media-label">${item.type}</div>
        `;
        element.appendChild(container);
    }
    
    populateTodosElement(element, item) {
        element.innerHTML = '';
        const list = document.createElement('ul');
        list.className = 'todos-list';
        
        try {
            const todos = JSON.parse(item.content);
            todos.forEach((todo, index) => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <input type="checkbox" ${todo.done ? 'checked' : ''}>
                    <span class="todo-text">${todo.text}</span>
                `;
                
                const checkbox = li.querySelector('input');
                checkbox.addEventListener('change', () => {
                    todos[index].done = checkbox.checked;
                    this.updateItem(item.id, { content: JSON.stringify(todos) });
                });
                
                list.appendChild(li);
            });
        } catch (e) {
            list.textContent = 'Invalid todos data';
        }
        
        element.appendChild(list);
    }
    
    populateTimerElement(element, item) {
        element.innerHTML = '';
        const display = document.createElement('div');
        display.className = 'timer-display';
        
        try {
            const timer = JSON.parse(item.content);
            const minutes = Math.floor(timer.remaining / 60);
            const seconds = timer.remaining % 60;
            display.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        } catch (e) {
            display.textContent = '25:00';
        }
        
        element.appendChild(display);
    }
    
    populateThaiElement(element, item) {
        element.innerHTML = '';
        try {
            const word = JSON.parse(item.content);
            element.innerHTML = `
                <div class="thai-word">${word.thai}</div>
                <div class="thai-pronunciation">${word.pronunciation}</div>
                <div class="thai-english">${word.english}</div>
            `;
        } catch (e) {
            element.textContent = 'Invalid Thai data';
        }
    }
    
    populateAIElement(element, item) {
        element.innerHTML = '';
        const content = document.createElement('div');
        content.className = 'ai-content';
        content.textContent = item.content;
        element.appendChild(content);
    }
    
    setupItemInteractions(element, item) {
        if (this.dragController) {
            this.dragController.makeDraggable(element, {
                onDragStart: () => {
                    element.classList.add('dragging');
                    this.showTrash();
                },
                onDragMove: (x, y) => {
                    this.updateTrashState(x, y);
                },
                onDragEnd: (x, y) => {
                    element.classList.remove('dragging');
                    this.hideTrash();
                    
                    if (this.isOverTrash(x, y)) {
                        this.deleteItem(item.id);
                    } else {
                        this.updateItem(item.id, { x, y });
                    }
                }
            });
        }
        
        element.addEventListener('dblclick', () => {
            this.editItem(item);
        });
    }
    
    editItem(item) {
        const element = this.container.querySelector(`[data-id="${item.id}"]`);
        if (!element) return;
        
        switch (item.type) {
            case 'note':
                const content = element.querySelector('.note-content');
                if (content) {
                    content.focus();
                }
                break;
            case 'todos':
                break;
        }
    }
    
    showTrash() {
        this.trashZone.classList.remove('hidden');
    }
    
    hideTrash() {
        this.trashZone.classList.add('hidden');
        this.trashZone.classList.remove('active');
    }
    
    updateTrashState(x, y) {
        if (this.isOverTrash(x, y)) {
            this.trashZone.classList.add('active');
        } else {
            this.trashZone.classList.remove('active');
        }
    }
    
    isOverTrash(x, y) {
        const rect = this.trashZone.getBoundingClientRect();
        return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
    }
    
    getShadeClass(item) {
        return item.shade ? `note-shade-${item.shade}` : 'note-shade-1';
    }
    
    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    
    getAllItems() {
        return Array.from(this.items.values());
    }
    
    getItem(id) {
        return this.items.get(id);
    }
    
    getItemsByType(type) {
        return Array.from(this.items.values()).filter(item => item.type === type);
    }
    
    clear() {
        this.items.clear();
        this.container.innerHTML = '';
    }
}

export default ContentManager;