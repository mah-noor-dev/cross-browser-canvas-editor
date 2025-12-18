/**
 * Main Application Controller
 * Assignment #4 - Complex Web Technologies
 */

class CanvasApplication {
    constructor() {
        this.init();
        this.setupApplication();
        this.setupPerformanceMonitoring();
    }

    init() {
        console.log('Canvas Application Initializing...');
        
        // Wait for all modules to load
        this.waitForModules().then(() => {
            this.setupUIInteractions();
            this.setupKeyboardShortcuts();
            this.displayWelcomeMessage();
        }).catch(error => {
            console.error('Failed to initialize application:', error);
            this.showErrorFallback();
        });
    }

    waitForModules() {
        return new Promise((resolve) => {
            const checkInterval = setInterval(() => {
                if (window.canvasEditor && window.inputHandler && window.browserCompatibility) {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 100);
            
            // Timeout after 5 seconds
            setTimeout(() => {
                clearInterval(checkInterval);
                resolve(); // Continue even if some modules fail
            }, 5000);
        });
    }

    setupApplication() {
        // Set initial color
        const initialColor = '#007aff';
        if (window.canvasEditor) {
            window.canvasEditor.setColor(initialColor);
        }
        
        // Set initial tool
        this.setActiveTool('brush');
        
        // Setup GitHub link
        this.setupGitHubLink();
        
        // Add offline support
        this.setupOfflineSupport();
    }

    setupUIInteractions() {
        // Color palette interactions
        document.querySelectorAll('.color-option').forEach(color => {
            color.addEventListener('click', (e) => {
                const colorValue = e.target.dataset.color;
                this.setActiveColor(colorValue);
            });
        });
        
        // Color picker interaction
        const colorPicker = document.getElementById('colorPicker');
        if (colorPicker) {
            colorPicker.addEventListener('change', (e) => {
                this.setActiveColor(e.target.value);
            });
        }
        
        // Clear canvas confirmation
        document.getElementById('clearCanvas')?.addEventListener('click', () => {
            this.confirmClearCanvas();
        });
        
        // Save canvas
        document.getElementById('saveCanvas')?.addEventListener('click', () => {
            this.saveCanvasWithFeedback();
        });
        
        // Undo with visual feedback
        document.getElementById('undoBtn')?.addEventListener('click', () => {
            this.undoWithFeedback();
        });
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Don't trigger shortcuts if user is typing
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            
            switch(e.key.toLowerCase()) {
                case 'b':
                    this.setActiveTool('brush');
                    e.preventDefault();
                    break;
                case 'e':
                    this.setActiveTool('eraser');
                    e.preventDefault();
                    break;
                case 'l':
                    this.setActiveTool('line');
                    e.preventDefault();
                    break;
                case 'r':
                    this.setActiveTool('rectangle');
                    e.preventDefault();
                    break;
                case 'c':
                    this.setActiveTool('circle');
                    e.preventDefault();
                    break;
                case 'z':
                    if (e.ctrlKey || e.metaKey) {
                        window.canvasEditor?.undo();
                        this.showToast('Undo performed');
                        e.preventDefault();
                    }
                    break;
                case 's':
                    if (e.ctrlKey || e.metaKey) {
                        window.canvasEditor?.saveCanvas();
                        e.preventDefault();
                    }
                    break;
                case 'delete':
                case 'backspace':
                    this.confirmClearCanvas();
                    e.preventDefault();
                    break;
            }
        });
    }

    setActiveTool(tool) {
        if (window.canvasEditor) {
            window.canvasEditor.setTool(tool);
            this.showToast(`Tool: ${tool.charAt(0).toUpperCase() + tool.slice(1)}`);
        }
    }

    setActiveColor(color) {
        if (window.canvasEditor) {
            window.canvasEditor.setColor(color);
            
            // Update active state in palette
            document.querySelectorAll('.color-option').forEach(option => {
                option.classList.toggle('active', option.dataset.color === color);
            });
        }
    }

    confirmClearCanvas() {
        if (confirm('Clear the entire canvas? This action cannot be undone.')) {
            window.canvasEditor?.clearCanvas();
            this.showToast('Canvas cleared');
        }
    }

    saveCanvasWithFeedback() {
        if (window.canvasEditor) {
            window.canvasEditor.saveCanvas();
            this.showToast('Image saved successfully!');
        }
    }

    undoWithFeedback() {
        if (window.canvasEditor) {
            window.canvasEditor.undo();
            this.showToast('Undo performed');
        }
    }

