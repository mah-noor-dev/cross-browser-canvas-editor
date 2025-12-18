/**
 * Unified Input Handler for Cross-Browser Compatibility
 * Assignment #4 - Complex Web Technologies
 */

class UnifiedInputHandler {
    constructor(canvas, canvasEditor) {
        this.canvas = canvas;
        this.editor = canvasEditor;
        this.capabilities = window.browserCompatibility?.getCapabilities() || {};
        
        this.setupEventListeners();
        this.setupTouchGestures();
        
        console.log('Input handler initialized with capabilities:', this.capabilities);
    }

    setupEventListeners() {
        const options = this.capabilities.hasPassiveEvents ? 
                       { passive: false } : false;
        
        // Pointer Events (Modern browsers)
        if (this.capabilities.hasPointerEvents) {
            console.log('Using Pointer Events API');
            this.canvas.addEventListener('pointerdown', this.handleStart.bind(this), options);
            this.canvas.addEventListener('pointermove', this.handleMove.bind(this), options);
            this.canvas.addEventListener('pointerup', this.handleEnd.bind(this), options);
            this.canvas.addEventListener('pointercancel', this.handleEnd.bind(this), options);
        }
        // Touch Events (Mobile devices)
        else if (this.capabilities.hasTouchEvents) {
            console.log('Using Touch Events API');
            this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), options);
            this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this), options);
            this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this), options);
            this.canvas.addEventListener('touchcancel', this.handleTouchEnd.bind(this), options);
            
            // Prevent scrolling on canvas
            this.canvas.addEventListener('touchmove', (e) => {
                if (e.scale !== 1) e.preventDefault();
            }, { passive: false });
        }
        // Mouse Events (Fallback for all browsers)
        else {
            console.log('Using Mouse Events API (fallback)');
            this.canvas.addEventListener('mousedown', this.handleMouseStart.bind(this));
            this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
            this.canvas.addEventListener('mouseup', this.handleMouseEnd.bind(this));
            this.canvas.addEventListener('mouseleave', this.handleMouseEnd.bind(this));
        }

        // Context menu prevention
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        
        // Window resize
        window.addEventListener('resize', () => {
            setTimeout(() => this.editor.resizeCanvas(), 100);
        });
    }

    setupTouchGestures() {
        // For multi-touch gestures (pinch zoom, etc.)
        if (this.capabilities.hasTouchEvents) {
            let initialDistance = null;
            
            this.canvas.addEventListener('touchstart', (e) => {
                if (e.touches.length === 2) {
                    initialDistance = this.getTouchDistance(e.touches[0], e.touches[1]);
                }
            });
            
            this.canvas.addEventListener('touchmove', (e) => {
                if (e.touches.length === 2 && initialDistance !== null) {
                    e.preventDefault();
                    const currentDistance = this.getTouchDistance(e.touches[0], e.touches[1]);
                    const scale = currentDistance / initialDistance;
                    
                    // Adjust brush size with pinch gesture
                    const newSize = Math.max(1, Math.min(50, Math.round(this.editor.brushSize * scale)));
                    document.getElementById('brushSize').value = newSize;
                    document.getElementById('brushSizeValue').textContent = `${newSize}px`;
                    this.editor.ctx.lineWidth = newSize;
                    this.editor.brushSize = newSize;
                }
            });
            
            this.canvas.addEventListener('touchend', () => {
                initialDistance = null;
            });
        }
    }

    getTouchDistance(touch1, touch2) {
        const dx = touch1.clientX - touch2.clientX;
        const dy = touch1.clientY - touch2.clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    getCanvasCoordinates(event) {
        const rect = this.canvas.getBoundingClientRect();
        let x, y;
        
        if (event.type.includes('touch')) {
            const touch = event.touches[0] || event.changedTouches[0];
            x = touch.clientX - rect.left;
            y = touch.clientY - rect.top;
        } else {
            x = event.clientX - rect.left;
            y = event.clientY - rect.top;
        }
        
        // Adjust for canvas scaling
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        return {
            x: x * scaleX,
            y: y * scaleY
        };
    }

    // Pointer Events Handlers
    handleStart(event) {
        event.preventDefault();
        const { x, y } = this.getCanvasCoordinates(event);
        this.editor.startDrawing(x, y);
        this.updateTouchOverlay(false);
    }

    handleMove(event) {
        event.preventDefault();
        const { x, y } = this.getCanvasCoordinates(event);
        this.editor.draw(x, y);
    }

    handleEnd(event) {
        event.preventDefault();
        const { x, y } = this.getCanvasCoordinates(event);
        this.editor.stopDrawing(x, y);
        this.updateTouchOverlay(true);
    }

    // Touch Events Handlers
    handleTouchStart(event) {
        if (event.touches.length === 1) {
            this.handleStart(event);
        }
    }

    handleTouchMove(event) {
        if (event.touches.length === 1) {
            this.handleMove(event);
        }
    }

    handleTouchEnd(event) {
        this.handleEnd(event);
    }

    // Mouse Events Handlers
    handleMouseStart(event) {
        if (event.button === 0) { // Left click only
            this.handleStart(event);
        }
    }

    handleMouseMove(event) {
        if (event.buttons === 1) { // Left button pressed
            this.handleMove(event);
        }
    }

    handleMouseEnd(event) {
        this.handleEnd(event);
    }

    updateTouchOverlay(show) {
        const overlay = document.getElementById('touchOverlay');
        if (overlay) {
            overlay.style.opacity = show ? '1' : '0';
            overlay.style.transition = 'opacity 0.3s';
        }
    }

    // For drag and drop functionality
    setupDragAndDrop() {
        this.canvas.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.canvas.style.borderColor = '#4a6fa5';
        });
        
        this.canvas.addEventListener('dragleave', () => {
            this.canvas.style.borderColor = '#2e4a76';
        });
        
        this.canvas.addEventListener('drop', (e) => {
            e.preventDefault();
            this.canvas.style.borderColor = '#2e4a76';
            
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                this.loadImageToCanvas(file);
            }
        });
    }

    loadImageToCanvas(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const ctx = this.editor.getCanvasContext();
                ctx.drawImage(img, 0, 0, this.canvas.width, this.canvas.height);
                this.editor.saveState();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (window.canvasEditor && window.browserCompatibility) {
        const canvas = window.canvasEditor.getCanvas();
        window.inputHandler = new UnifiedInputHandler(canvas, window.canvasEditor);
        
        // Also setup drag and drop
        window.inputHandler.setupDragAndDrop();
    }
});

console.log('Input handler module loaded');