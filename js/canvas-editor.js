/**
 * Canvas Editor Core Module
 * Assignment #4 - Complex Web Technologies
 */

class CanvasEditor {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        
        // Drawing State
        this.isDrawing = false;
        this.lastX = 0;
        this.lastY = 0;
        this.currentTool = 'brush';
        this.currentColor = '#007aff';
        this.brushSize = 5;
        this.history = [];
        this.historyIndex = -1;
        
        // Initialize canvas
        this.initCanvas();
        this.setupEventListeners();
        this.saveState();
    }

    initCanvas() {
        // Set canvas size based on container
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
        
        // Set default styles
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.strokeStyle = this.currentColor;
        this.ctx.lineWidth = this.brushSize;
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        console.log('Canvas initialized:', this.canvas.width, 'x', this.canvas.height);
    }

    setupEventListeners() {
        // Tool selection
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setTool(e.target.closest('.tool-btn').dataset.tool);
            });
        });

        // Color selection
        document.querySelectorAll('.color-option').forEach(color => {
            color.addEventListener('click', (e) => {
                this.setColor(e.target.dataset.color);
            });
        });

        // Color picker
        const colorPicker = document.getElementById('colorPicker');
        if (colorPicker) {
            colorPicker.addEventListener('input', (e) => {
                this.setColor(e.target.value);
            });
        }

        // Brush size
        const brushSize = document.getElementById('brushSize');
        const brushSizeValue = document.getElementById('brushSizeValue');
        if (brushSize && brushSizeValue) {
            brushSize.addEventListener('input', (e) => {
                this.brushSize = parseInt(e.target.value);
                brushSizeValue.textContent = `${this.brushSize}px`;
                this.ctx.lineWidth = this.brushSize;
            });
        }

        // Action buttons
        document.getElementById('clearCanvas')?.addEventListener('click', () => this.clearCanvas());
        document.getElementById('saveCanvas')?.addEventListener('click', () => this.saveCanvas());
        document.getElementById('undoBtn')?.addEventListener('click', () => this.undo());
    }

    setTool(tool) {
        this.currentTool = tool;
        
        // Update UI
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tool="${tool}"]`)?.classList.add('active');
        
        // Change cursor
        switch(tool) {
            case 'brush':
                this.canvas.style.cursor = 'crosshair';
                break;
            case 'eraser':
                this.canvas.style.cursor = 'cell';
                break;
            case 'line':
            case 'rectangle':
            case 'circle':
                this.canvas.style.cursor = 'crosshair';
                break;
        }
    }

    setColor(color) {
        this.currentColor = color;
        this.ctx.strokeStyle = color;
        
        // Update UI
        document.querySelectorAll('.color-option').forEach(option => {
            option.classList.remove('active');
        });
        document.querySelector(`[data-color="${color}"]`)?.classList.add('active');
        
        // Update color picker
        const colorPicker = document.getElementById('colorPicker');
        if (colorPicker) colorPicker.value = color;
    }

    startDrawing(x, y) {
        this.isDrawing = true;
        [this.lastX, this.lastY] = [x, y];
        
        // For shapes, we need to save the starting point
        if (['line', 'rectangle', 'circle'].includes(this.currentTool)) {
            this.startX = x;
            this.startY = y;
            this.snapshot = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    draw(x, y) {
        if (!this.isDrawing) return;

        const ctx = this.ctx;
        
        switch(this.currentTool) {
            case 'brush':
                ctx.strokeStyle = this.currentColor;
                ctx.lineWidth = this.brushSize;
                ctx.beginPath();
                ctx.moveTo(this.lastX, this.lastY);
                ctx.lineTo(x, y);
                ctx.stroke();
                [this.lastX, this.lastY] = [x, y];
                break;

            case 'eraser':
                ctx.save();
                ctx.globalCompositeOperation = 'destination-out';
                ctx.lineWidth = this.brushSize;
                ctx.beginPath();
                ctx.moveTo(this.lastX, this.lastY);
                ctx.lineTo(x, y);
                ctx.stroke();
                ctx.restore();
                [this.lastX, this.lastY] = [x, y];
                break;

            case 'line':
            case 'rectangle':
            case 'circle':
                this.drawShapePreview(x, y);
                break;
        }
    }

    drawShapePreview(x, y) {
        if (!this.snapshot) return;
        
        // Restore original canvas
        this.ctx.putImageData(this.snapshot, 0, 0);
        
        this.ctx.strokeStyle = this.currentColor;
        this.ctx.lineWidth = this.brushSize;
        this.ctx.beginPath();
        
        switch(this.currentTool) {
            case 'line':
                this.ctx.moveTo(this.startX, this.startY);
                this.ctx.lineTo(x, y);
                break;
                
            case 'rectangle':
                const width = x - this.startX;
                const height = y - this.startY;
                this.ctx.strokeRect(this.startX, this.startY, width, height);
                break;
                
            case 'circle':
                const radius = Math.sqrt(
                    Math.pow(x - this.startX, 2) + 
                    Math.pow(y - this.startY, 2)
                );
                this.ctx.arc(this.startX, this.startY, radius, 0, Math.PI * 2);
                break;
        }
        
        this.ctx.stroke();
    }

    stopDrawing(x, y) {
        if (!this.isDrawing) return;
        
        // Finalize shape drawing
        if (['line', 'rectangle', 'circle'].includes(this.currentTool)) {
            this.drawShapePreview(x, y);
            this.saveState();
        } else if (this.currentTool === 'brush' || this.currentTool === 'eraser') {
            this.saveState();
        }
        
        this.isDrawing = false;
        this.snapshot = null;
    }

    clearCanvas() {
        if (confirm('Are you sure you want to clear the canvas?')) {
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.history = [];
            this.historyIndex = -1;
            this.saveState();
        }
    }

    saveCanvas() {
        const link = document.createElement('a');
        link.download = `canvas-editor-${new Date().getTime()}.png`;
        link.href = this.canvas.toDataURL('image/png');
        link.click();
    }

    saveState() {
        // Remove future states if we're not at the end
        if (this.historyIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.historyIndex + 1);
        }
        
        const state = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        this.history.push(state);
        this.historyIndex++;
        
        // Limit history to 50 states
        if (this.history.length > 50) {
            this.history.shift();
            this.historyIndex--;
        }
    }

    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.ctx.putImageData(this.history[this.historyIndex], 0, 0);
        } else if (this.historyIndex === 0) {
            // Clear to white
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.historyIndex = -1;
        }
    }

    resizeCanvas() {
        // Save current drawing
        const currentImage = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        
        // Resize canvas
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
        
        // Restore drawing
        this.ctx.putImageData(currentImage, 0, 0);
    }

    getCanvasContext() {
        return this.ctx;
    }

    getCanvas() {
        return this.canvas;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.canvasEditor = new CanvasEditor('mainCanvas');
});

console.log('Canvas editor module loaded');