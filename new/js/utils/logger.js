class Logger {
    constructor() {
        this.outputDiv = null;
        this.messages = [];
        this.maxMessages = 2;
    }
    
    init(divId = 'consoleOutput') {
        this.outputDiv = document.getElementById(divId);
        if (!this.outputDiv) {
            console.error('Logger div not found');
            return;
        }
        
        // Override console methods
        const originalLog = console.log;
        const originalError = console.error;
        
        console.log = (...args) => {
            originalLog(...args);
            this.log('DEBUG', ...args);
        };
        
        console.error = (...args) => {
            originalError(...args);
            this.log('ERROR', ...args);
        };
    }
    
    log(type, ...args) {
        const message = args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg) : arg
        ).join(' ');
        
        this.messages.push(`<strong>CONSOLE ${type}:</strong> ${message}`);
        
        if (this.messages.length > this.maxMessages) {
            this.messages.shift();
        }
        
        this.updateDisplay();
    }
    
    updateDisplay() {
        if (this.outputDiv) {
            this.outputDiv.innerHTML = this.messages
                .map(msg => `<div class="log">${msg}</div>`)
                .join('');
        }
    }
}