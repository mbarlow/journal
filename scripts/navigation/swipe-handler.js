export class SwipeHandler {
    constructor(element, options = {}) {
        this.element = element;
        this.threshold = options.threshold || 50;
        this.velocity = options.velocity || 0.3;
        this.touchStart = null;
        this.touchEnd = null;
        this.startTime = null;
        this.callbacks = {
            onSwipeUp: options.onSwipeUp || null,
            onSwipeDown: options.onSwipeDown || null,
            onSwipeLeft: options.onSwipeLeft || null,
            onSwipeRight: options.onSwipeRight || null,
            onPinchIn: options.onPinchIn || null,
            onPinchOut: options.onPinchOut || null,
            onDoubleTap: options.onDoubleTap || null
        };
        
        this.touches = [];
        this.lastTapTime = 0;
        this.pinchStartDistance = 0;
        
        this.init();
    }
    
    init() {
        this.element.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        this.element.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        this.element.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
        this.element.addEventListener('touchcancel', this.handleTouchCancel.bind(this), { passive: false });
    }
    
    handleTouchStart(e) {
        this.touches = Array.from(e.touches);
        
        if (this.touches.length === 1) {
            this.touchStart = {
                x: this.touches[0].clientX,
                y: this.touches[0].clientY
            };
            this.startTime = Date.now();
            
            const currentTime = Date.now();
            if (currentTime - this.lastTapTime < 300) {
                this.handleDoubleTap(e);
            }
            this.lastTapTime = currentTime;
        } else if (this.touches.length === 2) {
            this.pinchStartDistance = this.getPinchDistance();
        }
    }
    
    handleTouchMove(e) {
        this.touches = Array.from(e.touches);
        
        if (this.touches.length === 2) {
            const currentDistance = this.getPinchDistance();
            const delta = currentDistance - this.pinchStartDistance;
            
            if (Math.abs(delta) > 30) {
                e.preventDefault();
                if (delta > 0 && this.callbacks.onPinchOut) {
                    this.callbacks.onPinchOut();
                } else if (delta < 0 && this.callbacks.onPinchIn) {
                    this.callbacks.onPinchIn();
                }
                this.pinchStartDistance = currentDistance;
            }
        }
    }
    
    handleTouchEnd(e) {
        if (this.touches.length === 1 && this.touchStart) {
            const touch = e.changedTouches[0];
            this.touchEnd = {
                x: touch.clientX,
                y: touch.clientY
            };
            
            const duration = Date.now() - this.startTime;
            const direction = this.detectSwipe(
                this.touchStart.x,
                this.touchStart.y,
                this.touchEnd.x,
                this.touchEnd.y,
                duration
            );
            
            if (direction) {
                e.preventDefault();
                this.triggerSwipe(direction);
            }
        }
        
        this.touches = Array.from(e.touches);
        if (this.touches.length === 0) {
            this.reset();
        }
    }
    
    handleTouchCancel() {
        this.reset();
    }
    
    handleDoubleTap(e) {
        if (this.callbacks.onDoubleTap) {
            e.preventDefault();
            this.callbacks.onDoubleTap();
        }
    }
    
    detectSwipe(startX, startY, endX, endY, duration) {
        const deltaX = endX - startX;
        const deltaY = endY - startY;
        const distance = Math.sqrt(deltaX ** 2 + deltaY ** 2);
        
        if (distance < this.threshold) return null;
        
        const velocity = distance / duration;
        if (velocity < this.velocity) return null;
        
        const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
        
        if (angle > -45 && angle <= 45) return 'right';
        if (angle > 45 && angle <= 135) return 'down';
        if (angle > 135 || angle <= -135) return 'left';
        if (angle > -135 && angle <= -45) return 'up';
        
        return null;
    }
    
    triggerSwipe(direction) {
        const callback = this.callbacks[`onSwipe${direction.charAt(0).toUpperCase() + direction.slice(1)}`];
        if (callback) callback();
    }
    
    getPinchDistance() {
        if (this.touches.length !== 2) return 0;
        
        const dx = this.touches[0].clientX - this.touches[1].clientX;
        const dy = this.touches[0].clientY - this.touches[1].clientY;
        return Math.sqrt(dx ** 2 + dy ** 2);
    }
    
    reset() {
        this.touchStart = null;
        this.touchEnd = null;
        this.startTime = null;
        this.touches = [];
        this.pinchStartDistance = 0;
    }
    
    destroy() {
        this.element.removeEventListener('touchstart', this.handleTouchStart.bind(this));
        this.element.removeEventListener('touchmove', this.handleTouchMove.bind(this));
        this.element.removeEventListener('touchend', this.handleTouchEnd.bind(this));
        this.element.removeEventListener('touchcancel', this.handleTouchCancel.bind(this));
    }
}

export default SwipeHandler;