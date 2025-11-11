class BluetoothManager {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.device = null;
        this.characteristic = null;
        this.isConnected = false;
        this.deviceName = 'Unknown';
    }
    
    async connect() {
        try {
            if (this.isConnected) {
                await this.disconnect();
                return;
            }
            
            // Request device
            this.device = await navigator.bluetooth.requestDevice({
                filters: [{ services: [CONFIG.BLUETOOTH.serviceUUID] }]
            });
            
            // Connect to GATT server
            const server = await this.device.gatt.connect();
            const service = await server.getPrimaryService(CONFIG.BLUETOOTH.serviceUUID);
            this.characteristic = await service.getCharacteristic(CONFIG.BLUETOOTH.characteristicUUID);
            
            // Start notifications
            await this.characteristic.startNotifications();
            this.characteristic.addEventListener(
                'characteristicvaluechanged',
                (event) => this.handleData(event)
            );
            
            this.deviceName = this.device.name;
            this.isConnected = true;
            
            this.eventBus.emit('bluetooth:connected', {
                deviceName: this.deviceName
            });
            
            console.log('Connected to:', this.deviceName);
            
        } catch (error) {
            console.error('Bluetooth connection error:', error);
            this.eventBus.emit('bluetooth:error', error);
        }
    }
    
    async disconnect() {
        try {
            if (this.characteristic) {
                await this.characteristic.stopNotifications();
            }
            if (this.device && this.device.gatt.connected) {
                await this.device.gatt.disconnect();
            }
            
            this.isConnected = false;
            this.eventBus.emit('bluetooth:disconnected');
            
            console.log('Disconnected from Bluetooth device');
            
        } catch (error) {
            console.error('Bluetooth disconnection error:', error);
        }
    }
    
    handleData(event) {
        const value = event.target.value;
        const textDecoder = new TextDecoder();
        const decodedValue = textDecoder.decode(value);
        
        this.eventBus.emit('bluetooth:data', {
            data: decodedValue
        });
    }
    
    getStatus() {
        return {
            isConnected: this.isConnected,
            deviceName: this.deviceName
        };
    }
}