    setupGitHubLink() {
        const githubLink = document.getElementById('githubLink');
        if (githubLink) {
            githubLink.href = 'https://github.com/yourusername/cross-browser-canvas-editor';
            githubLink.target = '_blank';
            
            // Add click tracking
            githubLink.addEventListener('click', () => {
                this.trackEvent('github_link_click');
            });
        }
    }

    setupOfflineSupport() {
        // Cache important assets
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').catch(console.error);
        }
        
        // Offline detection
        window.addEventListener('online', () => {
            this.showToast('Back online!', 'success');
        });
        
        window.addEventListener('offline', () => {
            this.showToast('You are offline. Some features may be limited.', 'warning');
        });
    }

    setupPerformanceMonitoring() {
        // Monitor FPS
        let frameCount = 0;
        let lastTime = performance.now();
        
        const measureFPS = () => {
            frameCount++;
            const currentTime = performance.now();
            
            if (currentTime - lastTime >= 1000) {
                const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
                
                // Log low FPS for debugging
                if (fps < 30) {
                    console.warn(`Low FPS detected: ${fps}`);
                }
                
                frameCount = 0;
                lastTime = currentTime;
            }
            
            requestAnimationFrame(measureFPS);
        };
        
        measureFPS();
    }

    displayWelcomeMessage() {
        const browserInfo = window.browserCompatibility?.getBrowserInfo();
        const capabilities = window.browserCompatibility?.getCapabilities();
        
        if (browserInfo && capabilities) {
            const message = `
                Welcome to Cross-Browser Canvas Editor!
                
                Browser: ${browserInfo.name} ${browserInfo.version}
                ${browserInfo.isMobile ? 'Mobile' : 'Desktop'} Mode
                
                Features Available:
                ${capabilities.hasPointerEvents ? '✓ Pointer Events' : '✗ Pointer Events'}
                ${capabilities.hasTouchEvents ? '✓ Touch Support' : '✗ Touch Support'}
                ${capabilities.hasPassiveEvents ? '✓ Passive Events' : '✗ Passive Events'}
                
                Keyboard Shortcuts:
                B - Brush | E - Eraser | L - Line
                R - Rectangle | C - Circle
                Ctrl+Z - Undo | Ctrl+S - Save
            `;
            
            console.log(message);
            
            // Show first-time usage tips
            if (!localStorage.getItem('canvasEditorSeenTips')) {
                setTimeout(() => {
                    this.showToast('💡 Tip: Use keyboard shortcuts for faster drawing!', 'info');
                    localStorage.setItem('canvasEditorSeenTips', 'true');
                }, 2000);
            }
        }
    }

    showErrorFallback() {
        const canvas = document.getElementById('mainCanvas');
        if (canvas) {
            canvas.innerHTML = `
                <div style="padding: 40px; text-align: center; color: #666;">
                    <h3>⚠️ Compatibility Issue Detected</h3>
                    <p>Your browser has limited canvas support.</p>
                    <p>Please try:</p>
                    <ul style="text-align: left; display: inline-block;">
                        <li>Updating your browser</li>
                        <li>Using Chrome or Firefox</li>
                        <li>Enabling JavaScript</li>
                    </ul>
                    <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px;">
                        Retry
                    </button>
                </div>
            `;
        }
    }

    showToast(message, type = 'info') {
        // Remove existing toasts
        const existingToast = document.querySelector('.toast-message');
        if (existingToast) existingToast.remove();
        
        // Create toast
        const toast = document.createElement('div');
        toast.className = `toast-message toast-${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: ${type === 'success' ? '#4caf50' : type === 'warning' ? '#ff9800' : '#2196f3'};
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(toast);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
        
        // Add CSS animations
        if (!document.querySelector('#toast-animations')) {
            const style = document.createElement('style');
            style.id = 'toast-animations';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }

    trackEvent(eventName) {
        // Simple event tracking for analytics
        console.log(`Event tracked: ${eventName}`, new Date().toISOString());
        
        // Store in localStorage for offline tracking
        try {
            const events = JSON.parse(localStorage.getItem('canvasEvents') || '[]');
            events.push({
                event: eventName,
                timestamp: new Date().toISOString(),
                browser: navigator.userAgent
            });
            localStorage.setItem('canvasEvents', JSON.stringify(events.slice(-100))); // Keep last 100 events
        } catch (e) {
            // Silently fail if localStorage is not available
        }
    }
}

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    window.canvasApp = new CanvasApplication();
    
    // Export for debugging
    console.log('Application initialized. Available objects:');
    console.log('- window.canvasApp');
    console.log('- window.canvasEditor');
    console.log('- window.inputHandler');
    console.log('- window.browserCompatibility');
});

console.log('Main application module loaded');