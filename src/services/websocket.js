// src/services/websocket.js
const WebSocketService = {
    socket: null,

    connect(url, onMessage) {
        this.socket = new WebSocket(url);
        
        this.socket.onopen = () => {
            console.log('WebSocket connected');
        };

        this.socket.onmessage = (event) => {
            onMessage(JSON.parse(event.data));
        };

        this.socket.onclose = () => {
            console.log('WebSocket disconnected');
        };

        this.socket.onerror = (error) => {
            console.error('WebSocket error', error);
        };
    },

    disconnect() {
        if (this.socket) {
            this.socket.close();
        }
    }
};

export default WebSocketService;
