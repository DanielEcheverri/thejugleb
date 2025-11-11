class GeolocationTracker {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.latitude = null;
        this.longitude = null;
        this.speed = 0;
        this.direction = 'Not moving';
        this.totalDistance = 0;
        this.previousPosition = null;
    }
    
    init() {
        if (!navigator.geolocation) {
            console.error('Geolocation not supported');
            return;
        }
        
        const options = {
            enableHighAccuracy: true
        };
        
        navigator.geolocation.watchPosition(
            position => this.handlePosition(position),
            error => this.handleError(error),
            options
        );
    }
    
    handlePosition(position) {
        this.latitude = position.coords.latitude.toFixed(6);
        this.longitude = position.coords.longitude.toFixed(6);
        this.speed = position.coords.speed || 0;
        
        // Calculate distance traveled
        const speedThreshold = CONFIG.LOCATION.speedThreshold;
        
        if (this.speed < speedThreshold) {
            this.totalDistance = 0;
        } else if (this.previousPosition) {
            const distance = Utils.calculateDistance(
                this.previousPosition.coords.latitude,
                this.previousPosition.coords.longitude,
                position.coords.latitude,
                position.coords.longitude
            );
            this.totalDistance += distance;
        }
        
        this.previousPosition = position;
        
        // Determine direction
        const heading = position.coords.heading || 0;
        this.direction = this.getDirectionText(heading, this.speed >= speedThreshold);
        
        // Emit location update event
        this.eventBus.emit('location:updated', {
            latitude: this.latitude,
            longitude: this.longitude,
            speed: this.speed,
            direction: this.direction,
            totalDistance: this.totalDistance
        });
    }
    
    handleError(error) {
        console.error('Geolocation error:', error);
    }
    
    getDirectionText(heading, isMoving) {
        if (!isMoving) return 'somewhere';
        
        if (heading >= 337.5 || heading < 22.5) return 'north';
        if (heading >= 22.5 && heading < 67.5) return 'northeast';
        if (heading >= 67.5 && heading < 112.5) return 'east';
        if (heading >= 112.5 && heading < 157.5) return 'southeast';
        if (heading >= 157.5 && heading < 202.5) return 'south';
        if (heading >= 202.5 && heading < 247.5) return 'southwest';
        if (heading >= 247.5 && heading < 292.5) return 'west';
        if (heading >= 292.5 && heading < 337.5) return 'northwest';
        
        return 'somewhere';
    }
    
    getPosition() {
        return {
            latitude: this.latitude,
            longitude: this.longitude,
            speed: this.speed,
            direction: this.direction,
            totalDistance: this.totalDistance
        };
    }
}