/**
 * Browser Compatibility Detection Module
 * Assignment #4 - Complex Web Technologies
 */

class BrowserCompatibility {
    constructor() {
        this.capabilities = this.detectCapabilities();
        this.browserInfo = this.detectBrowser();
        this.displayResults();
    }

    detectCapabilities() {
        return {
            // Canvas Support
            hasCanvas: !!document.createElement('canvas').getContext,
            hasCanvasText: (() => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                return typeof ctx.fillText === 'function';
            })(),
            
            // Event Support
            hasPointerEvents: !!window.PointerEvent,
            hasTouchEvents: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
            hasMouseEvents: true, // Always supported
            
            // Advanced Features
            hasPassiveEvents: (() => {
                let supportsPassive = false;
                try {
                    const opts = Object.defineProperty({}, 'passive', {
                        get() { supportsPassive = true; }
                    });
                    window.addEventListener('test', null, opts);
                    window.removeEventListener('test', null, opts);
                } catch (e) {}
                return supportsPassive;
            })(),
            
            hasLocalStorage: (() => {
                try {
                    localStorage.setItem('test', 'test');
                    localStorage.removeItem('test');
                    return true;
                } catch (e) {
                    return false;
                }
            })(),
            
            // Performance Features
            hasRequestAnimationFrame: !!window.requestAnimationFrame,
            hasHardwareAcceleration: (() => {
                return CSS.supports('transform', 'translate3d(0,0,0)') ||
                       CSS.supports('-webkit-transform', 'translate3d(0,0,0)');
            })()
        };
    }

    detectBrowser() {
        const userAgent = navigator.userAgent;
        let browser = 'Unknown';
        let version = 'Unknown';
        let isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(userAgent);

        // Detect Chrome
        if (/Chrome/.test(userAgent) && !/Edge|Edg/.test(userAgent)) {
            browser = 'Chrome';
            version = userAgent.match(/Chrome\/(\d+)/)[1];
        }
        // Detect Firefox
        else if (/Firefox/.test(userAgent)) {
            browser = 'Firefox';
            version = userAgent.match(/Firefox\/(\d+)/)[1];
        }
        // Detect Safari
        else if (/Safari/.test(userAgent) && !/Chrome/.test(userAgent)) {
            browser = 'Safari';
            version = userAgent.match(/Version\/(\d+)/)?.[1] || 'Unknown';
        }
        // Detect Edge
        else if (/Edge|Edg/.test(userAgent)) {
            browser = 'Edge';
            version = userAgent.match(/Edge?\/(\d+)/)[1];
        }
        // Detect Internet Explorer
        else if (/Trident/.test(userAgent)) {
            browser = 'Internet Explorer';
            version = userAgent.match(/rv:(\d+)/)?.[1] || '11';
        }

        return {
            name: browser,
            version: version,
            isMobile: isMobile,
            userAgent: userAgent
        };
    }

    getCompatibilityScore() {
        let score = 0;
        let maxScore = Object.keys(this.capabilities).length;
        
        Object.values(this.capabilities).forEach(capability => {
            if (capability) score++;
        });

        return Math.round((score / maxScore) * 100);
    }

    displayResults() {
        const resultsDiv = document.getElementById('compatibilityResults');
        if (!resultsDiv) return;

        const score = this.getCompatibilityScore();
        const scoreColor = score >= 90 ? 'green' : score >= 70 ? 'orange' : 'red';
        
        let html = `
            <div style="margin-bottom: 15px;">
                <strong>Detected Browser:</strong> ${this.browserInfo.name} ${this.browserInfo.version}
                ${this.browserInfo.isMobile ? '📱' : '💻'}
            </div>
            <div style="margin-bottom: 10px;">
                <strong>Compatibility Score:</strong> 
                <span style="color: ${scoreColor}; font-weight: bold;">${score}%</span>
            </div>
            <div style="font-size: 0.9em;">
        `;

        // Add capability checkboxes
        for (const [key, value] of Object.entries(this.capabilities)) {
            const friendlyName = key.replace(/([A-Z])/g, ' $1')
                                   .replace(/^./, str => str.toUpperCase());
            const icon = value ? '✅' : '❌';
            const color = value ? 'green' : 'red';
            
            html += `
                <div style="display: flex; justify-content: space-between; padding: 3px 0;">
                    <span>${icon} ${friendlyName}</span>
                    <span style="color: ${color}; font-weight: bold;">
                        ${value ? 'Supported' : 'Not Supported'}
                    </span>
                </div>
            `;
        }

        html += `</div>`;
        resultsDiv.innerHTML = html;

        // Update GitHub link with browser info
        const githubLink = document.getElementById('githubLink');
        if (githubLink) {
            githubLink.textContent = `GitHub (Tested on ${this.browserInfo.name})`;
        }

        // Show warning for low compatibility
        if (score < 70) {
            this.showCompatibilityWarning();
        }
    }

    showCompatibilityWarning() {
        const warning = document.createElement('div');
        warning.style.cssText = `
            background: #fff3cd;
            border: 1px solid #ffc107;
            color: #856404;
            padding: 15px;
            border-radius: 5px;
            margin: 15px 0;
            text-align: center;
        `;
        warning.innerHTML = `
            <strong><i class="fas fa-exclamation-triangle"></i> Compatibility Warning</strong>
            <p>Your browser has limited support for some features. 
            For best experience, please update to the latest version or use Chrome/Firefox.</p>
        `;
        
        const resultsDiv = document.getElementById('compatibilityResults');
        resultsDiv.parentNode.insertBefore(warning, resultsDiv.nextSibling);
    }

    getCapabilities() {
        return this.capabilities;
    }

    getBrowserInfo() {
        return this.browserInfo;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.browserCompatibility = new BrowserCompatibility();
});

console.log('Compatibility module loaded');