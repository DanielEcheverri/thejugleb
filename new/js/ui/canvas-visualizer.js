class CanvasVisualizer {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.potValues = new Array(CONFIG.BLUETOOTH.numPotentiometers).fill(0);
        this.labels = [];
        this.lineColors = [];
        this.backgroundColors = [];
    }
    
    init(labels) {
        this.labels = labels;
        this.setupColors();
        
        const sketch = (p) => {
            p.setup = () => {
                const canvas = p.createCanvas(p.windowWidth, p.windowHeight * 0.35);
                canvas.parent('avatarCanvas');
            };
            
            p.draw = () => {
                p.background(255);
                
                const lineHeight = p.height / CONFIG.BLUETOOTH.numPotentiometers;
                const labelSize = Math.min(p.width, p.height) * 0.03;
                
                for (let i = 0; i < CONFIG.BLUETOOTH.numPotentiometers; i++) {
                    const lineY = i * lineHeight + lineHeight / 2;
                    
                    // Background
                    p.noStroke();
                    p.fill(this.backgroundColors[i]);
                    p.rect(0, i * lineHeight, p.width, lineHeight);
                    
                    // Line
                    p.strokeWeight(30);
                    p.stroke(this.lineColors[i]);
                    p.line(0, lineY, p.map(this.potValues[i], 0, 1024, 0, p.width * 0.55), lineY);
                    
                    // Value text
                    p.noStroke();
                    p.fill(255);
                    p.textFont('Roboto');
                    p.textAlign(p.RIGHT, p.CENTER);
                    p.textSize(labelSize);
                    p.text(
                        Math.floor(this.potValues[i]),
                        p.map(this.potValues[i], 0, 1024, 0, p.width * 0.55) - 10,
                        lineY
                    );
                }
                
                // Labels
                p.textAlign(p.RIGHT, p.CENTER);
                const labelFontSize = Math.min(p.width, p.height) * 0.04;
                p.textSize(labelFontSize);
                p.fill('#594F4D');
                
                for (let i = 0; i < CONFIG.BLUETOOTH.numPotentiometers; i++) {
                    p.text(
                        this.labels[i],
                        p.width * 0.9,
                        i * lineHeight + lineHeight / 2
                    );
                }
            };
            
            p.windowResized = () => {
                p.resizeCanvas(p.windowWidth, p.windowHeight * 0.35);
            };
        };
        
        new p5(sketch);
        
        // Listen for sensor updates
        this.eventBus.on('movement:sensors', (data) => {
            this.potValues = data.values;
        });
    }
    
    setupColors() {
        this.lineColors = CONFIG.COLORS.lines.map(c => color(c));
        this.backgroundColors = CONFIG.COLORS.backgrounds.map(c => color(c));
    }
}