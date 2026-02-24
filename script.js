// script.js

// Конфигурация Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAj_Mh359ecv87XPV1ygtzQPWg2lsKyvzw",
    authDomain: "alexa-62aaf.firebaseapp.com",
    projectId: "alexa-62aaf",
    storageBucket: "alexa-62aaf.firebasestorage.app",
    messagingSenderId: "233934948868",
    appId: "1:233934948868:web:c503a5062e19b02a910351",
};

// Инициализация Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Настройка Firestore для работы с датами
db.settings({ 
    timestampsInSnapshots: true,
    ignoreUndefinedProperties: true 
});

class TelegramApp {
    constructor() {
        this.currentUser = null;
        this.currentUserData = null;
        this.currentChatId = null;
        this.chats = [];
        this.messages = {};
        this.unsubscribeChats = null;
        this.unsubscribeMessages = null;
        this.typingTimeout = null;
        this.isTyping = false;
        this.notificationsEnabled = false;
        this.theme = 'light';
        
        this.init();
    }
    
    init() {
        this.initElements();
        this.initEventListeners();
        this.checkAuthState();
        this.loadSettings();
        
        // Показываем экран загрузки на 1 секунду
        setTimeout(() => {
            document.getElementById('loadingScreen').classList.add('hidden');
        }, 1000);
    }
    
    initElements() {
        // Экран загрузки
        this.loadingScreen = document.getElementById('loadingScreen');
        
        // Страницы
        this.authPage = document.getElementById('authPage');
        this.appPage = document.getElementById('appPage');
        
        // Табы
        this.loginTab = document.getElementById('loginTab');
        this.registerTab = document.getElementById('registerTab');
        this.loginForm = document.getElementById('loginForm');
        this.registerForm = document.getElementById('registerForm');
        this.resetForm = document.getElementById('resetForm');
        
        // Поля входа
        this.loginEmail = document.getElementById('loginEmail');
        this.loginPassword = document.getElementById('loginPassword');
        
        // Поля регистрации
        this.registerName = document.getElementById('registerName');
        this.registerEmail = document.getElementById('registerEmail');
        this.registerPassword = document.getElementById('registerPassword');
        this.registerConfirmPassword = document.getElementById('registerConfirmPassword');
        
        // Поля сброса
        this.resetEmail = document.getElementById('resetEmail');
        
        // Кнопки
        this.loginBtn = document.getElementById('loginBtn');
        this.registerBtn = document.getElementById('registerBtn');
        this.testAuthBtn = document.getElementById('testAuthBtn');
        this.forgotPasswordBtn = document.getElementById('forgotPasswordBtn');
        this.backFromResetBtn = document.getElementById('backFromResetBtn');
        this.resetPasswordBtn = document.getElementById('resetPasswordBtn');
        
        // Профиль
        this.profileAvatar = document.getElementById('profileAvatar');
        this.profileAvatarText = document.getElementById('profileAvatarText');
        this.profileName = document.getElementById('profileName');
        this.profileEmail = document.getElementById('profileEmail');
        this.settingsBtn = document.getElementById('settingsBtn');
        
        // Меню пользователя
        this.menuButton = document.getElementById('menuButton');
        this.userMenu = document.getElementById('userMenu');
        this.menuAvatar = document.getElementById('menuAvatar');
        this.menuName = document.getElementById('menuName');
        this.menuEmail = document.getElementById('menuEmail');
        this.menuSettings = document.getElementById('menuSettings');
        this.menuTheme = document.getElementById('menuTheme');
        this.menuLogout = document.getElementById('menuLogout');
        
        // Чаты
        this.chatsList = document.getElementById('chatsList');
        this.searchInput = document.getElementById('searchInput');
        this.addChatBtn = document.getElementById('addChatBtn');
        
        // Чат область
        this.chatHeader = document.getElementById('chatHeader');
        this.chatAvatar = document.getElementById('chatAvatar');
        this.chatName = document.getElementById('chatName');
        this.chatStatus = document.getElementById('chatStatus');
        this.messagesContainer = document.getElementById('messagesContainer');
        this.messageInputWrapper = document.getElementById('messageInputWrapper');
        this.messageInput = document.getElementById('messageInput');
        this.sendMessageBtn = document.getElementById('sendMessageBtn');
        this.deleteChatBtn = document.getElementById('deleteChatBtn');
        this.emptyChat = document.getElementById('emptyChat');
        this.backToChatsBtn = document.getElementById('backToChatsBtn');
        
        // Файлы
        this.attachBtn = document.getElementById('attachBtn');
        this.fileInput = document.getElementById('fileInput');
        
        // Эмодзи
        this.emojiBtn = document.getElementById('emojiBtn');
        this.emojiPanel = document.getElementById('emojiPanel');
        
        // Модальные окна
        this.newChatModal = document.getElementById('newChatModal');
        this.settingsModal = document.getElementById('settingsModal');
        this.closeModalBtns = document.querySelectorAll('.close-modal');
        
        // Настройки
        this.settingsName = document.getElementById('settingsName');
        this.settingsBio = document.getElementById('settingsBio');
        this.settingsColor = document.getElementById('settingsColor');
        this.saveSettingsBtn = document.getElementById('saveSettingsBtn');
        
        // Новый чат
        this.newChatEmail = document.getElementById('newChatEmail');
        this.newChatName = document.getElementById('newChatName');
        this.createChatBtn = document.getElementById('createChatBtn');
        
        // Звук
        this.notificationSound = document.getElementById('notificationSound');
        
        // Toast
        this.toast = document.getElementById('toast');
    }
    
