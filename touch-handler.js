// touch-handler.js
// Touch gesture handling for swipe navigation and long press detection

class TouchHandler {
    constructor(container, callbacks) {
        this.container = container;
        this.callbacks = callbacks;
        this.longPressTimer = null;
        this.longPressPosition = { x: 0, y: 0 };
        
        this.setupTouchHandlers();
    }

    setupTouchHandlers() {
        let startX, startY, startTime;
        let isLongPress = false;

        this.container.addEventListener("touchstart", (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            startTime = Date.now();
            
            // Long press detection for day view
            if (this.callbacks.isInDayView && this.callbacks.isInDayView()) {
                isLongPress = false;
                this.longPressPosition = { x: startX, y: startY };
                this.longPressTimer = setTimeout(() => {
                    isLongPress = true;
                    if (this.callbacks.onLongPress) {
                        this.callbacks.onLongPress(this.longPressPosition);
                    }
                }, 500); // 500ms for long press
            }
        });
        
        this.container.addEventListener("touchmove", () => {
            // Cancel long press if user moves
            if (this.longPressTimer) {
                clearTimeout(this.longPressTimer);
                this.longPressTimer = null;
            }
        });

        this.container.addEventListener("touchend", (e) => {
            // Clear long press timer
            if (this.longPressTimer) {
                clearTimeout(this.longPressTimer);
                this.longPressTimer = null;
            }
            
            if (isLongPress) {
                isLongPress = false;
                return; // Don't process swipes after long press
            }
            
            if (!startX || !startY) return;

            const endX = e.changedTouches[0].clientX;
            const endY = e.changedTouches[0].clientY;
            const deltaX = endX - startX;
            const deltaY = endY - startY;
            const deltaTime = Date.now() - startTime;

            // Minimum swipe distance and maximum time
            if (Math.abs(deltaX) < 50 && Math.abs(deltaY) < 50)
                return;
            if (deltaTime > 300) return;

            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                // Horizontal swipe
                if (deltaX > 0) {
                    this.handleSwipeRight();
                } else {
                    this.handleSwipeLeft();
                }
            } else {
                // Vertical swipe
                if (deltaY > 0) {
                    this.handleSwipeDown();
                } else {
                    this.handleSwipeUp();
                }
            }

            startX = startY = null;
        });
    }

    handleSwipeUp() {
        if (this.callbacks.onSwipeUp) {
            this.callbacks.onSwipeUp();
        }
    }

    handleSwipeDown() {
        if (this.callbacks.onSwipeDown) {
            this.callbacks.onSwipeDown();
        }
    }

    handleSwipeLeft() {
        if (this.callbacks.onSwipeLeft) {
            this.callbacks.onSwipeLeft();
        }
    }

    handleSwipeRight() {
        if (this.callbacks.onSwipeRight) {
            this.callbacks.onSwipeRight();
        }
    }

    getLongPressPosition() {
        return this.longPressPosition;
    }
}

export default TouchHandler;