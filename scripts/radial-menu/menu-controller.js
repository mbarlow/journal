export class MenuController {
    constructor(container, options = {}) {
        this.container = container;
        this.svg = container.querySelector('#menu-svg');
        this.optionsContainer = container.querySelector('#menu-options');
        
        this.isActive = false;
        this.startPoint = { x: 0, y: 0 };
        this.currentPoint = { x: 0, y: 0 };
        this.selectedAction = null;
        
        this.settings = {
            radius: options.radius || 60,
            lineColor: options.lineColor || 'rgba(255, 255, 255, 0.6)',
            circleColor: options.circleColor || 'rgba(255, 255, 255, 0.4)',
            distancePerOption: options.distancePerOption || 30,
            ...options
        };
        
        this.actions = [
            { id: 'note', icon: '📝', label: 'Note' },
            { id: 'photo', icon: '📷', label: 'Photo' },
            { id: 'audio', icon: '🎵', label: 'Audio' },
            { id: 'video', icon: '🎬', label: 'Video' },
            { id: 'todos', icon: '☑️', label: 'Todos' },
            { id: 'timer', icon: '⏱️', label: 'Timer' },
            { id: 'email', icon: '✉️', label: 'Email' },
            { id: 'thai', icon: '🇹🇭', label: 'Thai' },
            { id: 'ai', icon: '🤖', label: 'AI Chat' }
        ];
        
        this.callbacks = {
            onActionSelect: options.onActionSelect || null
        };
        
        this.init();
    }
    
    init() {
        this.createSVGElements();
        this.createActionElements();
    }
    
    createSVGElements() {
        this.circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        this.circle.classList.add('menu-circle');
        this.circle.setAttribute('r', this.settings.radius);
        
        this.line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        this.line.classList.add('menu-line');
        
        this.svg.appendChild(this.circle);
        this.svg.appendChild(this.line);
    }
    
    createActionElements() {
        this.actionElements = this.actions.map((action, index) => {
            const element = document.createElement('div');
            element.className = 'menu-option';
            element.dataset.action = action.id;
            element.innerHTML = `
                <span class="menu-icon">${action.icon}</span>
                <span class="menu-label hidden">${action.label}</span>
            `;
            
            this.optionsContainer.appendChild(element);
            return { action, element };
        });
    }
    
    show(x, y) {
        this.startPoint = { x, y };
        this.currentPoint = { x, y };
        this.isActive = true;
        
        this.container.classList.remove('hidden');
        
        this.circle.setAttribute('cx', x);
        this.circle.setAttribute('cy', y);
        
        this.line.setAttribute('x1', x);
        this.line.setAttribute('y1', y);
        this.line.setAttribute('x2', x);
        this.line.setAttribute('y2', y);
        
        this.positionActions();
    }
    
    hide() {
        this.isActive = false;
        this.container.classList.add('hidden');
        this.clearSelection();
    }
    
    updatePosition(x, y) {
        if (!this.isActive) return;
        
        this.currentPoint = { x, y };
        
        this.line.setAttribute('x2', x);
        this.line.setAttribute('y2', y);
        
        const distance = this.getDistance();
        const angle = this.getAngle();
        
        this.updateSelection(distance, angle);
    }
    
    getDistance() {
        const dx = this.currentPoint.x - this.startPoint.x;
        const dy = this.currentPoint.y - this.startPoint.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    getAngle() {
        const dx = this.currentPoint.x - this.startPoint.x;
        const dy = this.currentPoint.y - this.startPoint.y;
        return Math.atan2(dy, dx);
    }
    
    updateSelection(distance, angle) {
        const actionIndex = Math.floor(distance / this.settings.distancePerOption);
        
        if (actionIndex < 0 || actionIndex >= this.actions.length) {
            this.clearSelection();
            return;
        }
        
        this.selectedAction = this.actions[actionIndex];
        
        this.actionElements.forEach(({ action, element }) => {
            if (action.id === this.selectedAction.id) {
                element.classList.add('active');
            } else {
                element.classList.remove('active');
            }
        });
    }
    
    clearSelection() {
        this.selectedAction = null;
        this.actionElements.forEach(({ element }) => {
            element.classList.remove('active');
        });
    }
    
    positionActions() {
        const baseAngle = this.getAngle();
        
        this.actionElements.forEach(({ element }, index) => {
            const distance = (index + 1) * this.settings.distancePerOption + this.settings.radius;
            const angle = baseAngle;
            
            const x = this.startPoint.x + Math.cos(angle) * distance;
            const y = this.startPoint.y + Math.sin(angle) * distance;
            
            element.style.left = `${x - 24}px`;
            element.style.top = `${y - 24}px`;
        });
    }
    
    confirmSelection() {
        if (this.selectedAction && this.callbacks.onActionSelect) {
            this.callbacks.onActionSelect(this.selectedAction);
        }
        this.hide();
    }
    
    cancel() {
        this.hide();
    }
}

export default MenuController;