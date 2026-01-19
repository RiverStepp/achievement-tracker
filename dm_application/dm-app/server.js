const WebSocket = require('ws');
const http = require('http');

// Create HTTP server
const server = http.createServer();
const wss = new WebSocket.Server({ server });

// Store connected clients with their usernames
const clients = new Map();

// Broadcast function to send messages
function sendToUser(username, message) {
    const client = clients.get(username);
    if (client && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify(message));
        return true;
    }
    return false;
}

// Handle WebSocket connections
wss.on('connection', (ws) => {
    let currentUser = null;

    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data);

            switch (message.type) {
                case 'register':
                    // Register a new user
                    currentUser = message.username;
                    clients.set(currentUser, { ws, username: currentUser });
                    
                    // Send confirmation
                    ws.send(JSON.stringify({
                        type: 'registered',
                        username: currentUser,
                        onlineUsers: Array.from(clients.keys()).filter(u => u !== currentUser)
                    }));

                    // Notify all other users
                    clients.forEach((client, username) => {
                        if (username !== currentUser) {
                            client.ws.send(JSON.stringify({
                                type: 'user_online',
                                username: currentUser
                            }));
                        }
                    });

                    console.log(`User registered: ${currentUser}`);
                    break;

                case 'dm':
                    // Send direct message
                    if (!currentUser) {
                        ws.send(JSON.stringify({
                            type: 'error',
                            message: 'Not registered'
                        }));
                        return;
                    }

                    const sent = sendToUser(message.to, {
                        type: 'dm',
                        from: currentUser,
                        message: message.message,
                        timestamp: new Date().toISOString()
                    });

                    // Send confirmation to sender
                    ws.send(JSON.stringify({
                        type: 'dm_sent',
                        to: message.to,
                        message: message.message,
                        timestamp: new Date().toISOString(),
                        delivered: sent
                    }));

                    console.log(`DM from ${currentUser} to ${message.to}: ${message.message}`);
                    break;

                case 'typing':
                    // Notify recipient that user is typing
                    if (currentUser) {
                        sendToUser(message.to, {
                            type: 'typing',
                            from: currentUser
                        });
                    }
                    break;
            }
        } catch (error) {
            console.error('Error processing message:', error);
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Invalid message format'
            }));
        }
    });

    ws.on('close', () => {
        if (currentUser) {
            clients.delete(currentUser);
            
            // Notify all users
            clients.forEach((client) => {
                client.ws.send(JSON.stringify({
                    type: 'user_offline',
                    username: currentUser
                }));
            });

            console.log(`User disconnected: ${currentUser}`);
        }
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log(`WebSocket server running on port ${PORT}`);
});
