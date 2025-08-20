export class DragController {
    constructor(container, options = {}) {
        this.container = container;
        this.dragThreshold = options.dragThreshold || 10;
        
        this.isDragging = false;
        this.currentElement = null;
        this.startPoint = null;
        this.offset = null;
        this.callbacks = new Map();
        
        this.init();
    }
    
    init() {
        this.container.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.container.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        
        document.addEventListener('mousemove', this.handleMouseMove.bind(this));
        document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        
        document.addEventListener('mouseup', this.handleMouseUp.bind(this));
        document.addEventListener('touchend', this.handleTouchEnd.bind(this));
        
        document.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
        document.addEventListener('touchcancel', this.handleTouchCancel.bind(this));
    }
    
    makeDraggable(element, callbacks = {}) {
        element.classList.add('draggable');
        element.dataset.draggable = 'true';
        
        if (callbacks.onDragStart || callbacks.onDragMove || callbacks.onDragEnd) {
            this.callbacks.set(element, callbacks);
        }
    }
    
    removeDraggable(element) {
        element.classList.remove('draggable');
        delete element.dataset.draggable;
        this.callbacks.delete(element);
    }
    
    handleMouseDown(e) {
        if (e.button !== 0) return;
        this.startDrag(e.target, e.clientX, e.clientY, e);
    }
    
    handleTouchStart(e) {
        if (e.touches.length !== 1) return;
        const touch = e.touches[0];
        this.startDrag(e.target, touch.clientX, touch.clientY, e);
    }
    
    startDrag(target, x, y, event) {
        const draggableElement = this.findDraggableParent(target);
        if (!draggableElement) return;
        
        this.currentElement = draggableElement;
        this.startPoint = { x, y };
        
        const rect = draggableElement.getBoundingClientRect();
        this.offset = {
            x: x - rect.left,
            y: y - rect.top
        };
        
        this.isDragging = false;
    }
    
    handleMouseMove(e) {
        this.updateDrag(e.clientX, e.clientY, e);
    }
    
    handleTouchMove(e) {
        if (!this.currentElement || e.touches.length !== 1) return;
        e.preventDefault();
        
        const touch = e.touches[0];
        this.updateDrag(touch.clientX, touch.clientY, e);
    }
    
    updateDrag(x, y, event) {
        if (!this.currentElement) return;
        
        const distance = Math.sqrt(
            Math.pow(x - this.startPoint.x, 2) + 
            Math.pow(y - this.startPoint.y, 2)
        );
        
        if (!this.isDragging && distance > this.dragThreshold) {
            this.isDragging = true;
            this.onDragStart(event);
        }
        
        if (this.isDragging) {
            const newX = x - this.offset.x;
            const newY = y - this.offset.y;
            
            this.currentElement.style.left = `${newX}px`;
            this.currentElement.style.top = `${newY}px`;
            
            this.onDragMove(newX, newY, event);
        }
    }
    
    handleMouseUp(e) {
        this.endDrag(e.clientX, e.clientY, e);
    }
    
    handleTouchEnd(e) {
        if (!this.currentElement) return;
        
        let x, y;
        if (e.changedTouches.length > 0) {
            const touch = e.changedTouches[0];
            x = touch.clientX;
            y = touch.clientY;
        } else {
            const rect = this.currentElement.getBoundingClientRect();
            x = rect.left + rect.width / 2;
            y = rect.top + rect.height / 2;
        }
        
        this.endDrag(x, y, e);
    }
    
    handleMouseLeave() {
        if (this.isDragging) {
            this.cancelDrag();
        }
    }
    
    handleTouchCancel() {
        this.cancelDrag();
    }
    
    endDrag(x, y, event) {
        if (!this.currentElement) return;
        
        if (this.isDragging) {
            const rect = this.currentElement.getBoundingClientRect();
            const finalX = rect.left;
            const finalY = rect.top;
            
            this.onDragEnd(finalX, finalY, event);
        }
        
        this.reset();
    }
    
    cancelDrag() {
        if (this.currentElement && this.isDragging) {
            const callbacks = this.callbacks.get(this.currentElement);
            if (callbacks && callbacks.onDragCancel) {
                callbacks.onDragCancel();
            }
        }
        
        this.reset();
    }
    
    onDragStart(event) {
        const callbacks = this.callbacks.get(this.currentElement);
        if (callbacks && callbacks.onDragStart) {
            callbacks.onDragStart(event);
        }
        
        this.currentElement.style.zIndex = '1000';
        this.currentElement.style.pointerEvents = 'none';
        
        this.container.style.userSelect = 'none';
        document.body.style.userSelect = 'none';
    }
    
    onDragMove(x, y, event) {
        const callbacks = this.callbacks.get(this.currentElement);
        if (callbacks && callbacks.onDragMove) {
            callbacks.onDragMove(x, y, event);
        }
    }
    
    onDragEnd(x, y, event) {
        const callbacks = this.callbacks.get(this.currentElement);
        if (callbacks && callbacks.onDragEnd) {
            callbacks.onDragEnd(x, y, event);
        }
        
        this.currentElement.style.zIndex = '';
        this.currentElement.style.pointerEvents = '';
        
        this.container.style.userSelect = '';
        document.body.style.userSelect = '';
    }
    
    findDraggableParent(element) {
        let current = element;
        
        while (current && current !== this.container) {
            if (current.dataset.draggable === 'true') {
                return current;
            }
            current = current.parentElement;
        }
        
        return null;
    }
    
    reset() {
        this.isDragging = false;
        this.currentElement = null;
        this.startPoint = null;
        this.offset = null;
    }
    
    getDragInfo() {
        return {
            isDragging: this.isDragging,
            element: this.currentElement,
            startPoint: this.startPoint
        };
    }
    
    setDragConstraints(minX, minY, maxX, maxY) {
        this.constraints = { minX, minY, maxX, maxY };
    }
    
    clearDragConstraints() {
        this.constraints = null;
    }
    
    applyConstraints(x, y) {
        if (!this.constraints) return { x, y };
        
        return {
            x: Math.max(this.constraints.minX, Math.min(this.constraints.maxX, x)),
            y: Math.max(this.constraints.minY, Math.min(this.constraints.maxY, y))
        };
    }
    
    destroy() {
        this.container.removeEventListener('mousedown', this.handleMouseDown.bind(this));
        this.container.removeEventListener('touchstart', this.handleTouchStart.bind(this));
        
        document.removeEventListener('mousemove', this.handleMouseMove.bind(this));
        document.removeEventListener('touchmove', this.handleTouchMove.bind(this));
        
        document.removeEventListener('mouseup', this.handleMouseUp.bind(this));
        document.removeEventListener('touchend', this.handleTouchEnd.bind(this));
        
        document.removeEventListener('mouseleave', this.handleMouseLeave.bind(this));
        document.removeEventListener('touchcancel', this.handleTouchCancel.bind(this));
        
        this.callbacks.clear();
    }
}

export default DragController;