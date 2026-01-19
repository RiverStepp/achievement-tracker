class DMClient {
    constructor(serverUrl) {
        this.serverUrl = serverUrl;
        this.ws = null;
        this.username = null;
        this.currentChat = null;
        this.conversations = new Map(); // Store messages per user
        this.onlineUsers = new Set();
        this.typingTimeout = null;

        this.initializeElements();
        this.attachEventListeners();
    }

    initializeElements() {
        // Login elements
        this.loginOverlay = document.getElementById('loginOverlay');
        this.usernameInput = document.getElementById('usernameInput');
        this.loginButton = document.getElementById('loginButton');

        // UI elements
        this.currentUsernameEl = document.getElementById('currentUsername');
        this.usersList = document.getElementById('usersList');
        this.chatHeader = document.getElementById('chatHeader');
        this.messagesContainer = document.getElementById('messagesContainer');
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendButton');
        this.typingIndicator = document.getElementById('typingIndicator');
        this.connectionStatus = document.getElementById('connectionStatus');
    }

    attachEventListeners() {
        // Login
        this.loginButton.addEventListener('click', () => this.login());
        this.usernameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.login();
        });

        // Messaging
        this.sendButton.addEventListener('click', () => this.sendMessage());
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });

        // Typing indicator
        this.messageInput.addEventListener('input', () => this.handleTyping());
    }

    login() {
        const username = this.usernameInput.value.trim();
        if (!username) {
            alert('Please enter a username');
            return;
        }

        this.username = username;
        this.connect();
    }

    connect() {
        try {
            this.ws = new WebSocket(this.serverUrl);

            this.ws.onopen = () => {
                console.log('Connected to server');
                this.updateConnectionStatus(true);
                
                // Register user
                this.send({
                    type: 'register',
                    username: this.username
                });
            };

            this.ws.onmessage = (event) => {
                const message = JSON.parse(event.data);
                this.handleMessage(message);
            };

            this.ws.onclose = () => {
                console.log('Disconnected from server');
                this.updateConnectionStatus(false);
                setTimeout(() => this.connect(), 3000); // Reconnect after 3s
            };

            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
            };
        } catch (error) {
            console.error('Connection error:', error);
            this.updateConnectionStatus(false);
        }
    }

    send(data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        }
    }

    handleMessage(message) {
        switch (message.type) {
            case 'registered':
                this.loginOverlay.style.display = 'none';
                this.currentUsernameEl.textContent = message.username;
                
                // Add online users
                message.onlineUsers.forEach(user => {
                    this.onlineUsers.add(user);
                });
                this.updateUsersList();
                break;

            case 'user_online':
                this.onlineUsers.add(message.username);
                this.updateUsersList();
                break;

            case 'user_offline':
                this.onlineUsers.delete(message.username);
                this.updateUsersList();
                break;

            case 'dm':
                this.addMessage(message.from, message.message, message.timestamp, false);
                break;

            case 'dm_sent':
                this.addMessage(message.to, message.message, message.timestamp, true);
                break;

            case 'typing':
                if (this.currentChat === message.from) {
                    this.showTypingIndicator(message.from);
                }
                break;

            case 'error':
                console.error('Server error:', message.message);
                break;
        }
    }

    updateUsersList() {
        this.usersList.innerHTML = '';
        
        if (this.onlineUsers.size === 0) {
            this.usersList.innerHTML = '<div style="padding: 15px; text-align: center; color: #6b7280;">No users online</div>';
            return;
        }

        this.onlineUsers.forEach(user => {
            const userItem = document.createElement('div');
            userItem.className = 'user-item';
            if (user === this.currentChat) {
                userItem.classList.add('active');
            }
            
            userItem.innerHTML = `
                <div class="status-dot"></div>
                <div>${user}</div>
            `;
            
            userItem.addEventListener('click', () => this.openChat(user));
            this.usersList.appendChild(userItem);
        });
    }

    openChat(username) {
        this.currentChat = username;
        this.chatHeader.textContent = `Chat with ${username}`;
        this.messageInput.disabled = false;
        this.sendButton.disabled = false;
        this.messageInput.focus();
        
        this.updateUsersList();
        this.renderMessages();
    }

    renderMessages() {
        this.messagesContainer.innerHTML = '';
        
        const messages = this.conversations.get(this.currentChat) || [];
        
        if (messages.length === 0) {
            this.messagesContainer.innerHTML = '<div class="empty-state">No messages yet. Start the conversation!</div>';
            return;
        }

        messages.forEach(msg => {
            const messageEl = document.createElement('div');
            messageEl.className = `message ${msg.sent ? 'sent' : 'received'}`;
            
            messageEl.innerHTML = `
                <div>
                    <div class="message-content">${this.escapeHtml(msg.message)}</div>
                    <div class="message-time">${this.formatTime(msg.timestamp)}</div>
                </div>
            `;
            
            this.messagesContainer.appendChild(messageEl);
        });

        // Scroll to bottom
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    addMessage(user, message, timestamp, sent) {
        const chatUser = sent ? user : user;
        
        if (!this.conversations.has(chatUser)) {
            this.conversations.set(chatUser, []);
        }

        this.conversations.get(chatUser).push({
            message,
            timestamp,
            sent
        });

        // Render if this is the current chat
        if (this.currentChat === chatUser) {
            this.renderMessages();
        }
    }

    sendMessage() {
        const message = this.messageInput.value.trim();
        
        if (!message || !this.currentChat) return;

        this.send({
            type: 'dm',
            to: this.currentChat,
            message: message
        });

        this.messageInput.value = '';
    }

    handleTyping() {
        if (!this.currentChat) return;

        // Send typing indicator
        this.send({
            type: 'typing',
            to: this.currentChat
        });

        // Clear previous timeout
        if (this.typingTimeout) {
            clearTimeout(this.typingTimeout);
        }
    }

    showTypingIndicator(username) {
        this.typingIndicator.textContent = `${username} is typing...`;
        
        if (this.typingTimeout) {
            clearTimeout(this.typingTimeout);
        }

        this.typingTimeout = setTimeout(() => {
            this.typingIndicator.textContent = '';
        }, 2000);
    }

    updateConnectionStatus(connected) {
        this.connectionStatus.textContent = connected ? 'Connected' : 'Disconnected';
        this.connectionStatus.className = `connection-status ${connected ? '' : 'disconnected'}`;
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the client
// Change this URL to match your WebSocket server
const WS_SERVER_URL = 'ws://localhost:8080';
const dmClient = new DMClient(WS_SERVER_URL);
