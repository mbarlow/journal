export class GestureTracker {
    constructor(element, options = {}) {
        this.element = element;
        this.longPressDelay = options.longPressDelay || 500;
        this.dragThreshold = options.dragThreshold || 10;
        
        this.isTracking = false;
        this.touchIdentifier = null;
        this.startPoint = null;
        this.currentPoint = null;
        this.longPressTimer = null;
        
        this.callbacks = {
            onLongPressStart: options.onLongPressStart || null,
            onLongPressMove: options.onLongPressMove || null,
            onLongPressEnd: options.onLongPressEnd || null,
            onDragStart: options.onDragStart || null,
            onDragMove: options.onDragMove || null,
            onDragEnd: options.onDragEnd || null
        };
        
        this.init();
    }
    
    init() {
        this.element.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        this.element.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        this.element.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
        this.element.addEventListener('touchcancel', this.handleTouchCancel.bind(this), { passive: false });
        
        this.element.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.element.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.element.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.element.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
    }
    
    handleTouchStart(e) {
        if (this.isTracking) return;
        
        const touch = e.touches[0];
        this.startTracking(touch.identifier, touch.clientX, touch.clientY, e);
    }
    
    handleTouchMove(e) {
        if (!this.isTracking) return;
        
        const touch = Array.from(e.touches).find(t => t.identifier === this.touchIdentifier);
        if (!touch) return;
        
        this.updatePosition(touch.clientX, touch.clientY, e);
    }
    
    handleTouchEnd(e) {
        if (!this.isTracking) return;
        
        const touch = Array.from(e.changedTouches).find(t => t.identifier === this.touchIdentifier);
        if (!touch) return;
        
        this.endTracking(e);
    }
    
    handleTouchCancel(e) {
        this.cancelTracking();
    }
    
    handleMouseDown(e) {
        if (this.isTracking) return;
        if (e.button !== 0) return;
        
        this.startTracking('mouse', e.clientX, e.clientY, e);
    }
    
    handleMouseMove(e) {
        if (!this.isTracking || this.touchIdentifier !== 'mouse') return;
        
        this.updatePosition(e.clientX, e.clientY, e);
    }
    
    handleMouseUp(e) {
        if (!this.isTracking || this.touchIdentifier !== 'mouse') return;
        
        this.endTracking(e);
    }
    
    handleMouseLeave(e) {
        if (this.touchIdentifier === 'mouse') {
            this.cancelTracking();
        }
    }
    
    startTracking(identifier, x, y, event) {
        this.isTracking = true;
        this.touchIdentifier = identifier;
        this.startPoint = { x, y };
        this.currentPoint = { x, y };
        
        this.longPressTimer = setTimeout(() => {
            this.handleLongPressStart(event);
        }, this.longPressDelay);
    }
    
    updatePosition(x, y, event) {
        this.currentPoint = { x, y };
        
        const distance = this.getDistance();
        
        if (distance > this.dragThreshold) {
            if (this.longPressTimer) {
                clearTimeout(this.longPressTimer);
                this.longPressTimer = null;
                this.handleDragStart(event);
            } else if (this.isDragging) {
                this.handleDragMove(event);
            } else if (this.isLongPressing) {
                this.handleLongPressMove(event);
            }
        }
    }
    
    endTracking(event) {
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
        }
        
        if (this.isDragging) {
            this.handleDragEnd(event);
        } else if (this.isLongPressing) {
            this.handleLongPressEnd(event);
        }
        
        this.reset();
    }
    
    cancelTracking() {
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
        }
        
        this.reset();
    }
    
    handleLongPressStart(event) {
        this.isLongPressing = true;
        if (this.callbacks.onLongPressStart) {
            event.preventDefault();
            this.callbacks.onLongPressStart(this.startPoint.x, this.startPoint.y, event);
        }
    }
    
    handleLongPressMove(event) {
        if (this.callbacks.onLongPressMove) {
            event.preventDefault();
            this.callbacks.onLongPressMove(this.currentPoint.x, this.currentPoint.y, event);
        }
    }
    
    handleLongPressEnd(event) {
        if (this.callbacks.onLongPressEnd) {
            event.preventDefault();
            this.callbacks.onLongPressEnd(this.currentPoint.x, this.currentPoint.y, event);
        }
    }
    
    handleDragStart(event) {
        this.isDragging = true;
        if (this.callbacks.onDragStart) {
            event.preventDefault();
            this.callbacks.onDragStart(this.startPoint.x, this.startPoint.y, event);
        }
    }
    
    handleDragMove(event) {
        if (this.callbacks.onDragMove) {
            event.preventDefault();
            this.callbacks.onDragMove(this.currentPoint.x, this.currentPoint.y, event);
        }
    }
    
    handleDragEnd(event) {
        if (this.callbacks.onDragEnd) {
            event.preventDefault();
            this.callbacks.onDragEnd(this.currentPoint.x, this.currentPoint.y, event);
        }
    }
    
    getDistance() {
        const dx = this.currentPoint.x - this.startPoint.x;
        const dy = this.currentPoint.y - this.startPoint.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    reset() {
        this.isTracking = false;
        this.isLongPressing = false;
        this.isDragging = false;
        this.touchIdentifier = null;
        this.startPoint = null;
        this.currentPoint = null;
        this.longPressTimer = null;
    }
    
    destroy() {
        this.element.removeEventListener('touchstart', this.handleTouchStart.bind(this));
        this.element.removeEventListener('touchmove', this.handleTouchMove.bind(this));
        this.element.removeEventListener('touchend', this.handleTouchEnd.bind(this));
        this.element.removeEventListener('touchcancel', this.handleTouchCancel.bind(this));
        
        this.element.removeEventListener('mousedown', this.handleMouseDown.bind(this));
        this.element.removeEventListener('mousemove', this.handleMouseMove.bind(this));
        this.element.removeEventListener('mouseup', this.handleMouseUp.bind(this));
        this.element.removeEventListener('mouseleave', this.handleMouseLeave.bind(this));
    }
}

export default GestureTracker;