    initEventListeners() {
        // Табы
        this.loginTab.addEventListener('click', () => {
            this.loginTab.classList.add('active');
            this.registerTab.classList.remove('active');
            this.loginForm.classList.add('active');
            this.registerForm.classList.remove('active');
        });
        
        this.registerTab.addEventListener('click', () => {
            this.registerTab.classList.add('active');
            this.loginTab.classList.remove('active');
            this.registerForm.classList.add('active');
            this.loginForm.classList.remove('active');
        });
        
        // Вход
        this.loginBtn.addEventListener('click', () => this.login());
        this.loginPassword.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.login();
        });
        
        // Регистрация
        this.registerBtn.addEventListener('click', () => this.register());
        
        // Тестовый вход
        this.testAuthBtn.addEventListener('click', () => this.testAuth());
        
        // Забыли пароль
        this.forgotPasswordBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.loginForm.classList.remove('active');
            this.resetForm.classList.add('active');
        });
        
        this.backFromResetBtn.addEventListener('click', () => {
            this.resetForm.classList.remove('active');
            this.loginForm.classList.add('active');
        });
        
        this.resetPasswordBtn.addEventListener('click', () => this.resetPassword());
        
        // Меню пользователя
        this.menuButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.userMenu.classList.toggle('show');
        });
        
        document.addEventListener('click', (e) => {
            if (!this.userMenu.contains(e.target) && !this.menuButton.contains(e.target)) {
                this.userMenu.classList.remove('show');
            }
        });
        
        this.menuLogout.addEventListener('click', () => this.logout());
        this.menuTheme.addEventListener('click', () => this.toggleTheme());
        this.menuSettings.addEventListener('click', () => {
            this.userMenu.classList.remove('show');
            this.openSettings();
        });
        
        // Настройки
        this.settingsBtn.addEventListener('click', () => this.openSettings());
        
        // Сохранение настроек
        this.saveSettingsBtn.addEventListener('click', () => this.saveSettings());
        
        // Новый чат
        this.addChatBtn.addEventListener('click', () => this.showModal('newChatModal'));
        this.createChatBtn.addEventListener('click', () => this.createNewChat());
        
        // Поиск
        this.searchInput.addEventListener('input', () => this.filterChats());
        
        // Отправка сообщения
        this.sendMessageBtn.addEventListener('click', () => this.sendMessage());
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        // Индикатор печатания
        this.messageInput.addEventListener('input', () => {
            this.handleTyping();
        });
        
        // Удаление чата
        this.deleteChatBtn.addEventListener('click', () => this.deleteCurrentChat());
        
        // Назад к чатам (мобильная версия)
        this.backToChatsBtn.addEventListener('click', () => {
            document.querySelector('.sidebar').classList.remove('hidden');
        });
        
        // Файлы
        this.attachBtn.addEventListener('click', () => {
            this.fileInput.click();
        });
        
        this.fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.uploadFile(e.target.files[0]);
            }
        });
        
        // Эмодзи
        this.emojiBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleEmojiPanel();
        });
        
        document.addEventListener('click', (e) => {
            if (!this.emojiPanel.contains(e.target) && !this.emojiBtn.contains(e.target)) {
                this.emojiPanel.classList.remove('show');
            }
        });
        
        document.addEventListener('emoji-click', (event) => {
            const emoji = event.detail.unicode;
            this.insertEmoji(emoji);
        });
        
        // Закрытие модальных окон
        this.closeModalBtns.forEach(btn => {
            btn.addEventListener('click', () => this.closeAllModals());
        });
        
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeAllModals();
            }
        });
        
        // Авто-высота textarea
        this.messageInput.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
        });
    }
    
    loadSettings() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            this.theme = savedTheme;
            document.body.classList.toggle('dark-theme', savedTheme === 'dark');
            this.menuTheme.innerHTML = savedTheme === 'dark' 
                ? '<i class="fas fa-sun"></i><span>Светлая тема</span>'
                : '<i class="fas fa-moon"></i><span>Темная тема</span>';
        }
        
        const notifications = localStorage.getItem('notifications');
        if (notifications !== null) {
            this.notificationsEnabled = notifications === 'true';
        }
    }
    
    toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        document.body.classList.toggle('dark-theme', this.theme === 'dark');
        localStorage.setItem('theme', this.theme);
        
        this.menuTheme.innerHTML = this.theme === 'dark'
            ? '<i class="fas fa-sun"></i><span>Светлая тема</span>'
            : '<i class="fas fa-moon"></i><span>Темная тема</span>';
    }
    
    toggleEmojiPanel() {
        this.emojiPanel.classList.toggle('show');
    }
    
    insertEmoji(emoji) {
        const textarea = this.messageInput;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        
        textarea.value = text.substring(0, start) + emoji + text.substring(end);
        
        textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
        textarea.focus();
        this.emojiPanel.classList.remove('show');
    }
    
    checkAuthState() {
        auth.onAuthStateChanged((user) => {
            if (user) {
                this.currentUser = user;
                this.loadUserProfile();
                this.showApp();
                this.subscribeToChats();
                this.setUserOnline();
            } else {
                this.showAuth();
                this.cleanupSubscriptions();
            }
        });
    }
    
    cleanupSubscriptions() {
        if (this.unsubscribeChats) {
            this.unsubscribeChats();
            this.unsubscribeChats = null;
        }
        if (this.unsubscribeMessages) {
            this.unsubscribeMessages();
            this.unsubscribeMessages = null;
        }
    }
    
    async setUserOnline() {
        if (!this.currentUser) return;
        
        const userRef = db.collection('presence').doc(this.currentUser.uid);
        
        await userRef.set({
            online: true,
            lastSeen: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        window.addEventListener('beforeunload', () => {
            userRef.update({
                online: false,
                lastSeen: firebase.firestore.FieldValue.serverTimestamp()
            });
        });
    }
    
    async loadUserProfile() {
        try {
            const userDoc = await db.collection('users').doc(this.currentUser.uid).get();
            
            if (userDoc.exists) {
                const userData = userDoc.data();
                
                if (userData.displayName && userData.displayName !== this.currentUser.displayName) {
                    await this.currentUser.updateProfile({
                        displayName: userData.displayName
                    });
                }
                
                this.currentUserData = {
                    displayName: userData.displayName || this.currentUser.email.split('@')[0],
                    bio: userData.bio || '',
                    avatarColor: userData.avatarColor || '#2AABEE',
                    email: this.currentUser.email
                };
            } else {
                const displayName = this.currentUser.email.split('@')[0];
                
                await db.collection('users').doc(this.currentUser.uid).set({
                    email: this.currentUser.email,
                    displayName: displayName,
                    bio: '',
                    avatarColor: '#2AABEE',
                    createdAt: new Date().toISOString()
                });
                
                await this.currentUser.updateProfile({
                    displayName: displayName
                });
                
                this.currentUserData = {
                    displayName: displayName,
                    bio: '',
                    avatarColor: '#2AABEE',
                    email: this.currentUser.email
                };
            }
            
            this.updateUserDisplay();
        } catch (error) {
            console.error('Error loading profile:', error);
        }
    }
    
    updateUserDisplay() {
        if (!this.currentUserData) return;
        
        const displayName = this.currentUserData.displayName;
        const avatarText = displayName.charAt(0).toUpperCase();
        const color = this.currentUserData.avatarColor;
        
        this.profileName.textContent = displayName;
        this.profileEmail.textContent = this.currentUserData.email;
        this.profileAvatar.style.background = color;
        this.profileAvatarText.textContent = avatarText;
        
        this.menuName.textContent = displayName;
        this.menuEmail.textContent = this.currentUserData.email;
        this.menuAvatar.style.background = color;
        this.menuAvatar.textContent = avatarText;
    }
    
    subscribeToChats() {
        if (this.unsubscribeChats) {
            this.unsubscribeChats();
        }
        
        this.unsubscribeChats = db.collection('chats')
            .where('participants', 'array-contains', this.currentUser.uid)
            .onSnapshot((snapshot) => {
                this.chats = [];
                snapshot.forEach(doc => {
                    const chat = {
                        id: doc.id,
                        ...doc.data()
                    };
                    this.chats.push(chat);
                });
                
                this.chats.sort((a, b) => {
                    const timeA = a.lastMessageTime ? a.lastMessageTime.toDate() : new Date(0);
                    const timeB = b.lastMessageTime ? b.lastMessageTime.toDate() : new Date(0);
                    return timeB - timeA;
                });
                
                this.renderChats();
                
                if (this.currentChatId) {
                    const currentChat = this.chats.find(c => c.id === this.currentChatId);
                    if (currentChat) {
                        this.updateChatHeader(currentChat);
                    } else {
                        this.currentChatId = null;
                        this.chatHeader.style.display = 'none';
                        this.messageInputWrapper.style.display = 'none';
                        this.emptyChat.style.display = 'flex';
                    }
                }
            }, (error) => {
                console.error('Error subscribing to chats:', error);
                this.showToast('Ошибка загрузки чатов', 'error');
            });
    }
    
    subscribeToMessages(chatId) {
        if (this.unsubscribeMessages) {
            this.unsubscribeMessages();
        }
        
        this.unsubscribeMessages = db.collection('messages')
            .where('chatId', '==', chatId)
            .orderBy('timestamp')
            .onSnapshot((snapshot) => {
                const hadMessages = this.messages[chatId] && this.messages[chatId].length > 0;
                
                this.messages[chatId] = [];
                snapshot.forEach(doc => {
                    this.messages[chatId].push({
                        id: doc.id,
                        ...doc.data()
                    });
                });
                
                this.renderMessages(this.messages[chatId]);
                this.markMessagesAsRead(chatId);
                
                // Звук уведомления для новых сообщений
                if (hadMessages && this.notificationsEnabled && document.hidden) {
                    this.playNotificationSound();
                }
            }, (error) => {
                console.error('Error subscribing to messages:', error);
                this.showToast('Ошибка загрузки сообщений', 'error');
            });
        
        // Подписка на статус печатания
        db.collection('chats').doc(chatId).collection('typing')
            .doc(this.currentUser.uid)
            .onSnapshot((doc) => {
                if (doc.exists && doc.data().isTyping) {
                    this.showTypingIndicator();
                } else {
                    this.hideTypingIndicator();
                }
            });
    }
    
    async markMessagesAsRead(chatId) {
        if (!this.currentUser) return;
        
        const batch = db.batch();
        const messagesRef = db.collection('messages')
            .where('chatId', '==', chatId)
            .where('senderId', '!=', this.currentUser.uid)
            .where('read', '==', false);
        
        const snapshot = await messagesRef.get();
        snapshot.forEach(doc => {
            batch.update(doc.ref, { read: true });
        });
        
        await batch.commit();
    }
    
    async handleTyping() {
        if (!this.currentChatId || !this.currentUser) return;
        
        const typingRef = db.collection('chats')
            .doc(this.currentChatId)
            .collection('typing')
            .doc(this.currentUser.uid);
        
        if (!this.isTyping) {
            this.isTyping = true;
            await typingRef.set({ isTyping: true });
        }
        
        clearTimeout(this.typingTimeout);
        this.typingTimeout = setTimeout(async () => {
            this.isTyping = false;
            await typingRef.delete();
        }, 2000);
    }
    
    showTypingIndicator() {
        let indicator = document.querySelector('.typing-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.className = 'typing-indicator';
            indicator.innerHTML = '<span></span><span></span><span></span>';
            this.messagesContainer.appendChild(indicator);
        }
        this.scrollToBottom();
    }
    
    hideTypingIndicator() {
        const indicator = document.querySelector('.typing-indicator');
        if (indicator) {
            indicator.remove();
        }
    }
    
    playNotificationSound() {
        if (!this.notificationSound) {
            this.notificationSound = new Audio('https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3');
        }
        this.notificationSound.play().catch(() => {});
    }
    
    async login() {
        const email = this.loginEmail.value.trim();
        const password = this.loginPassword.value;
        
        if (!email || !password) {
            this.showToast('Заполните все поля', 'error');
            return;
        }
        
        try {
            await auth.signInWithEmailAndPassword(email, password);
            this.showToast('Добро пожаловать!', 'success');
        } catch (error) {
            console.error('Login error:', error);
            let message = 'Ошибка входа';
            if (error.code === 'auth/user-not-found') {
                message = 'Пользователь не найден';
            } else if (error.code === 'auth/wrong-password') {
                message = 'Неверный пароль';
            } else if (error.code === 'auth/invalid-email') {
                message = 'Неверный формат email';
            }
            this.showToast(message, 'error');
        }
    }
    
    async register() {
        const name = this.registerName.value.trim();
        const email = this.registerEmail.value.trim();
        const password = this.registerPassword.value;
        const confirmPassword = this.registerConfirmPassword.value;
        
        if (!name || !email || !password || !confirmPassword) {
            this.showToast('Заполните все поля', 'error');
            return;
        }
        
        if (password !== confirmPassword) {
            this.showToast('Пароли не совпадают', 'error');
            return;
        }
        
        if (password.length < 6) {
            this.showToast('Пароль должен быть не менее 6 символов', 'error');
            return;
        }
        
        try {
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            
            await userCredential.user.updateProfile({
                displayName: name
            });
            
            await db.collection('users').doc(userCredential.user.uid).set({
                email: email,
                displayName: name,
                bio: '',
                avatarColor: this.getRandomColor(name),
                createdAt: new Date().toISOString()
            });
            
            this.showToast('Регистрация успешна!', 'success');
        } catch (error) {
            console.error('Registration error:', error);
            let message = 'Ошибка регистрации';
            if (error.code === 'auth/email-already-in-use') {
                message = 'Email уже используется';
            } else if (error.code === 'auth/invalid-email') {
                message = 'Неверный формат email';
            }
            this.showToast(message, 'error');
        }
    }
    
    async resetPassword() {
        const email = this.resetEmail.value.trim();
        
        if (!email) {
            this.showToast('Введите email', 'error');
            return;
        }
        
        try {
            await auth.sendPasswordResetEmail(email);
            this.showToast('Инструкция отправлена на email', 'success');
            setTimeout(() => {
                this.resetForm.classList.remove('active');
                this.loginForm.classList.add('active');
            }, 2000);
        } catch (error) {
            console.error('Reset password error:', error);
            this.showToast('Ошибка отправки', 'error');
        }
    }
    
    async testAuth() {
        try {
            const testEmail = `test_${Date.now()}@telegram.com`;
            const testPassword = '123456';
            const testName = 'Тестовый пользователь';
            
            const userCredential = await auth.createUserWithEmailAndPassword(testEmail, testPassword);
            
            await userCredential.user.updateProfile({
                displayName: testName
            });
            
            await db.collection('users').doc(userCredential.user.uid).set({
                email: testEmail,
                displayName: testName,
                bio: 'Тестовый аккаунт',
                avatarColor: this.getRandomColor(testName),
                createdAt: new Date().toISOString()
            });
            
            this.showToast('Тестовый аккаунт создан!', 'success');
        } catch (error) {
            console.error('Test auth error:', error);
            this.showToast('Ошибка тестового входа', 'error');
        }
    }
    
    async logout() {
        try {
            if (this.currentUser) {
                await db.collection('presence').doc(this.currentUser.uid).update({
                    online: false,
                    lastSeen: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
            
            await auth.signOut();
            this.currentUser = null;
            this.currentUserData = null;
            this.chats = [];
            this.currentChatId = null;
            this.cleanupSubscriptions();
            this.showAuth();
            this.showToast('Вы вышли из аккаунта', 'info');
        } catch (error) {
            console.error('Logout error:', error);
            this.showToast('Ошибка при выходе', 'error');
        }
    }
    
    showApp() {
        this.authPage.classList.add('hidden');
        this.appPage.classList.remove('hidden');
    }
    
    showAuth() {
        this.authPage.classList.remove('hidden');
        this.appPage.classList.add('hidden');
        
        this.loginEmail.value = '';
        this.loginPassword.value = '';
        this.registerName.value = '';
        this.registerEmail.value = '';
        this.registerPassword.value = '';
        this.registerConfirmPassword.value = '';
    }
    
    openSettings() {
        if (this.currentUserData) {
            this.settingsName.value = this.currentUserData.displayName || '';
            this.settingsBio.value = this.currentUserData.bio || '';
            this.settingsColor.value = this.currentUserData.avatarColor || '#2AABEE';
            this.showModal('settingsModal');
        }
    }
    
    async saveSettings() {
        const newName = this.settingsName.value.trim();
        const newBio = this.settingsBio.value.trim();
        const newColor = this.settingsColor.value;
        
        if (!newName) {
            this.showToast('Имя не может быть пустым', 'error');
            return;
        }
        
        try {
            if (this.currentUser && this.currentUserData) {
                await this.currentUser.updateProfile({
                    displayName: newName
                });
                
                await db.collection('users').doc(this.currentUser.uid).update({
                    displayName: newName,
                    bio: newBio,
                    avatarColor: newColor
                });
                
                this.currentUserData.displayName = newName;
                this.currentUserData.bio = newBio;
                this.currentUserData.avatarColor = newColor;
                
                this.updateUserDisplay();
                this.closeAllModals();
                this.showToast('Настройки сохранены', 'success');
            }
        } catch (error) {
            console.error('Save settings error:', error);
            this.showToast('Ошибка при сохранении', 'error');
        }
    }
    
    renderChats() {
        const filter = this.searchInput.value.toLowerCase();
        
        this.chatsList.innerHTML = '';
        
        const filteredChats = this.chats.filter(chat => 
            chat.name.toLowerCase().includes(filter)
        );
        
        if (filteredChats.length === 0) {
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'empty-state';
            emptyDiv.innerHTML = '<p>Нет чатов</p>';
            this.chatsList.appendChild(emptyDiv);
            return;
        }
        
        filteredChats.forEach(chat => {
            const chatElement = this.createChatElement(chat);
            this.chatsList.appendChild(chatElement);
        });
    }
    
    createChatElement(chat) {
        const div = document.createElement('div');
        div.className = `chat-item ${this.currentChatId === chat.id ? 'active' : ''}`;
        if (chat.unreadCount > 0 && chat.lastMessageSender !== this.currentUser?.uid) {
            div.classList.add('unread');
        }
        div.dataset.chatId = chat.id;
        
        const lastMessageTime = chat.lastMessageTime ? chat.lastMessageTime.toDate() : new Date();
        const timeString = this.formatTime(lastMessageTime);
        
        const avatarText = chat.name.charAt(0).toUpperCase();
        const avatarColor = chat.avatarColor || this.getRandomColor(chat.name);
        
        div.innerHTML = `
            <div class="chat-item-avatar" style="background: ${avatarColor}">${avatarText}</div>
            <div class="chat-item-info">
                <div class="chat-item-header">
                    <span class="chat-item-name">${this.escapeHtml(chat.name)}</span>
                    <span class="chat-item-time">${timeString}</span>
                </div>
                <div class="chat-item-last-message">
                    ${chat.lastMessage ? this.escapeHtml(chat.lastMessage.substring(0, 30)) + (chat.lastMessage.length > 30 ? '...' : '') : 'Нет сообщений'}
                </div>
            </div>
        `;
        
        div.addEventListener('click', () => this.selectChat(chat.id));
        
        return div;
    }
    
    formatTime(date) {
        const now = new Date();
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (date.toDateString() === now.toDateString()) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'вчера';
        } else {
            return date.toLocaleDateString();
        }
    }
    
    getRandomColor(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        const hue = Math.abs(hash % 360);
        return `hsl(${hue}, 70%, 50%)`;
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    async selectChat(chatId) {
        this.currentChatId = chatId;
        const chat = this.chats.find(c => c.id === chatId);
        
        if (chat) {
            if (window.innerWidth <= 768) {
                document.querySelector('.sidebar').classList.add('hidden');
            }
            
            this.updateChatHeader(chat);
            this.subscribeToMessages(chatId);
        }
    }
    
    updateChatHeader(chat) {
        this.chatHeader.style.display = 'flex';
        this.messageInputWrapper.style.display = 'flex';
        this.emptyChat.style.display = 'none';
        
        const avatarText = chat.name.charAt(0).toUpperCase();
        const avatarColor = chat.avatarColor || this.getRandomColor(chat.name);
        
        this.chatAvatar.textContent = avatarText;
        this.chatAvatar.style.backgroundColor = avatarColor;
        this.chatName.textContent = chat.name;
        
        this.updateChatStatus(chat);
    }
    
    async updateChatStatus(chat) {
        const otherParticipantId = chat.participants.find(id => id !== this.currentUser.uid);
        
        if (otherParticipantId) {
            const presenceRef = db.collection('presence').doc(otherParticipantId);
            presenceRef.onSnapshot((doc) => {
                if (doc.exists) {
                    const data = doc.data();
                    if (data.online) {
                        this.chatStatus.textContent = 'в сети';
                        this.chatStatus.style.color = '#2AABEE';
                    } else if (data.lastSeen) {
                        const lastSeen = data.lastSeen.toDate();
                        const now = new Date();
                        const diffMinutes = Math.floor((now - lastSeen) / 60000);
                        
                        if (diffMinutes < 1) {
                            this.chatStatus.textContent = 'был(а) только что';
                        } else if (diffMinutes < 60) {
                            this.chatStatus.textContent = `был(а) ${diffMinutes} мин назад`;
                        } else {
                            this.chatStatus.textContent = `был(а) в ${lastSeen.toLocaleTimeString()}`;
                        }
                        this.chatStatus.style.color = '#707579';
                    }
                }
            });
        }
    }
    
    renderMessages(messages) {
        this.messagesContainer.innerHTML = '';
        
        if (!messages || messages.length === 0) {
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'empty-chat';
            emptyDiv.innerHTML = '<p>Нет сообщений</p>';
            this.messagesContainer.appendChild(emptyDiv);
            return;
        }
        
        let lastDate = null;
        
        messages.forEach(message => {
            if (!message.timestamp) return;
            
            const messageDate = message.timestamp.toDate().toDateString();
            
            if (messageDate !== lastDate) {
                const dateDiv = document.createElement('div');
                dateDiv.className = 'message-date';
                
                const today = new Date().toDateString();
                const yesterday = new Date(Date.now() - 86400000).toDateString();
                
                let dateText;
                if (messageDate === today) {
                    dateText = 'Сегодня';
                } else if (messageDate === yesterday) {
                    dateText = 'Вчера';
                } else {
                    dateText = message.timestamp.toDate().toLocaleDateString('ru-RU', {
                        day: 'numeric',
                        month: 'long'
                    });
                }
                
                dateDiv.innerHTML = `<span>${dateText}</span>`;
                this.messagesContainer.appendChild(dateDiv);
                lastDate = messageDate;
            }
            
            const messageElement = this.createMessageElement(message);
            this.messagesContainer.appendChild(messageElement);
        });
        
        this.scrollToBottom();
    }
    
    createMessageElement(message) {
    const div = document.createElement('div');
    const isOwnMessage = message.senderId === this.currentUser?.uid;
    div.className = `message ${isOwnMessage ? 'sent' : 'received'}`;
    
    let time = '';
    if (message.timestamp) {
        time = message.timestamp.toDate().toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }
    
    let content = '';
    if (message.type === 'image') {
        content = `
            <div class="message-content image" onclick="window.open('${message.fileData}', '_blank')">
                <img src="${message.fileData}" alt="Image" style="max-width: 100%; max-height: 300px;">
            </div>
        `;
    } else if (message.type === 'file') {
        content = `
            <div class="message-content file" onclick="window.open('${message.fileData}')">
                <i class="fas fa-file"></i>
                <div class="file-info">
                    <div class="file-name">${message.fileName || 'Файл'}</div>
                    <div class="file-size">${this.formatFileSize(message.fileSize)}</div>
                </div>
            </div>
        `;
    } else {
        content = `<div class="message-content">${this.escapeHtml(message.text)}</div>`;
    }
    
    let statusIcon = '';
    if (isOwnMessage) {
        if (message.read) {
            statusIcon = '<i class="fas fa-check-double message-status read"></i>';
        } else {
            statusIcon = '<i class="fas fa-check message-status"></i>';
        }
    }
    
    div.innerHTML = `
        ${content}
        <div class="message-info">
            <span>${time}</span>
            ${statusIcon}
        </div>
    `;
    
    return div;
}
    
    formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }
    
    async sendMessage() {
        const text = this.messageInput.value.trim();
        if (!text || !this.currentChatId) return;
        
        try {
            const message = {
                text: text,
                type: 'text',
                senderId: this.currentUser.uid,
                senderName: this.currentUserData.displayName,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                chatId: this.currentChatId,
                read: false
            };
            
            await db.collection('messages').add(message);
            
            await db.collection('chats').doc(this.currentChatId).update({
                lastMessage: text,
                lastMessageTime: firebase.firestore.FieldValue.serverTimestamp(),
                lastMessageSender: this.currentUser.uid
            });
            
            this.messageInput.value = '';
            this.messageInput.style.height = 'auto';
        } catch (error) {
            console.error('Error sending message:', error);
            this.showToast('Ошибка при отправке', 'error');
        }
    }
    
    async uploadFile(file) {
    if (!this.currentChatId) {
        this.showToast('Выберите чат', 'error');
        return;
    }
    
    try {
        this.showToast('Загрузка...', 'info');
        
        // Читаем файл как Data URL (Base64)
        const reader = new FileReader();
        
        reader.onload = async (e) => {
            const fileData = e.target.result; // Это Base64 строка
            
            // Определяем тип сообщения
            const isImage = file.type.startsWith('image/');
            
            // Создаем сообщение прямо в Firestore (без Storage)
            const message = {
                type: isImage ? 'image' : 'file',
                text: isImage ? '📷 Фото' : '📎 Файл',
                fileData: fileData, // База64 данные
                fileName: file.name,
                fileSize: file.size,
                fileType: file.type,
                senderId: this.currentUser.uid,
                senderName: this.currentUserData.displayName,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                chatId: this.currentChatId,
                read: false
            };
            
            await db.collection('messages').add(message);
            
            // Обновляем последнее сообщение в чате
            await db.collection('chats').doc(this.currentChatId).update({
                lastMessage: message.text,
                lastMessageTime: firebase.firestore.FieldValue.serverTimestamp(),
                lastMessageSender: this.currentUser.uid
            });
            
            this.showToast('Файл загружен', 'success');
        };
        
        reader.readAsDataURL(file);
        
    } catch (error) {
        console.error('Upload error:', error);
        this.showToast('Ошибка загрузки: ' + error.message, 'error');
    }
    
    this.fileInput.value = '';
}
    
    async deleteCurrentChat() {
        if (!this.currentChatId) return;
        
        if (confirm('Удалить чат?')) {
            try {
                const messagesRef = db.collection('messages')
                    .where('chatId', '==', this.currentChatId);
                const snapshot = await messagesRef.get();
                
                const batch = db.batch();
                snapshot.forEach(doc => {
                    batch.delete(doc.ref);
                });
                
                batch.delete(db.collection('chats').doc(this.currentChatId));
                
                await batch.commit();
                
                this.currentChatId = null;
                this.chatHeader.style.display = 'none';
                this.messageInputWrapper.style.display = 'none';
                this.emptyChat.style.display = 'flex';
                
                this.showToast('Чат удален', 'success');
            } catch (error) {
                console.error('Error deleting chat:', error);
                this.showToast('Ошибка при удалении', 'error');
            }
        }
    }
    
    async createNewChat() {
        const email = this.newChatEmail.value.trim();
        const name = this.newChatName.value.trim();
        
        if (!email || !name) {
            this.showToast('Заполните все поля', 'error');
            return;
        }
        
        try {
            const usersRef = db.collection('users');
            const snapshot = await usersRef.where('email', '==', email).get();
            
            if (snapshot.empty) {
                this.showToast('Пользователь не найден', 'error');
                return;
            }
            
            const otherUser = snapshot.docs[0];
            
            const chatsRef = db.collection('chats')
                .where('participants', 'array-contains', this.currentUser.uid);
            const existingChats = await chatsRef.get();
            
            let chatExists = false;
            existingChats.forEach(doc => {
                const chat = doc.data();
                if (chat.participants.includes(otherUser.id) && chat.type === 'private') {
                    chatExists = true;
                    this.selectChat(doc.id);
                }
            });
            
            if (chatExists) {
                this.showToast('Чат уже существует', 'info');
                this.closeAllModals();
                return;
            }
            
            const newChat = {
                name: name,
                participants: [this.currentUser.uid, otherUser.id],
                type: 'private',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastMessageTime: firebase.firestore.FieldValue.serverTimestamp(),
                lastMessage: 'Чат создан',
                avatarColor: this.getRandomColor(name),
                unreadCount: 0
            };
            
            const chatRef = await db.collection('chats').add(newChat);
            
            this.closeAllModals();
            this.newChatEmail.value = '';
            this.newChatName.value = '';
            
            this.showToast('Чат создан!', 'success');
            this.selectChat(chatRef.id);
        } catch (error) {
            console.error('Error creating chat:', error);
            this.showToast('Ошибка при создании чата', 'error');
        }
    }
    
    filterChats() {
        this.renderChats();
    }
    
    showModal(modalId) {
        document.getElementById(modalId).classList.add('show');
    }
    
    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('show');
        });
    }
    
    scrollToBottom() {
        setTimeout(() => {
            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        }, 100);
    }
    
    showToast(message, type = 'info') {
        this.toast.textContent = message;
        this.toast.className = `toast show ${type}`;
        
        setTimeout(() => {
            this.toast.classList.remove('show');
        }, 3000);
    }
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    window.app = new TelegramApp();
});