// script.js - ПОЛНАЯ ВЕРСИЯ с группами, каналами, username, локальными именами, профилями
// + НОВЫЕ ФУНКЦИИ: реакции, закрепленные, ответы, черновики
// + ЗАГРУЗКА АВАТАРОВ И ИЗОБРАЖЕНИЙ ЧЕРЕЗ IMGBB (без Firebase Storage)
// + МОБИЛЬНАЯ ОПТИМИЗАЦИЯ: ленивая загрузка изображений, плавный скролл после отправки

const firebaseConfig = {
    apiKey: "AIzaSyAj_Mh359ecv87XPV1ygtzQPWg2lsKyvzw",
    authDomain: "alexa-62aaf.firebaseapp.com",
    projectId: "alexa-62aaf",
    storageBucket: "alexa-62aaf.firebasestorage.app",
    messagingSenderId: "233934948868",
    appId: "1:233934948868:web:c503a5062e19b02a910351",
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

db.settings({ ignoreUndefinedProperties: true }, { merge: true });

class AlexaApp {
    constructor() {
        this.currentUser = null;
        this.currentUserData = null;
        this.currentChatId = null;
        this.currentOtherUserId = null;
        this.chats = [];
        this.messages = {};
        this.unsubscribeChats = null;
        this.unsubscribeMessages = null;
        this.typingTimeout = null;
        this.isTyping = false;
        this.notificationsEnabled = false;
        this.theme = 'light';
        
        this.userPresenceListeners = {};
        this.currentStatusListener = null;
        
        this.archivedChats = new Set();
        this.showingArchive = false;
        this.showingFavorites = false;
        this.favorites = [];
        
        this.uploadTasks = new Map();
        this.compressionEnabled = true;
        this.maxFileSize = 100 * 1024 * 1024;
        
        this.replyToMessage = null;
        this.newGroupMembers = [];
        
        this.init();
    }
    
    init() {
        this.initElements();
        this.initEventListeners();
        this.initNewEventListeners();
        this.checkAuthState();
        this.loadSettings();
        
        setTimeout(() => {
            document.getElementById('loadingScreen').classList.add('hidden');
        }, 1000);
    }
    
    initElements() {
        this.loadingScreen = document.getElementById('loadingScreen');
        this.authPage = document.getElementById('authPage');
        this.appPage = document.getElementById('appPage');
        
        this.loginTab = document.getElementById('loginTab');
        this.registerTab = document.getElementById('registerTab');
        this.loginForm = document.getElementById('loginForm');
        this.registerForm = document.getElementById('registerForm');
        this.resetForm = document.getElementById('resetForm');
        
        this.loginEmail = document.getElementById('loginEmail');
        this.loginPassword = document.getElementById('loginPassword');
        
        this.registerName = document.getElementById('registerName');
        this.registerEmail = document.getElementById('registerEmail');
        this.registerPassword = document.getElementById('registerPassword');
        this.registerConfirmPassword = document.getElementById('registerConfirmPassword');
        
        this.resetEmail = document.getElementById('resetEmail');
        
        this.loginBtn = document.getElementById('loginBtn');
        this.registerBtn = document.getElementById('registerBtn');
        this.testAuthBtn = document.getElementById('testAuthBtn');
        this.forgotPasswordBtn = document.getElementById('forgotPasswordBtn');
        this.backFromResetBtn = document.getElementById('backFromResetBtn');
        this.resetPasswordBtn = document.getElementById('resetPasswordBtn');
        
        this.profileAvatar = document.getElementById('profileAvatar');
        this.profileAvatarText = document.getElementById('profileAvatarText');
        this.profileName = document.getElementById('profileName');
        this.profileEmail = document.getElementById('profileEmail');
        this.settingsBtn = document.getElementById('settingsBtn');
        
        this.menuButton = document.getElementById('menuButton');
        this.userMenu = document.getElementById('userMenu');
        this.menuAvatar = document.getElementById('menuAvatar');
        this.menuName = document.getElementById('menuName');
        this.menuEmail = document.getElementById('menuEmail');
        this.menuSettings = document.getElementById('menuSettings');
        this.menuTheme = document.getElementById('menuTheme');
        this.menuLogout = document.getElementById('menuLogout');
        
        this.menuCreateGroup = document.getElementById('menuCreateGroup');
        this.menuCreateChannel = document.getElementById('menuCreateChannel');
        this.menuArchive = document.getElementById('menuArchive');
        this.menuFavorites = document.getElementById('menuFavorites');
        
        this.chatsList = document.getElementById('chatsList');
        this.searchInput = document.getElementById('searchInput');
        this.addChatBtn = document.getElementById('addChatBtn');
        
        this.chatHeader = document.getElementById('chatHeader');
        this.chatAvatar = document.getElementById('chatAvatar');
        this.chatName = document.getElementById('chatName');
        this.chatStatus = document.getElementById('chatStatus');
        this.pinnedMessage = document.getElementById('pinnedMessage');
        this.pinnedMessageText = document.getElementById('pinnedMessageText');
        this.messagesContainer = document.getElementById('messagesContainer');
        this.messageInputWrapper = document.getElementById('messageInputWrapper');
        this.messageInput = document.getElementById('messageInput');
        this.sendMessageBtn = document.getElementById('sendMessageBtn');
        this.deleteChatBtn = document.getElementById('deleteChatBtn');
        this.emptyChat = document.getElementById('emptyChat');
        this.backToChatsBtn = document.getElementById('backToChatsBtn');
        
        this.manageChannelBtn = document.getElementById('manageChannelBtn');
        this.manageGroupBtn = document.getElementById('manageGroupBtn');
        this.subscribeChannelBtn = document.getElementById('subscribeChannelBtn');
        this.unsubscribeChannelBtn = document.getElementById('unsubscribeChannelBtn');
        this.archiveChatBtn = document.getElementById('archiveChatBtn');
        
        this.attachBtn = document.getElementById('attachBtn');
        this.fileInput = document.getElementById('fileInput');
        
        this.emojiBtn = document.getElementById('emojiBtn');
        this.emojiPanel = document.getElementById('emojiPanel');
        
        this.newChatModal = document.getElementById('newChatModal');
        this.settingsModal = document.getElementById('settingsModal');
        this.favoritesModal = document.getElementById('favoritesModal');
        this.editContactModal = document.getElementById('editContactModal');
        this.createChannelModal = document.getElementById('createChannelModal');
        this.manageChannelModal = document.getElementById('manageChannelModal');
        this.createGroupModal = document.getElementById('createGroupModal');
        this.manageGroupModal = document.getElementById('manageGroupModal');
        this.profileModal = document.getElementById('profileModal');
        
        this.closeModalBtns = document.querySelectorAll('.close-modal');
        
        this.favoritesList = document.getElementById('favoritesList');
        
        this.editContactName = document.getElementById('editContactName');
        this.saveContactNameBtn = document.getElementById('saveContactNameBtn');
        
        this.settingsName = document.getElementById('settingsName');
        this.settingsUsername = document.getElementById('settingsUsername');
        this.settingsBio = document.getElementById('settingsBio');
        this.settingsColor = document.getElementById('settingsColor');
        this.settingsAvatar = document.getElementById('settingsAvatar');
        this.settingsCompression = document.getElementById('settingsCompression');
        this.saveSettingsBtn = document.getElementById('saveSettingsBtn');
        
        this.newChatEmail = document.getElementById('newChatEmail');
        this.newChatName = document.getElementById('newChatName');
        this.createChatBtn = document.getElementById('createChatBtn');
        
        this.channelName = document.getElementById('channelName');
        this.channelDescription = document.getElementById('channelDescription');
        this.channelAvatar = document.getElementById('channelAvatar');
        this.createChannelBtn = document.getElementById('createChannelBtn');
        
        this.manageChannelName = document.getElementById('manageChannelName');
        this.manageChannelDescription = document.getElementById('manageChannelDescription');
        this.manageChannelAvatar = document.getElementById('manageChannelAvatar');
        this.addSubscriberInput = document.getElementById('addSubscriberInput');
        this.addSubscriberBtn = document.getElementById('addSubscriberBtn');
        this.subscribersList = document.getElementById('subscribersList');
        this.subscriberCount = document.getElementById('subscriberCount');
        this.saveChannelSettingsBtn = document.getElementById('saveChannelSettingsBtn');
        this.deleteChannelBtn = document.getElementById('deleteChannelBtn');
        
        this.groupName = document.getElementById('groupName');
        this.groupDescription = document.getElementById('groupDescription');
        this.groupAvatar = document.getElementById('groupAvatar');
        this.addMemberInput = document.getElementById('addMemberInput');
        this.addMemberBtn = document.getElementById('addMemberBtn');
        this.membersPreview = document.getElementById('membersPreview');
        this.createGroupBtn = document.getElementById('createGroupBtn');
        
        this.manageGroupName = document.getElementById('manageGroupName');
        this.manageGroupDescription = document.getElementById('manageGroupDescription');
        this.manageGroupAvatar = document.getElementById('manageGroupAvatar');
        this.membersList = document.getElementById('membersList');
        this.memberCount = document.getElementById('memberCount');
        this.addGroupMemberInput = document.getElementById('addGroupMemberInput');
        this.addGroupMemberBtn = document.getElementById('addGroupMemberBtn');
        this.saveGroupSettingsBtn = document.getElementById('saveGroupSettingsBtn');
        this.deleteGroupBtn = document.getElementById('deleteGroupBtn');
        this.leaveGroupBtn = document.getElementById('leaveGroupBtn');
        
        this.profileViewAvatar = document.getElementById('profileViewAvatar');
        this.profileViewName = document.getElementById('profileViewName');
        this.profileViewUsername = document.getElementById('profileViewUsername');
        this.profileViewBio = document.getElementById('profileViewBio');
        this.profileSendMessageBtn = document.getElementById('profileSendMessageBtn');
        
        this.notificationSound = document.getElementById('notificationSound');
        this.toast = document.getElementById('toast');
        
        this.archiveHeader = document.getElementById('archiveHeader');
        this.backFromArchiveBtn = document.getElementById('backFromArchiveBtn');
        this.archiveHeaderTitle = document.getElementById('archiveHeaderTitle');
        
        this.replyPreview = document.getElementById('replyPreview');
        this.replyPreviewSender = document.getElementById('replyPreviewSender');
        this.replyPreviewText = document.getElementById('replyPreviewText');
        this.cancelReplyBtn = document.getElementById('cancelReplyBtn');
        this.messageContextMenu = document.getElementById('messageContextMenu');
        this.reactionsPanel = document.getElementById('reactionsPanel');
        
        this.createUploadProgressElement();
    }
    
    initNewEventListeners() {
        document.getElementById('contextReply').addEventListener('click', () => {
            const messageId = this.messageContextMenu.dataset.messageId;
            const message = this.messages[this.currentChatId]?.find(m => m.id === messageId);
            if (message) {
                this.setReplyTo(message);
            }
            this.messageContextMenu.classList.remove('show');
        });
        
        document.getElementById('contextPin').addEventListener('click', () => {
            const messageId = this.messageContextMenu.dataset.messageId;
            const chat = this.chats.find(c => c.id === this.currentChatId);
            if (chat && chat.pinnedMessage && chat.pinnedMessage.id === messageId) {
                this.unpinMessage();
            } else {
                this.pinMessage(messageId);
            }
            this.messageContextMenu.classList.remove('show');
        });
        
        document.getElementById('contextFavorite').addEventListener('click', () => {
            const messageId = this.messageContextMenu.dataset.messageId;
            this.toggleFavoriteMessage(messageId);
            this.messageContextMenu.classList.remove('show');
        });
        
        document.getElementById('contextCopy').addEventListener('click', () => {
            const messageId = this.messageContextMenu.dataset.messageId;
            const message = this.messages[this.currentChatId]?.find(m => m.id === messageId);
            if (message && message.text) {
                navigator.clipboard.writeText(message.text);
                this.showToast('Скопировано', 'success');
            }
            this.messageContextMenu.classList.remove('show');
        });
        
        document.getElementById('contextDelete').addEventListener('click', () => {
            const messageId = this.messageContextMenu.dataset.messageId;
            this.deleteMessage(messageId);
            this.messageContextMenu.classList.remove('show');
        });
        
        document.querySelectorAll('.reaction-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const reaction = btn.dataset.reaction;
                const messageId = this.reactionsPanel.dataset.messageId;
                this.addReaction(messageId, reaction);
                this.reactionsPanel.classList.remove('show');
            });
        });
        
        if (this.cancelReplyBtn) {
            this.cancelReplyBtn.addEventListener('click', () => {
                this.cancelReply();
            });
        }
        
        if (this.pinnedMessage) {
            this.pinnedMessage.addEventListener('click', () => {
                this.scrollToPinnedMessage();
            });
        }
        
        if (this.messageInput) {
            this.messageInput.addEventListener('input', () => {
                this.handleTyping();
                this.saveDraft(this.currentChatId, this.messageInput.value);
            });
        }
    }
    
    // ========== МЕТОДЫ ДЛЯ USERNAME ==========
    async generateUniqueUsername(baseName) {
        const translitMap = {
            'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'e','ж':'zh','з':'z','и':'i','й':'y',
            'к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f',
            'х':'h','ц':'c','ч':'ch','ш':'sh','щ':'sch','ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya'
        };
        const translit = (str) => {
            return str.toLowerCase().split('').map(c => translitMap[c] || c).join('').replace(/[^a-z0-9]/g, '');
        };
        let username = translit(baseName);
        if (!username || username.length < 3) username = 'user';
        let candidate = username;
        let counter = 1;
        while (true) {
            const doc = await db.collection('usernames').doc(candidate).get();
            if (!doc.exists) break;
            candidate = `${username}${counter}`;
            counter++;
        }
        return candidate;
    }

    async isUsernameAvailable(username) {
        const doc = await db.collection('usernames').doc(username).get();
        return !doc.exists;
    }

    async claimUsername(newUsername) {
        if (!this.currentUser) throw new Error('No user');
        if (this.currentUserData.username) {
            await db.collection('usernames').doc(this.currentUserData.username).delete();
        }
        await db.collection('usernames').doc(newUsername).set({ uid: this.currentUser.uid });
        await db.collection('users').doc(this.currentUser.uid).update({ username: newUsername });
        this.currentUserData.username = newUsername;
        this.updateUserDisplay();
    }

    // ========== МЕТОДЫ ДЛЯ ЛОКАЛЬНЫХ ИМЁН ==========
    getDisplayNameForChat(chat, forUserId) {
        if (!chat || !chat.participants) return '';
        const otherId = chat.participants.find(id => id !== forUserId);
        if (chat.customNames && chat.customNames[otherId]) {
            return chat.customNames[otherId];
        }
        return chat.name || 'Безымянный';
    }

    getLocalContactName(userId) {
        const chat = this.chats.find(c => c.id === this.currentChatId);
        if (chat && chat.customNames && chat.customNames[userId]) {
            return chat.customNames[userId];
        }
        return '';
    }

    async saveContactName() {
        const newName = this.editContactName.value.trim();
        if (!newName || !this.currentChatId || !this.currentOtherUserId) {
            this.showToast('Введите имя', 'error');
            return;
        }
        try {
            const chatRef = db.collection('chats').doc(this.currentChatId);
            await chatRef.update({
                [`customNames.${this.currentOtherUserId}`]: newName
            });
            const chat = this.chats.find(c => c.id === this.currentChatId);
            if (chat) {
                if (!chat.customNames) chat.customNames = {};
                chat.customNames[this.currentOtherUserId] = newName;
            }
            this.updateChatHeader(chat);
            this.renderChats();
            this.closeAllModals();
            this.showToast('Имя сохранено', 'success');
        } catch (error) {
            console.error('Error saving contact name:', error);
            this.showToast('Ошибка', 'error');
        }
    }

    openEditContactModal() {
        if (!this.currentChatId || !this.currentOtherUserId) return;
        const currentName = this.getLocalContactName(this.currentOtherUserId);
        this.editContactName.value = currentName;
        this.showModal('editContactModal');
    }
    
    // ========== МЕТОДЫ ДЛЯ КАНАЛОВ ==========
    async createChannel() {
        const name = this.channelName.value.trim();
        const description = this.channelDescription.value.trim();
        const avatarFile = this.channelAvatar.files[0];
        if (!name) {
            this.showToast('Введите название канала', 'error');
            return;
        }
        try {
            const channelData = {
                name: name,
                description: description,
                type: 'channel',
                ownerId: this.currentUser.uid,
                participants: [this.currentUser.uid],
                subscribers: [this.currentUser.uid],
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastMessageTime: firebase.firestore.FieldValue.serverTimestamp(),
                lastMessage: 'Канал создан',
                avatarColor: this.getRandomColor(name),
                unreadCount: 0
            };
            const channelRef = await db.collection('chats').add(channelData);
            const channelId = channelRef.id;
            if (avatarFile) {
                const storagePath = `channels/${channelId}/avatar.jpg`;
                const storageRef = storage.ref().child(storagePath);
                await storageRef.put(avatarFile);
                const avatarURL = await storageRef.getDownloadURL();
                await channelRef.update({ avatarURL });
            }
            this.closeAllModals();
            this.channelName.value = '';
            this.channelDescription.value = '';
            this.channelAvatar.value = '';
            this.showToast('Канал создан!', 'success');
            this.selectChat(channelId);
        } catch (error) {
            console.error('Error creating channel:', error);
            this.showToast('Ошибка при создании канала', 'error');
        }
    }
    
    async subscribeToChannel() {
        if (!this.currentChatId || !this.currentUser) return;
        try {
            const chatRef = db.collection('chats').doc(this.currentChatId);
            await chatRef.update({
                subscribers: firebase.firestore.FieldValue.arrayUnion(this.currentUser.uid),
                participants: firebase.firestore.FieldValue.arrayUnion(this.currentUser.uid)
            });
            this.showToast('Вы подписались на канал', 'success');
        } catch (error) {
            console.error('Error subscribing:', error);
            this.showToast('Ошибка подписки', 'error');
        }
    }
    
    async unsubscribeFromChannel() {
        if (!this.currentChatId || !this.currentUser) return;
        try {
            const chatRef = db.collection('chats').doc(this.currentChatId);
            await chatRef.update({
                subscribers: firebase.firestore.FieldValue.arrayRemove(this.currentUser.uid),
                participants: firebase.firestore.FieldValue.arrayRemove(this.currentUser.uid)
            });
            this.showToast('Вы отписались от канала', 'info');
        } catch (error) {
            console.error('Error unsubscribing:', error);
            this.showToast('Ошибка отписки', 'error');
        }
    }
    
    canSendMessage(chat) {
        if (!chat) return false;
        if (chat.type === 'private') return true;
        if (chat.type === 'channel') return chat.ownerId === this.currentUser.uid;
        if (chat.type === 'group') return true;
        return false;
    }
    
    // ========== МЕТОДЫ ДЛЯ ГРУПП ==========
    async addMemberToNewGroup() {
        const input = this.addMemberInput.value.trim();
        if (!input) return;
        try {
            const usersRef = db.collection('users');
            let query;
            if (input.startsWith('@')) {
                const username = input.substring(1);
                query = usersRef.where('username', '==', username).limit(1);
            } else {
                query = usersRef.where('email', '==', input).limit(1);
            }
            const snapshot = await query.get();
            if (snapshot.empty) {
                this.showToast('Пользователь не найден', 'error');
                return;
            }
            const user = snapshot.docs[0];
            const uid = user.id;
            const userData = user.data();
            if (uid === this.currentUser.uid) {
                this.showToast('Нельзя добавить себя', 'error');
                return;
            }
            if (this.newGroupMembers.some(m => m.uid === uid)) {
                this.showToast('Пользователь уже в списке', 'info');
                return;
            }
            this.newGroupMembers.push({
                uid: uid,
                name: userData.displayName || userData.email.split('@')[0],
                username: userData.username
            });
            this.renderMembersPreview();
            this.addMemberInput.value = '';
        } catch (error) {
            console.error('Error adding member:', error);
            this.showToast('Ошибка при добавлении', 'error');
        }
    }
    
    renderMembersPreview() {
        if (!this.membersPreview) return;
        if (this.newGroupMembers.length === 0) {
            this.membersPreview.innerHTML = '<small>Пока никого не добавили</small>';
            return;
        }
        let html = '<div style="display: flex; flex-wrap: wrap; gap: 8px;">';
        this.newGroupMembers.forEach(member => {
            html += `
                <div class="member-tag">
                    <span>${this.escapeHtml(member.name)}</span>
                    <button class="remove-member" data-uid="${member.uid}">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
        });
        html += '</div>';
        this.membersPreview.innerHTML = html;
        this.membersPreview.querySelectorAll('.remove-member').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const uid = btn.dataset.uid;
                this.newGroupMembers = this.newGroupMembers.filter(m => m.uid !== uid);
                this.renderMembersPreview();
            });
        });
    }
    
    async createGroup() {
        const name = this.groupName.value.trim();
        const description = this.groupDescription.value.trim();
        const avatarFile = this.groupAvatar.files[0];
        if (!name) {
            this.showToast('Введите название группы', 'error');
            return;
        }
        const participants = [this.currentUser.uid, ...this.newGroupMembers.map(m => m.uid)];
        const admins = [this.currentUser.uid];
        try {
            const groupData = {
                name: name,
                description: description,
                type: 'group',
                ownerId: this.currentUser.uid,
                participants: participants,
                admins: admins,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastMessageTime: firebase.firestore.FieldValue.serverTimestamp(),
                lastMessage: 'Группа создана',
                avatarColor: this.getRandomColor(name),
                unreadCount: 0
            };
            const groupRef = await db.collection('chats').add(groupData);
            const groupId = groupRef.id;
            if (avatarFile) {
                const storagePath = `groups/${groupId}/avatar.jpg`;
                const storageRef = storage.ref().child(storagePath);
                await storageRef.put(avatarFile);
                const avatarURL = await storageRef.getDownloadURL();
                await groupRef.update({ avatarURL });
            }
            this.newGroupMembers = [];
            this.closeAllModals();
            this.groupName.value = '';
            this.groupDescription.value = '';
            this.groupAvatar.value = '';
            this.membersPreview.innerHTML = '';
            this.showToast('Группа создана!', 'success');
            this.selectChat(groupId);
        } catch (error) {
            console.error('Error creating group:', error);
            this.showToast('Ошибка при создании группы', 'error');
        }
    }
    
    async openManageGroupModal() {
        if (!this.currentChatId) return;
        const chat = this.chats.find(c => c.id === this.currentChatId);
        if (!chat || chat.type !== 'group') return;
        this.manageGroupName.value = chat.name || '';
        this.manageGroupDescription.value = chat.description || '';
        this.manageGroupAvatar.value = '';
        await this.renderMembersList(chat.participants || [], chat.admins || []);
        const isAdmin = chat.admins && chat.admins.includes(this.currentUser.uid);
        const isOwner = chat.ownerId === this.currentUser.uid;
        if (!isAdmin) {
            this.manageGroupName.disabled = true;
            this.manageGroupDescription.disabled = true;
            this.manageGroupAvatar.disabled = true;
            this.saveGroupSettingsBtn.style.display = 'none';
            this.addGroupMemberInput.style.display = 'none';
            this.addGroupMemberBtn.style.display = 'none';
        } else {
            this.manageGroupName.disabled = false;
            this.manageGroupDescription.disabled = false;
            this.manageGroupAvatar.disabled = false;
            this.saveGroupSettingsBtn.style.display = 'flex';
            this.addGroupMemberInput.style.display = 'block';
            this.addGroupMemberBtn.style.display = 'inline-flex';
        }
        this.deleteGroupBtn.style.display = isOwner ? 'flex' : 'none';
        this.leaveGroupBtn.style.display = isOwner ? 'none' : 'flex';
        this.showModal('manageGroupModal');
    }
    
    async renderMembersList(participantIds, adminIds = []) {
        if (!this.membersList) return;
        this.memberCount.textContent = participantIds.length;
        if (participantIds.length === 0) {
            this.membersList.innerHTML = '<p class="empty-list">Нет участников</p>';
            return;
        }
        const usersData = {};
        const promises = participantIds.map(async (uid) => {
            if (uid === this.currentUser.uid) {
                usersData[uid] = { displayName: this.currentUserData.displayName, username: this.currentUserData.username };
            } else {
                try {
                    const userDoc = await db.collection('users').doc(uid).get();
                    if (userDoc.exists) {
                        usersData[uid] = userDoc.data();
                    }
                } catch (e) {
                    console.error('Error loading user', uid, e);
                }
            }
        });
        await Promise.all(promises);
        let html = '';
        participantIds.forEach(uid => {
            const user = usersData[uid] || { displayName: 'Неизвестно', username: '' };
            const displayName = user.displayName || 'Пользователь';
            const username = user.username ? '@' + user.username : '';
            const isAdmin = adminIds.includes(uid) ? ' (админ)' : '';
            const isOwner = uid === this.manageGroupOwnerId;
            const canManage = adminIds.includes(this.currentUser.uid);
            html += `
                <div class="member-item" data-uid="${uid}">
                    <div class="member-info">
                        <span class="member-name clickable" data-uid="${uid}">${this.escapeHtml(displayName)}${isAdmin}${isOwner ? ' (владелец)' : ''}</span>
                        <span class="member-username">${this.escapeHtml(username)}</span>
                    </div>
                    ${canManage && uid !== this.currentUser.uid ? `
                        <div class="member-actions">
                            ${!adminIds.includes(uid) ? `<button class="make-admin-btn" title="Сделать администратором"><i class="fas fa-crown"></i></button>` : ''}
                            ${adminIds.includes(uid) && uid !== this.manageGroupOwnerId ? `<button class="remove-admin-btn" title="Убрать администратора"><i class="fas fa-user-minus"></i></button>` : ''}
                            <button class="remove-member-btn" title="Удалить из группы"><i class="fas fa-times"></i></button>
                        </div>
                    ` : ''}
                </div>
            `;
        });
        this.membersList.innerHTML = html;
        this.membersList.querySelectorAll('.member-name.clickable').forEach(el => {
            el.addEventListener('click', (e) => {
                e.stopPropagation();
                const uid = el.dataset.uid;
                if (uid && uid !== this.currentUser.uid) {
                    this.openProfile(uid);
                } else if (uid === this.currentUser.uid) {
                    this.showToast('Это вы', 'info');
                }
            });
        });
        if (adminIds.includes(this.currentUser.uid)) {
            this.membersList.querySelectorAll('.make-admin-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    const memberItem = btn.closest('.member-item');
                    const uid = memberItem.dataset.uid;
                    await this.toggleAdmin(uid, true);
                });
            });
            this.membersList.querySelectorAll('.remove-admin-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    const memberItem = btn.closest('.member-item');
                    const uid = memberItem.dataset.uid;
                    await this.toggleAdmin(uid, false);
                });
            });
            this.membersList.querySelectorAll('.remove-member-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    const memberItem = btn.closest('.member-item');
                    const uid = memberItem.dataset.uid;
                    if (confirm(`Удалить пользователя из группы?`)) {
                        await this.removeGroupMember(uid);
                    }
                });
            });
        }
    }
    
    async toggleAdmin(uid, makeAdmin) {
        if (!this.currentChatId) return;
        try {
            const chatRef = db.collection('chats').doc(this.currentChatId);
            if (makeAdmin) {
                await chatRef.update({
                    admins: firebase.firestore.FieldValue.arrayUnion(uid)
                });
                this.showToast('Администратор назначен', 'success');
            } else {
                await chatRef.update({
                    admins: firebase.firestore.FieldValue.arrayRemove(uid)
                });
                this.showToast('Администратор снят', 'info');
            }
            const chat = this.chats.find(c => c.id === this.currentChatId);
            await this.renderMembersList(chat.participants, chat.admins);
        } catch (error) {
            console.error('Error toggling admin:', error);
            this.showToast('Ошибка', 'error');
        }
    }
    
    async removeGroupMember(uid) {
        if (!this.currentChatId) return;
        try {
            const chatRef = db.collection('chats').doc(this.currentChatId);
            await chatRef.update({
                participants: firebase.firestore.FieldValue.arrayRemove(uid),
                admins: firebase.firestore.FieldValue.arrayRemove(uid)
            });
            this.showToast('Участник удалён', 'success');
            const chat = this.chats.find(c => c.id === this.currentChatId);
            await this.renderMembersList(chat.participants, chat.admins);
        } catch (error) {
            console.error('Error removing member:', error);
            this.showToast('Ошибка при удалении', 'error');
        }
    }
    
    async addGroupMember() {
        const input = this.addGroupMemberInput.value.trim();
        if (!input) return;
        try {
            const usersRef = db.collection('users');
            let query;
            if (input.startsWith('@')) {
                const username = input.substring(1);
                query = usersRef.where('username', '==', username).limit(1);
            } else {
                query = usersRef.where('email', '==', input).limit(1);
            }
            const snapshot = await query.get();
            if (snapshot.empty) {
                this.showToast('Пользователь не найден', 'error');
                return;
            }
            const user = snapshot.docs[0];
            const uid = user.id;
            const chat = this.chats.find(c => c.id === this.currentChatId);
            if (chat.participants && chat.participants.includes(uid)) {
                this.showToast('Пользователь уже в группе', 'info');
                return;
            }
            const chatRef = db.collection('chats').doc(this.currentChatId);
            await chatRef.update({
                participants: firebase.firestore.FieldValue.arrayUnion(uid)
            });
            this.showToast('Участник добавлен', 'success');
            this.addGroupMemberInput.value = '';
            await this.renderMembersList([...chat.participants, uid], chat.admins);
        } catch (error) {
            console.error('Error adding member:', error);
            this.showToast('Ошибка при добавлении', 'error');
        }
    }
    
    async saveGroupSettings() {
        const newName = this.manageGroupName.value.trim();
        const newDescription = this.manageGroupDescription.value.trim();
        const avatarFile = this.manageGroupAvatar.files[0];
        if (!newName) {
            this.showToast('Название не может быть пустым', 'error');
            return;
        }
        try {
            const updateData = {
                name: newName,
                description: newDescription
            };
            if (avatarFile) {
                const storagePath = `groups/${this.currentChatId}/avatar.jpg`;
                const storageRef = storage.ref().child(storagePath);
                await storageRef.put(avatarFile);
                const avatarURL = await storageRef.getDownloadURL();
                updateData.avatarURL = avatarURL;
            }
            await db.collection('chats').doc(this.currentChatId).update(updateData);
            this.showToast('Настройки сохранены', 'success');
            this.closeAllModals();
            const chat = this.chats.find(c => c.id === this.currentChatId);
            if (chat) {
                chat.name = newName;
                chat.description = newDescription;
                if (updateData.avatarURL) chat.avatarURL = updateData.avatarURL;
                this.updateChatHeader(chat);
                this.renderChats();
            }
        } catch (error) {
            console.error('Error saving group settings:', error);
            this.showToast('Ошибка при сохранении', 'error');
        }
    }
    
    async leaveGroup() {
        if (!this.currentChatId) return;
        const chat = this.chats.find(c => c.id === this.currentChatId);
        if (chat.ownerId === this.currentUser.uid) {
            this.showToast('Владелец не может покинуть группу. Сначала передайте права или удалите группу.', 'error');
            return;
        }
        if (confirm('Вы уверены, что хотите покинуть группу?')) {
            try {
                const chatRef = db.collection('chats').doc(this.currentChatId);
                await chatRef.update({
                    participants: firebase.firestore.FieldValue.arrayRemove(this.currentUser.uid),
                    admins: firebase.firestore.FieldValue.arrayRemove(this.currentUser.uid)
                });
                this.closeAllModals();
                this.showToast('Вы покинули группу', 'info');
                this.currentChatId = null;
                this.currentOtherUserId = null;
                this.chatHeader.style.display = 'none';
                this.messageInputWrapper.style.display = 'none';
                this.emptyChat.style.display = 'flex';
            } catch (error) {
                console.error('Error leaving group:', error);
                this.showToast('Ошибка при выходе', 'error');
            }
        }
    }
    
    // ========== МЕТОДЫ ДЛЯ ПРОФИЛЯ ==========
    async openProfile(userId) {
        if (!userId) return;
        if (userId === this.currentUser.uid) {
            this.showToast('Это ваш профиль', 'info');
            return;
        }
        try {
            const userData = await this.loadUserProfileData(userId);
            if (!userData) {
                this.showToast('Пользователь не найден', 'error');
                return;
            }
            this.renderProfile(userId, userData);
            this.showModal('profileModal');
        } catch (error) {
            console.error('Error loading profile:', error);
            this.showToast('Ошибка загрузки профиля', 'error');
        }
    }
    
    async loadUserProfileData(userId) {
        try {
            const userDoc = await db.collection('users').doc(userId).get();
            if (!userDoc.exists) return null;
            return userDoc.data();
        } catch (error) {
            console.error('Error loading user data:', error);
            return null;
        }
    }
    
    renderProfile(userId, userData) {
        const avatarText = userData.displayName ? userData.displayName.charAt(0).toUpperCase() : '?';
        const avatarColor = userData.avatarColor || this.getRandomColor(userData.displayName || '');
        this.renderAvatar(this.profileViewAvatar, avatarText, avatarColor, userData.avatarURL);
        this.profileViewName.textContent = userData.displayName || 'Без имени';
        this.profileViewUsername.textContent = userData.username ? '@' + userData.username : '';
        this.profileViewBio.textContent = userData.bio || 'Нет информации';
        this.profileSendMessageBtn.dataset.userId = userId;
    }
    
    async startChatFromProfile(userId) {
        if (!userId) return;
        const existingChat = this.chats.find(chat => 
            chat.type === 'private' && 
            chat.participants.includes(userId)
        );
        if (existingChat) {
            this.closeAllModals();
            this.selectChat(existingChat.id);
            return;
        }
        try {
            const userData = await this.loadUserProfileData(userId);
            const userName = userData.displayName || 'Пользователь';
            const newChat = {
                name: userName,
                participants: [this.currentUser.uid, userId],
                type: 'private',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastMessageTime: firebase.firestore.FieldValue.serverTimestamp(),
                lastMessage: 'Чат создан',
                avatarColor: this.getRandomColor(userName),
                unreadCount: 0,
                customNames: {
                    [this.currentUser.uid]: userName,
                    [userId]: this.currentUserData.displayName
                }
            };
            const chatRef = await db.collection('chats').add(newChat);
            this.closeAllModals();
            this.showToast('Чат создан!', 'success');
            this.selectChat(chatRef.id);
        } catch (error) {
            console.error('Error creating chat from profile:', error);
            this.showToast('Ошибка при создании чата', 'error');
        }
    }
    
    // ========== МЕТОДЫ ДЛЯ СТАТУСОВ ==========
    async setUserOnline() {
        if (!this.currentUser) return;
        const userRef = db.collection('presence').doc(this.currentUser.uid);
        const updateStatus = async (online) => {
            try {
                await userRef.set({
                    online: online,
                    lastSeen: firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
            } catch (error) {
                console.error('Error updating status:', error);
            }
        };
        await updateStatus(true);
        window.addEventListener('beforeunload', () => {
            const data = {
                fields: {
                    online: { booleanValue: false },
                    lastSeen: { timestampValue: new Date().toISOString() }
                }
            };
            navigator.sendBeacon(
                `https://firestore.googleapis.com/v1/projects/${firebase.app().options.projectId}/databases/(default)/documents/presence/${this.currentUser.uid}`,
                JSON.stringify(data)
            );
        });
        document.addEventListener('visibilitychange', () => {
            updateStatus(!document.hidden);
        });
        setInterval(() => {
            if (this.currentUser && !document.hidden) {
                updateStatus(true);
            }
        }, 30000);
    }
    
    // ========== НОВЫЕ МЕТОДЫ: РЕАКЦИИ ==========
    async addReaction(messageId, reaction) {
        if (!this.currentUser || !this.currentChatId) return;
        try {
            const messageRef = db.collection('messages').doc(messageId);
            const messageDoc = await messageRef.get();
            if (!messageDoc.exists) return;
            const message = messageDoc.data();
            const reactions = message.reactions || {};
            const users = reactions[reaction] || [];
            if (users.includes(this.currentUser.uid)) {
                const newUsers = users.filter(uid => uid !== this.currentUser.uid);
                if (newUsers.length === 0) {
                    delete reactions[reaction];
                } else {
                    reactions[reaction] = newUsers;
                }
            } else {
                reactions[reaction] = [...users, this.currentUser.uid];
            }
            await messageRef.update({ reactions });
        } catch (error) {
            console.error('Error adding reaction:', error);
        }
    }
    
    renderReactions(messageId, reactions = {}) {
        const container = document.querySelector(`[data-message-id="${messageId}"] .message-reactions`);
        if (!container) return;
        container.innerHTML = '';
        const sortedReactions = Object.entries(reactions).sort((a, b) => b[1].length - a[1].length);
        sortedReactions.forEach(([reaction, users]) => {
            if (users.length === 0) return;
            const badge = document.createElement('span');
            badge.className = `reaction-badge ${users.includes(this.currentUser?.uid) ? 'active' : ''}`;
            badge.dataset.reaction = reaction;
            badge.dataset.messageId = messageId;
            badge.innerHTML = `${reaction} <span class="reaction-count">${users.length}</span>`;
            badge.addEventListener('click', (e) => {
                e.stopPropagation();
                this.addReaction(messageId, reaction);
            });
            container.appendChild(badge);
        });
    }
    
    showReactionsPanel(messageId, x, y) {
        const panel = this.reactionsPanel;
        if (!panel) return;
        panel.dataset.messageId = messageId;
        panel.style.left = x + 'px';
        panel.style.top = y + 'px';
        panel.classList.add('show');
        const closePanel = (e) => {
            if (!panel.contains(e.target) && !e.target.closest('.add-reaction-btn')) {
                panel.classList.remove('show');
                document.removeEventListener('click', closePanel);
            }
        };
        setTimeout(() => {
            document.addEventListener('click', closePanel);
        }, 100);
    }
    
    // ========== НОВЫЕ МЕТОДЫ: ЗАКРЕПЛЕННЫЕ СООБЩЕНИЯ ==========
    async pinMessage(messageId) {
        if (!this.currentChatId || !this.currentUser) return;
        const chat = this.chats.find(c => c.id === this.currentChatId);
        if (chat.type === 'channel' && chat.ownerId !== this.currentUser.uid) {
            this.showToast('Только владелец канала может закрепить сообщение', 'error');
            return;
        }
        if (chat.type === 'group' && !(chat.admins && chat.admins.includes(this.currentUser.uid))) {
            this.showToast('Только администраторы могут закрепить сообщение', 'error');
            return;
        }
        try {
            const messageDoc = await db.collection('messages').doc(messageId).get();
            if (!messageDoc.exists) return;
            const message = messageDoc.data();
            await db.collection('chats').doc(this.currentChatId).update({
                pinnedMessage: {
                    id: messageId,
                    text: message.text || (message.type === 'file' ? 'Файл' : 'Сообщение'),
                    senderId: message.senderId,
                    timestamp: message.timestamp
                }
            });
            this.showToast('Сообщение закреплено', 'success');
        } catch (error) {
            console.error('Error pinning message:', error);
            this.showToast('Ошибка при закреплении', 'error');
        }
    }
    
    async unpinMessage() {
        if (!this.currentChatId) return;
        try {
            await db.collection('chats').doc(this.currentChatId).update({
                pinnedMessage: firebase.firestore.FieldValue.delete()
            });
            this.showToast('Сообщение откреплено', 'info');
        } catch (error) {
            console.error('Error unpinning message:', error);
            this.showToast('Ошибка при откреплении', 'error');
        }
    }
    
    scrollToPinnedMessage() {
        const chat = this.chats.find(c => c.id === this.currentChatId);
        if (chat && chat.pinnedMessage) {
            this.scrollToMessage(chat.pinnedMessage.id);
        }
    }
    
    // ========== НОВЫЕ МЕТОДЫ: ОТВЕТЫ НА СООБЩЕНИЯ ==========
    setReplyTo(message) {
        this.replyToMessage = {
            id: message.id,
            text: message.text || (message.type === 'file' ? message.fileName : 'Сообщение'),
            senderName: message.senderName,
            type: message.type
        };
        if (this.replyPreview && this.replyPreviewSender && this.replyPreviewText) {
            this.replyPreviewSender.textContent = message.senderName;
            this.replyPreviewText.textContent = this.replyToMessage.text;
            this.replyPreview.style.display = 'flex';
        }
        this.messageInput.focus();
    }
    
    cancelReply() {
        this.replyToMessage = null;
        if (this.replyPreview) {
            this.replyPreview.style.display = 'none';
        }
    }
    
    // ========== НОВЫЕ МЕТОДЫ: ЧЕРНОВИКИ ==========
    saveDraft(chatId, text) {
        if (!chatId || !this.currentUser) return;
        try {
            const drafts = JSON.parse(localStorage.getItem('drafts') || '{}');
            if (text.trim()) {
                drafts[chatId] = {
                    text: text,
                    timestamp: Date.now(),
                    replyTo: this.replyToMessage
                };
            } else {
                delete drafts[chatId];
            }
            localStorage.setItem('drafts', JSON.stringify(drafts));
            const container = document.querySelector('.message-input-container');
            if (container) {
                if (text.trim()) {
                    container.classList.add('has-draft');
                } else {
                    container.classList.remove('has-draft');
                }
            }
        } catch (error) {
            console.error('Error saving draft:', error);
        }
    }
    
    loadDraft(chatId) {
        if (!chatId) return null;
        try {
            const drafts = JSON.parse(localStorage.getItem('drafts') || '{}');
            const draft = drafts[chatId];
            if (draft) {
                if (Date.now() - draft.timestamp > 7 * 24 * 60 * 60 * 1000) {
                    delete drafts[chatId];
                    localStorage.setItem('drafts', JSON.stringify(drafts));
                    return null;
                }
                return draft;
            }
        } catch (error) {
            console.error('Error loading draft:', error);
        }
        return null;
    }
    
    clearDraft(chatId) {
        if (!chatId) return;
        try {
            const drafts = JSON.parse(localStorage.getItem('drafts') || '{}');
            delete drafts[chatId];
            localStorage.setItem('drafts', JSON.stringify(drafts));
            const container = document.querySelector('.message-input-container');
            if (container) {
                container.classList.remove('has-draft');
            }
        } catch (error) {
            console.error('Error clearing draft:', error);
        }
    }
    
    // ========== ОСТАЛЬНЫЕ МЕТОДЫ ==========
    createUploadProgressElement() {
        if (!document.getElementById('uploadProgress')) {
            const progressHTML = `
                <div class="upload-progress" id="uploadProgress">
                    <div class="progress-header">
                        <span class="progress-filename">Загрузка...</span>
                        <button class="cancel-upload" id="cancelUploadBtn">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="progress-bar-container">
                        <div class="progress-bar" id="uploadProgressBar" style="width: 0%"></div>
                    </div>
                    <div class="progress-text" id="uploadProgressText">0%</div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', progressHTML);
            this.uploadProgress = document.getElementById('uploadProgress');
            this.uploadProgressBar = document.getElementById('uploadProgressBar');
            this.uploadProgressText = document.getElementById('uploadProgressText');
            this.uploadProgressFilename = document.querySelector('.progress-filename');
            this.cancelUploadBtn = document.getElementById('cancelUploadBtn');
            if (this.cancelUploadBtn) {
                this.cancelUploadBtn.addEventListener('click', () => this.cancelCurrentUpload());
            }
        }
    }
    
    renderAvatar(container, text, color, url) {
        if (url) {
            const img = document.createElement('img');
            img.src = url;
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'cover';
            img.onerror = () => {
                container.innerHTML = `<span>${this.escapeHtml(text)}</span>`;
                container.style.background = color;
            };
            container.innerHTML = '';
            container.appendChild(img);
            container.style.background = 'transparent';
        } else {
            container.innerHTML = `<span>${this.escapeHtml(text)}</span>`;
            container.style.background = color;
        }
    }
    
    initEventListeners() {
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
        
        this.loginBtn.addEventListener('click', () => this.login());
        this.loginPassword.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.login();
        });
        
        this.registerBtn.addEventListener('click', () => this.register());
        this.testAuthBtn.addEventListener('click', () => this.testAuth());
        
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
        
        this.menuCreateGroup.addEventListener('click', () => {
            this.userMenu.classList.remove('show');
            this.newGroupMembers = [];
            this.renderMembersPreview();
            this.showModal('createGroupModal');
        });
        
        this.menuCreateChannel.addEventListener('click', () => {
            this.userMenu.classList.remove('show');
            this.showModal('createChannelModal');
        });
        
        this.menuArchive.addEventListener('click', () => {
            this.userMenu.classList.remove('show');
            this.toggleArchive();
        });
        
        this.menuFavorites.addEventListener('click', () => {
            this.userMenu.classList.remove('show');
            this.showFavorites();
        });
        
        this.settingsBtn.addEventListener('click', () => this.openSettings());
        this.saveSettingsBtn.addEventListener('click', () => this.saveSettings());
        
        this.addChatBtn.addEventListener('click', () => this.showModal('newChatModal'));
        this.createChatBtn.addEventListener('click', () => this.createNewChat());
        
        this.searchInput.addEventListener('input', () => this.filterChats());
        
        this.sendMessageBtn.addEventListener('click', () => this.sendMessage());
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        this.messageInput.addEventListener('input', () => {
            this.handleTyping();
        });
        
        this.deleteChatBtn.addEventListener('click', () => this.deleteCurrentChat());
        this.archiveChatBtn.addEventListener('click', () => this.toggleArchiveChat());
        
        this.manageChannelBtn.addEventListener('click', () => this.openManageChannelModal());
        this.manageGroupBtn.addEventListener('click', () => this.openManageGroupModal());
        this.subscribeChannelBtn.addEventListener('click', () => this.subscribeToChannel());
        this.unsubscribeChannelBtn.addEventListener('click', () => this.unsubscribeFromChannel());
        
        this.backToChatsBtn.addEventListener('click', () => {
            document.querySelector('.sidebar').classList.remove('hidden');
        });
        
        if (this.backFromArchiveBtn) {
            this.backFromArchiveBtn.addEventListener('click', () => {
                this.exitArchive();
            });
        }
        
        this.chatName.addEventListener('click', () => {
            if (this.currentChatId && this.currentOtherUserId) {
                this.openEditContactModal();
            }
        });

        this.saveContactNameBtn.addEventListener('click', () => this.saveContactName());
        
        this.attachBtn.addEventListener('click', () => {
            this.fileInput.click();
        });
        
        this.fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.uploadFile(e.target.files[0]);
            }
        });
        
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
        
        this.closeModalBtns.forEach(btn => {
            btn.addEventListener('click', () => this.closeAllModals());
        });
        
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeAllModals();
            }
        });
        
        this.createChannelBtn.addEventListener('click', () => this.createChannel());
        
        this.addSubscriberBtn.addEventListener('click', () => this.addSubscriber());
        this.saveChannelSettingsBtn.addEventListener('click', () => this.saveChannelSettings());
      
        if (this.addMemberBtn) {
            this.addMemberBtn.addEventListener('click', () => this.addMemberToNewGroup());
        }
        if (this.createGroupBtn) {
            this.createGroupBtn.addEventListener('click', () => this.createGroup());
        }
        if (this.addGroupMemberBtn) {
            this.addGroupMemberBtn.addEventListener('click', () => this.addGroupMember());
        }
        if (this.saveGroupSettingsBtn) {
            this.saveGroupSettingsBtn.addEventListener('click', () => this.saveGroupSettings());
        }
        if (this.deleteGroupBtn) {
            this.deleteGroupBtn.addEventListener('click', () => this.deleteCurrentChat());
        }
        if (this.leaveGroupBtn) {
            this.leaveGroupBtn.addEventListener('click', () => this.leaveGroup());
        }
        
        if (this.profileSendMessageBtn) {
            this.profileSendMessageBtn.addEventListener('click', () => {
                const userId = this.profileSendMessageBtn.dataset.userId;
                if (userId) {
                    this.startChatFromProfile(userId);
                }
            });
        }
        
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
        const compression = localStorage.getItem('compression');
        if (compression !== null) {
            this.compressionEnabled = compression === 'true';
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
                this.loadArchivedChats();
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
        if (this.currentStatusListener) {
            this.currentStatusListener();
            this.currentStatusListener = null;
        }
        Object.values(this.userPresenceListeners).forEach(unsubscribe => {
            if (unsubscribe) unsubscribe();
        });
        this.userPresenceListeners = {};
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
                    username: userData.username || null,
                    bio: userData.bio || '',
                    avatarColor: userData.avatarColor || '#2AABEE',
                    avatarURL: userData.avatarURL || null,
                    email: this.currentUser.email
                };
            } else {
                const displayName = this.currentUser.email.split('@')[0];
                const username = await this.generateUniqueUsername(displayName);
                await db.collection('usernames').doc(username).set({ uid: this.currentUser.uid });
                await db.collection('users').doc(this.currentUser.uid).set({
                    email: this.currentUser.email,
                    displayName: displayName,
                    username: username,
                    bio: '',
                    avatarColor: '#2AABEE',
                    avatarURL: null,
                    createdAt: new Date().toISOString()
                });
                await this.currentUser.updateProfile({
                    displayName: displayName
                });
                this.currentUserData = {
                    displayName: displayName,
                    username: username,
                    bio: '',
                    avatarColor: '#2AABEE',
                    avatarURL: null,
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
        const avatarURL = this.currentUserData.avatarURL;
        const color = this.currentUserData.avatarColor || '#2AABEE';
        this.renderAvatar(this.profileAvatar, avatarText, color, avatarURL);
        this.renderAvatar(this.menuAvatar, avatarText, color, avatarURL);
        this.profileName.textContent = displayName;
        this.profileEmail.textContent = this.currentUserData.username 
            ? '@' + this.currentUserData.username 
            : this.currentUserData.email;
        this.menuName.textContent = displayName;
        this.menuEmail.textContent = this.currentUserData.username 
            ? '@' + this.currentUserData.username 
            : this.currentUserData.email;
    }
    
    // ========== АРХИВ ==========
    async loadArchivedChats() {
        if (!this.currentUser) return;
        try {
            const userDoc = await db.collection('users').doc(this.currentUser.uid).get();
            if (userDoc.exists && userDoc.data().archivedChats) {
                this.archivedChats = new Set(userDoc.data().archivedChats);
            } else {
                this.archivedChats = new Set();
            }
        } catch (error) {
            console.error('Error loading archived chats:', error);
        }
    }
    
    async saveArchivedChats() {
        if (!this.currentUser) return;
        try {
            await db.collection('users').doc(this.currentUser.uid).set({
                archivedChats: Array.from(this.archivedChats)
            }, { merge: true });
        } catch (error) {
            console.error('Error saving archived chats:', error);
        }
    }
    
    async toggleArchiveChat() {
        if (!this.currentChatId) return;
        if (this.archivedChats.has(this.currentChatId)) {
            this.archivedChats.delete(this.currentChatId);
            this.showToast('Чат разархивирован', 'success');
            this.archiveChatBtn.innerHTML = '<i class="fas fa-archive"></i>';
            this.archiveChatBtn.title = 'Архивировать';
        } else {
            this.archivedChats.add(this.currentChatId);
            this.showToast('Чат архивирован', 'success');
            this.archiveChatBtn.innerHTML = '<i class="fas fa-box-open"></i>';
            this.archiveChatBtn.title = 'Разархивировать';
        }
        await this.saveArchivedChats();
        this.renderChats();
    }
    
    toggleArchive() {
        if (this.showingArchive) this.exitArchive();
        else this.enterArchive();
    }
    
    enterArchive() {
        this.showingArchive = true;
        this.showingFavorites = false;
        if (this.archiveHeader) this.archiveHeader.style.display = 'flex';
        document.querySelector('.search-box').style.display = 'none';
        this.renderArchive();
    }
    
    exitArchive() {
        this.showingArchive = false;
        if (this.archiveHeader) this.archiveHeader.style.display = 'none';
        document.querySelector('.search-box').style.display = 'block';
        this.renderChats();
    }
    
    renderArchive() {
        this.chatsList.innerHTML = '';
        const archivedChatsList = this.chats.filter(chat => this.archivedChats.has(chat.id));
        if (archivedChatsList.length === 0) {
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'empty-archive';
            emptyDiv.innerHTML = `
                <i class="fas fa-archive"></i>
                <p>В архиве нет чатов</p>
                <small>Чтобы архивировать чат, откройте его и нажмите кнопку архивации</small>
            `;
            this.chatsList.appendChild(emptyDiv);
            return;
        }
        archivedChatsList.sort((a, b) => {
            const timeA = a.lastMessageTime ? a.lastMessageTime.toDate() : new Date(0);
            const timeB = b.lastMessageTime ? b.lastMessageTime.toDate() : new Date(0);
            return timeB - timeA;
        });
        archivedChatsList.forEach(chat => {
            const chatElement = this.createChatElement(chat, true);
            this.chatsList.appendChild(chatElement);
        });
    }
    
    // ========== ИЗБРАННОЕ ==========
    async showFavorites() {
        this.showingFavorites = true;
        await this.loadFavorites();
        this.showModal('favoritesModal');
    }
    
    async loadFavorites() {
        if (!this.currentUser) return;
        try {
            const snapshot = await db.collection('favorites')
                .where('userId', '==', this.currentUser.uid)
                .orderBy('addedAt', 'desc')
                .get();
            this.favorites = [];
            for (const doc of snapshot.docs) {
                const favorite = { id: doc.id, ...doc.data() };
                const chatDoc = await db.collection('chats').doc(favorite.chatId).get();
                if (chatDoc.exists) favorite.chatName = chatDoc.data().name;
                this.favorites.push(favorite);
            }
            this.renderFavorites();
        } catch (error) {
            console.error('Error loading favorites:', error);
            this.showToast('Ошибка загрузки избранного', 'error');
        }
    }
    
    renderFavorites() {
        if (!this.favoritesList) return;
        this.favoritesList.innerHTML = '';
        if (this.favorites.length === 0) {
            this.favoritesList.innerHTML = `
                <div class="empty-favorites">
                    <i class="fas fa-star"></i>
                    <p>Нет избранных сообщений</p>
                    <small>Нажмите на звездочку у сообщения, чтобы добавить его в избранное</small>
                </div>
            `;
            return;
        }
        this.favorites.forEach(fav => {
            const item = document.createElement('div');
            item.className = 'favorite-item';
            item.dataset.chatId = fav.chatId;
            item.dataset.messageId = fav.messageId;
            const avatarText = fav.chatName ? fav.chatName.charAt(0).toUpperCase() : '?';
            const time = fav.addedAt ? fav.addedAt.toDate().toLocaleString() : '';
            let messageContent = '';
            if (fav.messageType === 'image') {
                messageContent = '<i class="fas fa-image"></i> Фото';
            } else if (fav.messageType === 'file') {
                messageContent = '<i class="fas fa-file"></i> Файл';
            } else if (fav.messageType === 'video') {
                messageContent = '<i class="fas fa-video"></i> Видео';
            } else {
                messageContent = this.escapeHtml(fav.messageText || 'Сообщение');
            }
            item.innerHTML = `
                <div class="favorite-item-avatar">${this.escapeHtml(avatarText)}</div>
                <div class="favorite-item-content">
                    <div class="favorite-item-header">
                        <span class="favorite-item-chat">${this.escapeHtml(fav.chatName || 'Чат')}</span>
                        <span class="favorite-item-time">${this.escapeHtml(time)}</span>
                    </div>
                    <div class="favorite-item-message ${fav.messageType === 'file' || fav.messageType === 'image' || fav.messageType === 'video' ? 'file-message' : ''}">
                        ${messageContent}
                    </div>
                </div>
            `;
            item.addEventListener('click', () => {
                this.closeAllModals();
                this.selectChat(fav.chatId);
                setTimeout(() => {
                    this.scrollToMessage(fav.messageId);
                }, 500);
            });
            this.favoritesList.appendChild(item);
        });
    }
    
    async toggleFavorite(message) {
        if (!this.currentUser) return;
        try {
            const snapshot = await db.collection('favorites')
                .where('userId', '==', this.currentUser.uid)
                .where('messageId', '==', message.id)
                .get();
            if (!snapshot.empty) {
                await snapshot.docs[0].ref.delete();
                this.showToast('Удалено из избранного', 'info');
                return false;
            } else {
                await db.collection('favorites').add({
                    userId: this.currentUser.uid,
                    chatId: this.currentChatId,
                    messageId: message.id,
                    messageText: message.text || '',
                    messageType: message.type || 'text',
                    addedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                this.showToast('Добавлено в избранное', 'success');
                return true;
            }
        } catch (error) {
            console.error('Error toggling favorite:', error);
            this.showToast('Ошибка', 'error');
            return false;
        }
    }
    
    async toggleFavoriteMessage(messageId) {
        const message = this.messages[this.currentChatId]?.find(m => m.id === messageId);
        if (!message) return;
        const isFavorite = await this.toggleFavorite(message);
        const icon = document.querySelector(`[data-message-id="${messageId}"] .favorite-icon`);
        if (icon) {
            if (isFavorite) icon.className = 'fas fa-star favorite-icon active';
            else icon.className = 'far fa-star favorite-icon';
        }
    }
    
    scrollToMessage(messageId) {
        const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
        if (messageElement) {
            messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            messageElement.classList.add('highlight');
            setTimeout(() => messageElement.classList.remove('highlight'), 2000);
        }
    }
    
    subscribeToChats() {
        if (this.unsubscribeChats) this.unsubscribeChats();
        
        this.unsubscribeChats = db.collection('chats')
            .where('participants', 'array-contains', this.currentUser.uid)
            .onSnapshot((snapshot) => {
                Object.values(this.userPresenceListeners).forEach(unsubscribe => unsubscribe());
                this.userPresenceListeners = {};
                
                this.chats = [];
                snapshot.forEach(doc => {
                    const chat = { id: doc.id, ...doc.data() };
                    this.chats.push(chat);
                    
                    if (chat.type === 'private') {
                        const otherParticipantId = chat.participants.find(id => id !== this.currentUser.uid);
                        if (otherParticipantId && !this.userPresenceListeners[otherParticipantId]) {
                            this.userPresenceListeners[otherParticipantId] = db.collection('presence')
                                .doc(otherParticipantId)
                                .onSnapshot(() => {
                                    if (!this.showingArchive && !this.showingFavorites) this.renderChats();
                                    if (this.currentChatId === chat.id) {
                                        this.updateChatStatus(chat);
                                    }
                                });
                        }
                    }
                });
                
                this.chats.sort((a, b) => {
                    const timeA = a.lastMessageTime ? a.lastMessageTime.toDate() : new Date(0);
                    const timeB = b.lastMessageTime ? b.lastMessageTime.toDate() : new Date(0);
                    return timeB - timeA;
                });
                
                if (this.showingArchive) this.renderArchive();
                else this.renderChats();
                
                if (this.currentChatId) {
                    const currentChat = this.chats.find(c => c.id === this.currentChatId);
                    if (currentChat) {
                        if (currentChat.type === 'private') {
                            this.currentOtherUserId = currentChat.participants.find(id => id !== this.currentUser.uid);
                        } else {
                            this.currentOtherUserId = null;
                        }
                        this.updateChatHeader(currentChat);
                        
                        if (this.pinnedMessage && this.pinnedMessageText) {
                            if (currentChat.pinnedMessage) {
                                this.pinnedMessageText.textContent = currentChat.pinnedMessage.text || 'Сообщение';
                                this.pinnedMessage.style.display = 'flex';
                            } else {
                                this.pinnedMessage.style.display = 'none';
                            }
                        }
                        
                        if (this.archiveChatBtn) {
                            if (this.archivedChats.has(this.currentChatId)) {
                                this.archiveChatBtn.innerHTML = '<i class="fas fa-box-open"></i>';
                                this.archiveChatBtn.title = 'Разархивировать';
                            } else {
                                this.archiveChatBtn.innerHTML = '<i class="fas fa-archive"></i>';
                                this.archiveChatBtn.title = 'Архивировать';
                            }
                        }
                    } else {
                        this.currentChatId = null;
                        this.currentOtherUserId = null;
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
        if (this.unsubscribeMessages) this.unsubscribeMessages();
        
        this.unsubscribeMessages = db.collection('messages')
            .where('chatId', '==', chatId)
            .orderBy('timestamp')
            .onSnapshot((snapshot) => {
                const hadMessages = this.messages[chatId] && this.messages[chatId].length > 0;
                
                this.messages[chatId] = [];
                snapshot.forEach(doc => {
                    this.messages[chatId].push({ id: doc.id, ...doc.data() });
                });
                
                this.renderMessages(this.messages[chatId]);
                this.markMessagesAsRead(chatId);
                
                if (hadMessages && this.notificationsEnabled && document.hidden) {
                    this.playNotificationSound();
                }
            }, (error) => {
                console.error('Error subscribing to messages:', error);
                this.showToast('Ошибка загрузки сообщений', 'error');
            });
        
        db.collection('chats').doc(chatId).collection('typing')
            .doc(this.currentUser.uid)
            .onSnapshot((doc) => {
                if (doc.exists && doc.data().isTyping) this.showTypingIndicator();
                else this.hideTypingIndicator();
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
        snapshot.forEach(doc => batch.update(doc.ref, { read: true }));
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
        if (indicator) indicator.remove();
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
            if (error.code === 'auth/user-not-found') message = 'Пользователь не найден';
            else if (error.code === 'auth/wrong-password') message = 'Неверный пароль';
            else if (error.code === 'auth/invalid-email') message = 'Неверный формат email';
            else if (error.code === 'auth/invalid-login-credentials') message = 'Неверный email или пароль';
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
            const username = await this.generateUniqueUsername(name);
            await db.collection('usernames').doc(username).set({ uid: userCredential.user.uid });
            
            await userCredential.user.updateProfile({ displayName: name });
            
            await db.collection('users').doc(userCredential.user.uid).set({
                email: email,
                displayName: name,
                username: username,
                bio: '',
                avatarColor: this.getRandomColor(name),
                avatarURL: null,
                createdAt: new Date().toISOString()
            });
            
            this.showToast('Регистрация успешна!', 'success');
        } catch (error) {
            console.error('Registration error:', error);
            let message = 'Ошибка регистрации';
            if (error.code === 'auth/email-already-in-use') message = 'Email уже используется';
            else if (error.code === 'auth/invalid-email') message = 'Неверный формат email';
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
            const testEmail = `test_${Date.now()}@alexa.com`;
            const testPassword = '123456';
            const testName = 'Тестовый пользователь';
            
            const userCredential = await auth.createUserWithEmailAndPassword(testEmail, testPassword);
            const username = await this.generateUniqueUsername(testName);
            await db.collection('usernames').doc(username).set({ uid: userCredential.user.uid });
            
            await userCredential.user.updateProfile({ displayName: testName });
            await db.collection('users').doc(userCredential.user.uid).set({
                email: testEmail,
                displayName: testName,
                username: username,
                bio: 'Тестовый аккаунт',
                avatarColor: this.getRandomColor(testName),
                avatarURL: null,
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
                await db.collection('presence').doc(this.currentUser.uid).set({
                    online: false,
                    lastSeen: firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
            }
            
            this.cleanupSubscriptions();
            await auth.signOut();
            this.currentUser = null;
            this.currentUserData = null;
            this.chats = [];
            this.currentChatId = null;
            this.currentOtherUserId = null;
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
            this.settingsUsername.value = this.currentUserData.username || '';
            this.settingsBio.value = this.currentUserData.bio || '';
            this.settingsColor.value = this.currentUserData.avatarColor || '#2AABEE';
            this.showModal('settingsModal');
        }
    }
    
    // ========== СОХРАНЕНИЕ НАСТРОЕК С АВАТАРОМ ЧЕРЕЗ IMGBB ==========
    async saveSettings() {
        const newName = this.settingsName.value.trim();
        const newUsername = this.settingsUsername.value.trim().toLowerCase();
        const newBio = this.settingsBio.value.trim();
        const newColor = this.settingsColor.value;
        const compression = this.settingsCompression.checked;
        const avatarFile = this.settingsAvatar.files[0];
        
        if (!newName) {
            this.showToast('Имя не может быть пустым', 'error');
            return;
        }
        
        if (newUsername) {
            if (!/^[a-z0-9_]{3,20}$/.test(newUsername)) {
                this.showToast('Username должен содержать только латиницу, цифры или _, от 3 до 20 символов', 'error');
                return;
            }
        } else {
            this.showToast('Username не может быть пустым', 'error');
            return;
        }
        
        try {
            if (newUsername !== this.currentUserData.username) {
                const available = await this.isUsernameAvailable(newUsername);
                if (!available) {
                    this.showToast('Этот username уже занят', 'error');
                    return;
                }
                await this.claimUsername(newUsername);
            }
            
            const updateData = {
                displayName: newName,
                bio: newBio,
                avatarColor: newColor
            };
            
            // Загрузка фото на ImgBB
            if (avatarFile) {
                this.showToast('Загрузка фото...', 'info');
                
                const formData = new FormData();
                formData.append('key', '2172d5fee0e315017bad542b495406e0'); // <-- ВСТАВЬТЕ СВОЙ КЛЮЧ!
                formData.append('image', avatarFile);
                
                try {
                    const response = await fetch('https://api.imgbb.com/1/upload', {
                        method: 'POST',
                        body: formData
                    });
                    
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    
                    const result = await response.json();
                    
                    if (result.success) {
                        const avatarURL = result.data.url;
                        console.log('ImgBB upload success:', avatarURL);
                        updateData.avatarURL = avatarURL;
                    } else {
                        throw new Error('ImgBB upload failed');
                    }
                } catch (uploadError) {
                    console.error('ImgBB upload error:', uploadError);
                    this.showToast('Ошибка загрузки фото на сервер', 'error');
                    return;
                }
            }
            
            await db.collection('users').doc(this.currentUser.uid).update(updateData);
            
            if (newName !== this.currentUserData.displayName) {
                await this.currentUser.updateProfile({ displayName: newName });
            }
            
            this.currentUserData.displayName = newName;
            this.currentUserData.bio = newBio;
            this.currentUserData.avatarColor = newColor;
            if (updateData.avatarURL) {
                this.currentUserData.avatarURL = updateData.avatarURL;
            }
            this.compressionEnabled = compression;
            localStorage.setItem('compression', compression);
            
            this.updateUserDisplay();
            this.closeAllModals();
            this.settingsAvatar.value = '';
            this.showToast('Настройки сохранены', 'success');
        } catch (error) {
            console.error('Save settings error:', error);
            this.showToast('Ошибка при сохранении: ' + error.message, 'error');
        }
    }
    
    renderChats() {
        const filter = this.searchInput.value.toLowerCase();
        this.chatsList.innerHTML = '';
        
        const filteredChats = this.chats.filter(chat => 
            !this.archivedChats.has(chat.id) && 
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
    
    async getUserStatus(userId) {
        try {
            const presenceDoc = await db.collection('presence').doc(userId).get();
            if (presenceDoc.exists) {
                const data = presenceDoc.data();
                if (data.online) return { text: 'в сети', color: '#2AABEE', online: true };
                else if (data.lastSeen) {
                    const lastSeen = data.lastSeen.toDate();
                    const now = new Date();
                    const diffMinutes = Math.floor((now - lastSeen) / 60000);
                    let text;
                    if (diffMinutes < 1) text = 'только что';
                    else if (diffMinutes < 60) text = `${diffMinutes} мин назад`;
                    else if (diffMinutes < 1440) text = `${Math.floor(diffMinutes / 60)} ч назад`;
                    else text = lastSeen.toLocaleDateString();
                    return { text, color: '#707579', online: false };
                }
            }
            return { text: '', color: '#707579', online: false };
        } catch (error) {
            console.error('Error getting user status:', error);
            return { text: '', color: '#707579', online: false };
        }
    }
    
    createChatElement(chat, isArchive = false) {
        const div = document.createElement('div');
        div.className = `chat-item ${this.currentChatId === chat.id ? 'active' : ''} ${isArchive ? 'archived' : ''}`;
        if (chat.unreadCount > 0 && chat.lastMessageSender !== this.currentUser?.uid && !isArchive) {
            div.classList.add('unread');
        }
        div.dataset.chatId = chat.id;
        
        const lastMessageTime = chat.lastMessageTime ? chat.lastMessageTime.toDate() : new Date();
        const timeString = this.formatTime(lastMessageTime);
        
        let displayName = chat.name;
        if (chat.type === 'private') {
            displayName = this.getDisplayNameForChat(chat, this.currentUser.uid);
        }
        
        let icon = '';
        if (chat.type === 'channel') icon = '<i class="fas fa-bullhorn" style="margin-right: 5px;"></i>';
        else if (chat.type === 'group') icon = '<i class="fas fa-users" style="margin-right: 5px;"></i>';
        
        const draft = this.loadDraft(chat.id);
        const draftIndicator = draft ? '<span class="draft-indicator"><i class="fas fa-pencil-alt"></i> Черновик</span>' : '';
        
        div.innerHTML = `
            <div class="chat-item-avatar" style="background: ${chat.avatarColor || this.getRandomColor(chat.name)}">${chat.name.charAt(0).toUpperCase()}</div>
            <div class="chat-item-info">
                <div class="chat-item-header">
                    <span class="chat-item-name">${icon}${this.escapeHtml(displayName)}</span>
                    <span class="chat-item-time">${timeString}</span>
                </div>
                <div class="chat-item-last-message">
                    ${draftIndicator ? draftIndicator : (chat.lastMessage ? this.escapeHtml(chat.lastMessage.substring(0, 30)) + (chat.lastMessage.length > 30 ? '...' : '') : 'Нет сообщений')}
                </div>
            </div>
        `;
        
        div.addEventListener('click', () => {
            if (isArchive) {
                this.selectChat(chat.id);
                this.exitArchive();
            } else {
                this.selectChat(chat.id);
            }
        });
        
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
            if (chat.type === 'private') {
                this.currentOtherUserId = chat.participants.find(id => id !== this.currentUser.uid);
            } else {
                this.currentOtherUserId = null;
            }
            
            if (window.innerWidth <= 768) {
                document.querySelector('.sidebar').classList.add('hidden');
            }
            
            this.updateChatHeader(chat);
            this.subscribeToMessages(chatId);
            
            const draft = this.loadDraft(chatId);
            if (draft) {
                this.messageInput.value = draft.text || '';
                this.messageInput.style.height = 'auto';
                this.messageInput.style.height = this.messageInput.scrollHeight + 'px';
                
                if (draft.replyTo) {
                    this.replyToMessage = draft.replyTo;
                    if (this.replyPreview && this.replyPreviewSender && this.replyPreviewText && draft.replyTo) {
                        this.replyPreviewSender.textContent = draft.replyTo.senderName || '';
                        this.replyPreviewText.textContent = draft.replyTo.text || '';
                        this.replyPreview.style.display = 'flex';
                    }
                }
                
                const container = document.querySelector('.message-input-container');
                if (container) {
                    container.classList.add('has-draft');
                }
            }
        }
    }
    
    updateChatHeader(chat) {
        this.chatHeader.style.display = 'flex';
        this.messageInputWrapper.style.display = 'flex';
        this.emptyChat.style.display = 'none';
        
        const avatarText = chat.name.charAt(0).toUpperCase();
        const avatarColor = chat.avatarColor || this.getRandomColor(chat.name);
        
        if (chat.avatarURL) {
            this.renderAvatar(this.chatAvatar, avatarText, avatarColor, chat.avatarURL);
        } else {
            this.chatAvatar.textContent = avatarText;
            this.chatAvatar.style.backgroundColor = avatarColor;
        }
        
        let displayName = chat.name;
        if (chat.type === 'private') {
            displayName = this.getDisplayNameForChat(chat, this.currentUser.uid);
        }
        this.chatName.textContent = displayName;
        
        if (chat.type === 'private') {
            this.chatStatus.style.display = 'block';
            this.updateChatStatus(chat);
            this.chatAvatar.style.cursor = 'pointer';
            this.chatAvatar.onclick = (e) => {
                e.stopPropagation();
                if (this.currentOtherUserId) {
                    this.openProfile(this.currentOtherUserId);
                }
            };
            this.chatName.style.cursor = 'pointer';
            this.chatName.onclick = (e) => {
                e.stopPropagation();
                this.openEditContactModal();
            };
        } else if (chat.type === 'group') {
            this.chatStatus.style.display = 'block';
            this.chatStatus.textContent = `участников: ${chat.participants ? chat.participants.length : 0}`;
            this.chatStatus.style.color = 'var(--text-secondary)';
            this.chatAvatar.style.cursor = 'default';
            this.chatAvatar.onclick = null;
            this.chatName.style.cursor = 'default';
            this.chatName.onclick = null;
        } else if (chat.type === 'channel') {
            this.chatStatus.style.display = 'block';
            this.chatStatus.textContent = `подписчиков: ${chat.subscribers ? chat.subscribers.length : 0}`;
            this.chatStatus.style.color = 'var(--text-secondary)';
            this.chatAvatar.style.cursor = 'default';
            this.chatAvatar.onclick = null;
            this.chatName.style.cursor = 'default';
            this.chatName.onclick = null;
        }
        
        if (chat.type === 'channel') {
            const isSubscribed = chat.subscribers && chat.subscribers.includes(this.currentUser.uid);
            const isOwner = chat.ownerId === this.currentUser.uid;
            this.manageChannelBtn.style.display = isOwner ? 'inline-flex' : 'none';
            this.manageGroupBtn.style.display = 'none';
            if (isOwner) {
                this.subscribeChannelBtn.style.display = 'none';
                this.unsubscribeChannelBtn.style.display = 'none';
            } else {
                if (isSubscribed) {
                    this.subscribeChannelBtn.style.display = 'none';
                    this.unsubscribeChannelBtn.style.display = 'inline-flex';
                } else {
                    this.subscribeChannelBtn.style.display = 'inline-flex';
                    this.unsubscribeChannelBtn.style.display = 'none';
                }
            }
            if (!this.canSendMessage(chat)) {
                this.messageInput.disabled = true;
                this.attachBtn.disabled = true;
                this.sendMessageBtn.disabled = true;
                this.messageInput.placeholder = 'Только чтение';
            } else {
                this.messageInput.disabled = false;
                this.attachBtn.disabled = false;
                this.sendMessageBtn.disabled = false;
                this.messageInput.placeholder = 'Написать сообщение...';
            }
        } else if (chat.type === 'group') {
            this.manageChannelBtn.style.display = 'none';
            this.manageGroupBtn.style.display = 'inline-flex';
            this.subscribeChannelBtn.style.display = 'none';
            this.unsubscribeChannelBtn.style.display = 'none';
            this.messageInput.disabled = false;
            this.attachBtn.disabled = false;
            this.sendMessageBtn.disabled = false;
            this.messageInput.placeholder = 'Написать сообщение...';
        } else {
            this.manageChannelBtn.style.display = 'none';
            this.manageGroupBtn.style.display = 'none';
            this.subscribeChannelBtn.style.display = 'none';
            this.unsubscribeChannelBtn.style.display = 'none';
            this.messageInput.disabled = false;
            this.attachBtn.disabled = false;
            this.sendMessageBtn.disabled = false;
            this.messageInput.placeholder = 'Написать сообщение...';
        }
        
        if (this.archiveChatBtn) {
            if (this.archivedChats.has(chat.id)) {
                this.archiveChatBtn.innerHTML = '<i class="fas fa-box-open"></i>';
                this.archiveChatBtn.title = 'Разархивировать';
            } else {
                this.archiveChatBtn.innerHTML = '<i class="fas fa-archive"></i>';
                this.archiveChatBtn.title = 'Архивировать';
            }
        }
    }
    
    async updateChatStatus(chat) {
        if (chat.type !== 'private') return;
        const otherParticipantId = chat.participants.find(id => id !== this.currentUser.uid);
        if (!otherParticipantId) return;
        if (this.currentStatusListener) {
            this.currentStatusListener();
            this.currentStatusListener = null;
        }
        const presenceRef = db.collection('presence').doc(otherParticipantId);
        this.currentStatusListener = presenceRef.onSnapshot(async (doc) => {
            if (doc.exists) {
                const data = doc.data();
                if (data.online) {
                    this.chatStatus.textContent = 'в сети';
                    this.chatStatus.style.color = '#2AABEE';
                } else if (data.lastSeen) {
                    const lastSeen = data.lastSeen.toDate();
                    const now = new Date();
                    const diffMinutes = Math.floor((now - lastSeen) / 60000);
                    if (diffMinutes < 1) this.chatStatus.textContent = 'был(а) только что';
                    else if (diffMinutes < 60) this.chatStatus.textContent = `был(а) ${diffMinutes} мин назад`;
                    else if (diffMinutes < 1440) this.chatStatus.textContent = `был(а) ${Math.floor(diffMinutes / 60)} ч назад`;
                    else this.chatStatus.textContent = `был(а) ${lastSeen.toLocaleDateString()}`;
                    this.chatStatus.style.color = '#707579';
                }
            } else {
                this.chatStatus.textContent = 'не в сети';
                this.chatStatus.style.color = '#707579';
            }
        }, (error) => {
            console.error('Error in presence listener:', error);
        });
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
                if (messageDate === today) dateText = 'Сегодня';
                else if (messageDate === yesterday) dateText = 'Вчера';
                else dateText = message.timestamp.toDate().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
                dateDiv.innerHTML = `<span>${dateText}</span>`;
                this.messagesContainer.appendChild(dateDiv);
                lastDate = messageDate;
            }
            const messageElement = this.createMessageElement(message);
            this.messagesContainer.appendChild(messageElement);
            
            setTimeout(() => {
                if (message.reactions) {
                    this.renderReactions(message.id, message.reactions);
                }
            }, 0);
        });
        
        this.scrollToBottom();
    }
    
    createMessageElement(message) {
        const div = document.createElement('div');
        div.className = `message ${message.senderId === this.currentUser?.uid ? 'sent' : 'received'}`;
        div.dataset.messageId = message.id;
        
        let time = '';
        if (message.timestamp) {
            time = message.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        
        let replyHtml = '';
        if (message.replyTo) {
            replyHtml = `
                <div class="reply-indicator" onclick="event.stopPropagation(); window.app.scrollToMessage('${message.replyTo.messageId}')">
                    <span class="reply-indicator-sender">${this.escapeHtml(message.replyTo.senderName)}</span>
                    <span class="reply-indicator-text">${this.escapeHtml(message.replyTo.text)}</span>
                </div>
            `;
        }
        
        let content = '';
        if (message.type === 'image') {
            content = `
                <div class="message-content image" onclick="window.open('${message.fileURL}', '_blank')">
                    <!-- Добавлен атрибут loading="lazy" для мобильной оптимизации -->
                    <img src="${message.fileURL}" alt="Image" loading="lazy" style="max-width: 100%; max-height: 400px;">
                </div>
            `;
        } else if (message.type === 'video') {
            content = `
                <div class="message-content video">
                    <video controls style="max-width: 100%; max-height: 400px; border-radius: 12px;">
                        <source src="${message.fileURL}" type="${message.fileType}">
                    </video>
                </div>
            `;
        } else if (message.type === 'file') {
            content = `
                <div class="message-content file" onclick="window.open('${message.fileURL}')">
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
        
        let reactionsHtml = '';
        if (message.reactions && Object.keys(message.reactions).length > 0) {
            reactionsHtml = '<div class="message-reactions"></div>';
        }
        
        let statusIcon = '';
        if (message.senderId === this.currentUser?.uid) {
            if (message.read) statusIcon = '<i class="fas fa-check-double message-status read"></i>';
            else statusIcon = '<i class="fas fa-check message-status"></i>';
        }
        
        const favoriteIcon = '<i class="far fa-star favorite-icon" onclick="event.stopPropagation(); window.app.toggleFavoriteMessage(\'' + message.id + '\')"></i>';
        
        div.innerHTML = `
            ${replyHtml}
            ${content}
            ${reactionsHtml}
            <div class="message-info">
                <span class="message-time">${time}</span>
                ${statusIcon}
                ${favoriteIcon}
            </div>
            <div class="add-reaction-btn" onclick="event.stopPropagation(); window.app.showReactionsPanel('${message.id}', event.clientX, event.clientY)">
                <i class="far fa-smile"></i>
            </div>
        `;
        
        let longPressTimer;
        div.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return;
            longPressTimer = setTimeout(() => {
                this.showContextMenu(message, e.clientX, e.clientY);
            }, 500);
        });
        
        div.addEventListener('mouseup', () => clearTimeout(longPressTimer));
        div.addEventListener('mouseleave', () => clearTimeout(longPressTimer));
        
        div.addEventListener('touchstart', (e) => {
            longPressTimer = setTimeout(() => {
                this.showContextMenu(message, e.touches[0].clientX, e.touches[0].clientY);
            }, 500);
        });
        
        div.addEventListener('touchend', () => clearTimeout(longPressTimer));
        div.addEventListener('touchcancel', () => clearTimeout(longPressTimer));
        
        return div;
    }
    
    showContextMenu(message, x, y) {
        const menu = this.messageContextMenu;
        if (!menu) return;
        
        menu.dataset.messageId = message.id;
        menu.style.left = x + 'px';
        menu.style.top = y + 'px';
        menu.classList.add('show');
        
        const pinItem = document.getElementById('pinMenuItem');
        const chat = this.chats.find(c => c.id === this.currentChatId);
        
        if (chat && chat.pinnedMessage && chat.pinnedMessage.id === message.id) {
            pinItem.textContent = 'Открепить';
        } else {
            pinItem.textContent = 'Закрепить';
        }
        
        const closeMenu = (e) => {
            if (!menu.contains(e.target)) {
                menu.classList.remove('show');
                document.removeEventListener('click', closeMenu);
            }
        };
        
        setTimeout(() => {
            document.addEventListener('click', closeMenu);
        }, 100);
    }
    
    formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
        return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
    }
    
    // ========== ЗАГРУЗКА ФАЙЛОВ (изображения через ImgBB, остальное через Storage) ==========
    async uploadFile(file) {
        if (!this.currentChatId) {
            this.showToast('Выберите чат', 'error');
            return;
        }
        
        const chat = this.chats.find(c => c.id === this.currentChatId);
        if (!this.canSendMessage(chat)) {
            this.showToast('Вы не можете отправлять сообщения в этот канал', 'error');
            return;
        }
        
        if (file.size > this.maxFileSize) {
            this.showToast(`Файл слишком большой. Максимальный размер: ${this.formatFileSize(this.maxFileSize)}`, 'error');
            return;
        }
        
        this.attachBtn.disabled = true;
        
        const isImage = file.type.startsWith('image/');
        const isVideo = file.type.startsWith('video/');
        
        try {
            this.showUploadProgress(file.name);
            
            let fileURL = '';
            let filePath = '';
            let finalFile = file;
            
            if (isImage && this.compressionEnabled && file.size > 1024 * 1024) {
                finalFile = await this.compressImage(file);
            }
            
            if (isImage) {
                // Загружаем изображение на ImgBB
                this.showToast('Загрузка фото на ImgBB...', 'info');
                
                const formData = new FormData();
                formData.append('key', '2172d5fee0e315017bad542b495406e0'); // <-- ВСТАВЬТЕ СВОЙ КЛЮЧ!
                formData.append('image', finalFile);
                
                const response = await fetch('https://api.imgbb.com/1/upload', {
                    method: 'POST',
                    body: formData
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const result = await response.json();
                
                if (!result.success) {
                    throw new Error('ImgBB upload failed');
                }
                
                fileURL = result.data.url;
                console.log('ImgBB upload success:', fileURL);
            } else {
                // Для видео и других файлов используем Firebase Storage (может не работать без платного плана)
                this.showToast('Загрузка в Firebase Storage... (может не работать без платного плана)', 'info');
                
                const timestamp = Date.now();
                const randomString = Math.random().toString(36).substring(2, 15);
                const extension = file.name.split('.').pop();
                const fileName = `${timestamp}_${randomString}.${extension}`;
                filePath = `chats/${this.currentChatId}/${fileName}`;
                const storageRef = storage.ref().child(filePath);
                
                const metadata = {
                    contentType: file.type,
                    customMetadata: {
                        originalName: file.name,
                        uploadedBy: this.currentUser.uid,
                        chatId: this.currentChatId
                    }
                };
                
                const uploadTask = storageRef.put(finalFile, metadata);
                this.uploadTasks.set(filePath, uploadTask);
                
                await new Promise((resolve, reject) => {
                    uploadTask.on('state_changed',
                        (snapshot) => {
                            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                            this.updateUploadProgress(progress);
                        },
                        (error) => {
                            reject(error);
                        },
                        async () => {
                            try {
                                fileURL = await storageRef.getDownloadURL();
                                resolve();
                            } catch (error) {
                                reject(error);
                            }
                        }
                    );
                });
                
                this.uploadTasks.delete(filePath);
            }
            
            // Создаём сообщение
            const message = {
                type: isImage ? 'image' : (isVideo ? 'video' : 'file'),
                text: isImage ? '📷 Фото' : (isVideo ? '🎥 Видео' : '📎 Файл'),
                fileURL: fileURL,
                filePath: filePath || null,
                fileName: file.name,
                fileSize: file.size,
                fileType: file.type,
                senderId: this.currentUser.uid,
                senderName: this.currentUserData.displayName,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                chatId: this.currentChatId,
                read: false
            };
            
            if (this.replyToMessage) {
                message.replyTo = {
                    messageId: this.replyToMessage.id,
                    text: this.replyToMessage.text,
                    senderName: this.replyToMessage.senderName
                };
            }
            
            await db.collection('messages').add(message);
            await db.collection('chats').doc(this.currentChatId).update({
                lastMessage: message.text,
                lastMessageTime: firebase.firestore.FieldValue.serverTimestamp(),
                lastMessageSender: this.currentUser.uid
            });
            
            this.cancelReply();
            this.clearDraft(this.currentChatId);
            this.hideUploadProgress();
            this.attachBtn.disabled = false;
            this.showToast('Файл отправлен', 'success');
            
            // Плавный скролл вниз после отправки файла
            setTimeout(() => this.scrollToBottom(), 100);
            
        } catch (error) {
            console.error('Upload error:', error);
            this.hideUploadProgress();
            this.attachBtn.disabled = false;
            this.showToast('Ошибка загрузки: ' + error.message, 'error');
        }
        
        this.fileInput.value = '';
    }
    
    compressImage(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (e) => {
                const img = new Image();
                img.src = e.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    const MAX_WIDTH = 1920;
                    const MAX_HEIGHT = 1080;
                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    canvas.toBlob((blob) => {
                        if (blob) {
                            const compressedFile = new File([blob], file.name, {
                                type: file.type,
                                lastModified: Date.now()
                            });
                            resolve(compressedFile);
                        } else {
                            resolve(file);
                        }
                    }, file.type, 0.8);
                };
                img.onerror = reject;
            };
            reader.onerror = reject;
        });
    }
    
    showUploadProgress(filename) {
        if (this.uploadProgress) {
            this.uploadProgressFilename.textContent = `Загрузка: ${filename}`;
            this.uploadProgress.classList.add('show');
            this.currentUploadPath = filename;
        }
    }
    
    updateUploadProgress(percent) {
        if (this.uploadProgressBar && this.uploadProgressText) {
            const roundedPercent = Math.round(percent);
            this.uploadProgressBar.style.width = roundedPercent + '%';
            this.uploadProgressText.textContent = roundedPercent + '%';
        }
    }
    
    hideUploadProgress() {
        if (this.uploadProgress) {
            this.uploadProgress.classList.remove('show');
            this.uploadProgressBar.style.width = '0%';
            this.uploadProgressText.textContent = '0%';
        }
    }
    
    cancelCurrentUpload() {
        if (this.currentUploadPath && this.uploadTasks.has(this.currentUploadPath)) {
            const uploadTask = this.uploadTasks.get(this.currentUploadPath);
            uploadTask.cancel();
            this.uploadTasks.delete(this.currentUploadPath);
            this.hideUploadProgress();
            this.attachBtn.disabled = false;
            this.showToast('Загрузка отменена', 'info');
        }
    }
    
    async sendMessage() {
        const text = this.messageInput.value.trim();
        if (!text && !this.replyToMessage || !this.currentChatId) return;
        
        const chat = this.chats.find(c => c.id === this.currentChatId);
        if (!this.canSendMessage(chat)) {
            this.showToast('Вы не можете отправлять сообщения в этот канал', 'error');
            return;
        }
        
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
            
            if (this.replyToMessage) {
                message.replyTo = {
                    messageId: this.replyToMessage.id,
                    text: this.replyToMessage.text,
                    senderName: this.replyToMessage.senderName
                };
            }
            
            await db.collection('messages').add(message);
            
            await db.collection('chats').doc(this.currentChatId).update({
                lastMessage: text,
                lastMessageTime: firebase.firestore.FieldValue.serverTimestamp(),
                lastMessageSender: this.currentUser.uid
            });
            
            this.messageInput.value = '';
            this.messageInput.style.height = 'auto';
            this.cancelReply();
            this.clearDraft(this.currentChatId);
            
            // Плавный скролл вниз после отправки (для мобильных)
            setTimeout(() => this.scrollToBottom(), 100);
            
        } catch (error) {
            console.error('Error sending message:', error);
            this.showToast('Ошибка при отправке', 'error');
        }
    }
    
    async deleteCurrentChat() {
        if (!this.currentChatId) return;
        
        const chat = this.chats.find(c => c.id === this.currentChatId);
        if (chat && chat.type === 'channel' && chat.ownerId !== this.currentUser.uid) {
            this.showToast('Только владелец может удалить канал', 'error');
            return;
        }
        if (chat && chat.type === 'group' && chat.ownerId !== this.currentUser.uid) {
            this.showToast('Только владелец может удалить группу', 'error');
            return;
        }
        
        if (confirm('Удалить чат? Все сообщения будут удалены.')) {
            try {
                if (this.unsubscribeMessages) {
                    this.unsubscribeMessages();
                    this.unsubscribeMessages = null;
                }
                if (this.currentStatusListener) {
                    this.currentStatusListener();
                    this.currentStatusListener = null;
                }
                const messagesRef = db.collection('messages').where('chatId', '==', this.currentChatId);
                const snapshot = await messagesRef.get();
                const batch = db.batch();
                snapshot.forEach(doc => batch.delete(doc.ref));
                batch.delete(db.collection('chats').doc(this.currentChatId));
                await batch.commit();
                this.currentChatId = null;
                this.currentOtherUserId = null;
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
    
    async deleteMessage(messageId) {
        if (!confirm('Удалить сообщение?')) return;
        
        try {
            await db.collection('messages').doc(messageId).delete();
            this.showToast('Сообщение удалено', 'success');
        } catch (error) {
            console.error('Error deleting message:', error);
            this.showToast('Ошибка при удалении', 'error');
        }
    }
    
    async createNewChat() {
        const input = this.newChatEmail.value.trim();
        const name = this.newChatName.value.trim();
        
        if (!input || !name) {
            this.showToast('Заполните все поля', 'error');
            return;
        }
        
        if (input === this.currentUser.email || input === '@' + this.currentUserData.username) {
            this.showToast('Нельзя создать чат с самим собой', 'error');
            return;
        }
        
        try {
            const usersRef = db.collection('users');
            let query;
            if (input.startsWith('@')) {
                const username = input.substring(1);
                query = usersRef.where('username', '==', username).limit(1);
            } else {
                query = usersRef.where('email', '==', input).limit(1);
            }
            
            const snapshot = await query.get();
            
            if (snapshot.empty) {
                this.showToast('Пользователь не найден', 'error');
                return;
            }
            
            const otherUser = snapshot.docs[0];
            const otherUserData = otherUser.data();
            const otherUserName = otherUserData.displayName || otherUserData.email.split('@')[0];
            
            const chatsRef = db.collection('chats').where('participants', 'array-contains', this.currentUser.uid);
            const existingChats = await chatsRef.get();
            
            let chatExists = false;
            existingChats.forEach(doc => {
                const chat = doc.data();
                if (chat.participants && chat.participants.includes(otherUser.id) && chat.type === 'private') {
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
                unreadCount: 0,
                customNames: {
                    [this.currentUser.uid]: name,
                    [otherUser.id]: otherUserName
                }
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
        if (this.showingArchive) this.renderArchive();
        else this.renderChats();
    }
    
    showModal(modalId) {
        document.getElementById(modalId).classList.add('show');
    }
    
    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => modal.classList.remove('show'));
        this.showingFavorites = false;
        this.newGroupMembers = [];
        if (this.membersPreview) this.membersPreview.innerHTML = '';
    }
    
    scrollToBottom() {
        setTimeout(() => {
            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        }, 100);
    }
    
    showToast(message, type = 'info') {
        this.toast.textContent = message;
        this.toast.className = `toast show ${type}`;
        setTimeout(() => this.toast.classList.remove('show'), 3000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new AlexaApp();
});// script.js - ПОЛНАЯ ВЕРСИЯ с группами, каналами, username, локальными именами, профилями
// + НОВЫЕ ФУНКЦИИ: реакции, закрепленные, ответы, черновики
// + ЗАГРУЗКА АВАТАРОВ И ИЗОБРАЖЕНИЙ ЧЕРЕЗ IMGBB (без Firebase Storage)

const firebaseConfig = {
    apiKey: "AIzaSyAj_Mh359ecv87XPV1ygtzQPWg2lsKyvzw",
    authDomain: "alexa-62aaf.firebaseapp.com",
    projectId: "alexa-62aaf",
    storageBucket: "alexa-62aaf.firebasestorage.app",
    messagingSenderId: "233934948868",
    appId: "1:233934948868:web:c503a5062e19b02a910351",
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

db.settings({ ignoreUndefinedProperties: true }, { merge: true });

class AlexaApp {
    constructor() {
        this.currentUser = null;
        this.currentUserData = null;
        this.currentChatId = null;
        this.currentOtherUserId = null;
        this.chats = [];
        this.messages = {};
        this.unsubscribeChats = null;
        this.unsubscribeMessages = null;
        this.typingTimeout = null;
        this.isTyping = false;
        this.notificationsEnabled = false;
        this.theme = 'light';
        
        this.userPresenceListeners = {};
        this.currentStatusListener = null;
        
        this.archivedChats = new Set();
        this.showingArchive = false;
        this.showingFavorites = false;
        this.favorites = [];
        
        this.uploadTasks = new Map();
        this.compressionEnabled = true;
        this.maxFileSize = 100 * 1024 * 1024;
        
        this.replyToMessage = null;
        this.newGroupMembers = [];
        
        this.init();
    }
    
    init() {
        this.initElements();
        this.initEventListeners();
        this.initNewEventListeners();
        this.checkAuthState();
        this.loadSettings();
        
        setTimeout(() => {
            document.getElementById('loadingScreen').classList.add('hidden');
        }, 1000);
    }
    
    initElements() {
        this.loadingScreen = document.getElementById('loadingScreen');
        this.authPage = document.getElementById('authPage');
        this.appPage = document.getElementById('appPage');
        
        this.loginTab = document.getElementById('loginTab');
        this.registerTab = document.getElementById('registerTab');
        this.loginForm = document.getElementById('loginForm');
        this.registerForm = document.getElementById('registerForm');
        this.resetForm = document.getElementById('resetForm');
        
        this.loginEmail = document.getElementById('loginEmail');
        this.loginPassword = document.getElementById('loginPassword');
        
        this.registerName = document.getElementById('registerName');
        this.registerEmail = document.getElementById('registerEmail');
        this.registerPassword = document.getElementById('registerPassword');
        this.registerConfirmPassword = document.getElementById('registerConfirmPassword');
        
        this.resetEmail = document.getElementById('resetEmail');
        
        this.loginBtn = document.getElementById('loginBtn');
        this.registerBtn = document.getElementById('registerBtn');
        this.testAuthBtn = document.getElementById('testAuthBtn');
        this.forgotPasswordBtn = document.getElementById('forgotPasswordBtn');
        this.backFromResetBtn = document.getElementById('backFromResetBtn');
        this.resetPasswordBtn = document.getElementById('resetPasswordBtn');
        
        this.profileAvatar = document.getElementById('profileAvatar');
        this.profileAvatarText = document.getElementById('profileAvatarText');
        this.profileName = document.getElementById('profileName');
        this.profileEmail = document.getElementById('profileEmail');
        this.settingsBtn = document.getElementById('settingsBtn');
        
        this.menuButton = document.getElementById('menuButton');
        this.userMenu = document.getElementById('userMenu');
        this.menuAvatar = document.getElementById('menuAvatar');
        this.menuName = document.getElementById('menuName');
        this.menuEmail = document.getElementById('menuEmail');
        this.menuSettings = document.getElementById('menuSettings');
        this.menuTheme = document.getElementById('menuTheme');
        this.menuLogout = document.getElementById('menuLogout');
        
        this.menuCreateGroup = document.getElementById('menuCreateGroup');
        this.menuCreateChannel = document.getElementById('menuCreateChannel');
        this.menuArchive = document.getElementById('menuArchive');
        this.menuFavorites = document.getElementById('menuFavorites');
        
        this.chatsList = document.getElementById('chatsList');
        this.searchInput = document.getElementById('searchInput');
        this.addChatBtn = document.getElementById('addChatBtn');
        
        this.chatHeader = document.getElementById('chatHeader');
        this.chatAvatar = document.getElementById('chatAvatar');
        this.chatName = document.getElementById('chatName');
        this.chatStatus = document.getElementById('chatStatus');
        this.pinnedMessage = document.getElementById('pinnedMessage');
        this.pinnedMessageText = document.getElementById('pinnedMessageText');
        this.messagesContainer = document.getElementById('messagesContainer');
        this.messageInputWrapper = document.getElementById('messageInputWrapper');
        this.messageInput = document.getElementById('messageInput');
        this.sendMessageBtn = document.getElementById('sendMessageBtn');
        this.deleteChatBtn = document.getElementById('deleteChatBtn');
        this.emptyChat = document.getElementById('emptyChat');
        this.backToChatsBtn = document.getElementById('backToChatsBtn');
        
        this.manageChannelBtn = document.getElementById('manageChannelBtn');
        this.manageGroupBtn = document.getElementById('manageGroupBtn');
        this.subscribeChannelBtn = document.getElementById('subscribeChannelBtn');
        this.unsubscribeChannelBtn = document.getElementById('unsubscribeChannelBtn');
        this.archiveChatBtn = document.getElementById('archiveChatBtn');
        
        this.attachBtn = document.getElementById('attachBtn');
        this.fileInput = document.getElementById('fileInput');
        
        this.emojiBtn = document.getElementById('emojiBtn');
        this.emojiPanel = document.getElementById('emojiPanel');
        
        this.newChatModal = document.getElementById('newChatModal');
        this.settingsModal = document.getElementById('settingsModal');
        this.favoritesModal = document.getElementById('favoritesModal');
        this.editContactModal = document.getElementById('editContactModal');
        this.createChannelModal = document.getElementById('createChannelModal');
        this.manageChannelModal = document.getElementById('manageChannelModal');
        this.createGroupModal = document.getElementById('createGroupModal');
        this.manageGroupModal = document.getElementById('manageGroupModal');
        this.profileModal = document.getElementById('profileModal');
        
        this.closeModalBtns = document.querySelectorAll('.close-modal');
        
        this.favoritesList = document.getElementById('favoritesList');
        
        this.editContactName = document.getElementById('editContactName');
        this.saveContactNameBtn = document.getElementById('saveContactNameBtn');
        
        this.settingsName = document.getElementById('settingsName');
        this.settingsUsername = document.getElementById('settingsUsername');
        this.settingsBio = document.getElementById('settingsBio');
        this.settingsColor = document.getElementById('settingsColor');
        this.settingsAvatar = document.getElementById('settingsAvatar');
        this.settingsCompression = document.getElementById('settingsCompression');
        this.saveSettingsBtn = document.getElementById('saveSettingsBtn');
        
        this.newChatEmail = document.getElementById('newChatEmail');
        this.newChatName = document.getElementById('newChatName');
        this.createChatBtn = document.getElementById('createChatBtn');
        
        this.channelName = document.getElementById('channelName');
        this.channelDescription = document.getElementById('channelDescription');
        this.channelAvatar = document.getElementById('channelAvatar');
        this.createChannelBtn = document.getElementById('createChannelBtn');
        
        this.manageChannelName = document.getElementById('manageChannelName');
        this.manageChannelDescription = document.getElementById('manageChannelDescription');
        this.manageChannelAvatar = document.getElementById('manageChannelAvatar');
        this.addSubscriberInput = document.getElementById('addSubscriberInput');
        this.addSubscriberBtn = document.getElementById('addSubscriberBtn');
        this.subscribersList = document.getElementById('subscribersList');
        this.subscriberCount = document.getElementById('subscriberCount');
        this.saveChannelSettingsBtn = document.getElementById('saveChannelSettingsBtn');
        this.deleteChannelBtn = document.getElementById('deleteChannelBtn');
        
        this.groupName = document.getElementById('groupName');
        this.groupDescription = document.getElementById('groupDescription');
        this.groupAvatar = document.getElementById('groupAvatar');
        this.addMemberInput = document.getElementById('addMemberInput');
        this.addMemberBtn = document.getElementById('addMemberBtn');
        this.membersPreview = document.getElementById('membersPreview');
        this.createGroupBtn = document.getElementById('createGroupBtn');
        
        this.manageGroupName = document.getElementById('manageGroupName');
        this.manageGroupDescription = document.getElementById('manageGroupDescription');
        this.manageGroupAvatar = document.getElementById('manageGroupAvatar');
        this.membersList = document.getElementById('membersList');
        this.memberCount = document.getElementById('memberCount');
        this.addGroupMemberInput = document.getElementById('addGroupMemberInput');
        this.addGroupMemberBtn = document.getElementById('addGroupMemberBtn');
        this.saveGroupSettingsBtn = document.getElementById('saveGroupSettingsBtn');
        this.deleteGroupBtn = document.getElementById('deleteGroupBtn');
        this.leaveGroupBtn = document.getElementById('leaveGroupBtn');
        
        this.profileViewAvatar = document.getElementById('profileViewAvatar');
        this.profileViewName = document.getElementById('profileViewName');
        this.profileViewUsername = document.getElementById('profileViewUsername');
        this.profileViewBio = document.getElementById('profileViewBio');
        this.profileSendMessageBtn = document.getElementById('profileSendMessageBtn');
        
        this.notificationSound = document.getElementById('notificationSound');
        this.toast = document.getElementById('toast');
        
        this.archiveHeader = document.getElementById('archiveHeader');
        this.backFromArchiveBtn = document.getElementById('backFromArchiveBtn');
        this.archiveHeaderTitle = document.getElementById('archiveHeaderTitle');
        
        this.replyPreview = document.getElementById('replyPreview');
        this.replyPreviewSender = document.getElementById('replyPreviewSender');
        this.replyPreviewText = document.getElementById('replyPreviewText');
        this.cancelReplyBtn = document.getElementById('cancelReplyBtn');
        this.messageContextMenu = document.getElementById('messageContextMenu');
        this.reactionsPanel = document.getElementById('reactionsPanel');
        
        this.createUploadProgressElement();
    }
    
    initNewEventListeners() {
        document.getElementById('contextReply').addEventListener('click', () => {
            const messageId = this.messageContextMenu.dataset.messageId;
            const message = this.messages[this.currentChatId]?.find(m => m.id === messageId);
            if (message) {
                this.setReplyTo(message);
            }
            this.messageContextMenu.classList.remove('show');
        });
        
        document.getElementById('contextPin').addEventListener('click', () => {
            const messageId = this.messageContextMenu.dataset.messageId;
            const chat = this.chats.find(c => c.id === this.currentChatId);
            if (chat && chat.pinnedMessage && chat.pinnedMessage.id === messageId) {
                this.unpinMessage();
            } else {
                this.pinMessage(messageId);
            }
            this.messageContextMenu.classList.remove('show');
        });
        
        document.getElementById('contextFavorite').addEventListener('click', () => {
            const messageId = this.messageContextMenu.dataset.messageId;
            this.toggleFavoriteMessage(messageId);
            this.messageContextMenu.classList.remove('show');
        });
        
        document.getElementById('contextCopy').addEventListener('click', () => {
            const messageId = this.messageContextMenu.dataset.messageId;
            const message = this.messages[this.currentChatId]?.find(m => m.id === messageId);
            if (message && message.text) {
                navigator.clipboard.writeText(message.text);
                this.showToast('Скопировано', 'success');
            }
            this.messageContextMenu.classList.remove('show');
        });
        
        document.getElementById('contextDelete').addEventListener('click', () => {
            const messageId = this.messageContextMenu.dataset.messageId;
            this.deleteMessage(messageId);
            this.messageContextMenu.classList.remove('show');
        });
        
        document.querySelectorAll('.reaction-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const reaction = btn.dataset.reaction;
                const messageId = this.reactionsPanel.dataset.messageId;
                this.addReaction(messageId, reaction);
                this.reactionsPanel.classList.remove('show');
            });
        });
        
        if (this.cancelReplyBtn) {
            this.cancelReplyBtn.addEventListener('click', () => {
                this.cancelReply();
            });
        }
        
        if (this.pinnedMessage) {
            this.pinnedMessage.addEventListener('click', () => {
                this.scrollToPinnedMessage();
            });
        }
        
        if (this.messageInput) {
            this.messageInput.addEventListener('input', () => {
                this.handleTyping();
                this.saveDraft(this.currentChatId, this.messageInput.value);
            });
        }
    }
    
    // ========== МЕТОДЫ ДЛЯ USERNAME ==========
    async generateUniqueUsername(baseName) {
        const translitMap = {
            'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'e','ж':'zh','з':'z','и':'i','й':'y',
            'к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f',
            'х':'h','ц':'c','ч':'ch','ш':'sh','щ':'sch','ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya'
        };
        const translit = (str) => {
            return str.toLowerCase().split('').map(c => translitMap[c] || c).join('').replace(/[^a-z0-9]/g, '');
        };
        let username = translit(baseName);
        if (!username || username.length < 3) username = 'user';
        let candidate = username;
        let counter = 1;
        while (true) {
            const doc = await db.collection('usernames').doc(candidate).get();
            if (!doc.exists) break;
            candidate = `${username}${counter}`;
            counter++;
        }
        return candidate;
    }

    async isUsernameAvailable(username) {
        const doc = await db.collection('usernames').doc(username).get();
        return !doc.exists;
    }

    async claimUsername(newUsername) {
        if (!this.currentUser) throw new Error('No user');
        if (this.currentUserData.username) {
            await db.collection('usernames').doc(this.currentUserData.username).delete();
        }
        await db.collection('usernames').doc(newUsername).set({ uid: this.currentUser.uid });
        await db.collection('users').doc(this.currentUser.uid).update({ username: newUsername });
        this.currentUserData.username = newUsername;
        this.updateUserDisplay();
    }

    // ========== МЕТОДЫ ДЛЯ ЛОКАЛЬНЫХ ИМЁН ==========
    getDisplayNameForChat(chat, forUserId) {
        if (!chat || !chat.participants) return '';
        const otherId = chat.participants.find(id => id !== forUserId);
        if (chat.customNames && chat.customNames[otherId]) {
            return chat.customNames[otherId];
        }
        return chat.name || 'Безымянный';
    }

    getLocalContactName(userId) {
        const chat = this.chats.find(c => c.id === this.currentChatId);
        if (chat && chat.customNames && chat.customNames[userId]) {
            return chat.customNames[userId];
        }
        return '';
    }

    async saveContactName() {
        const newName = this.editContactName.value.trim();
        if (!newName || !this.currentChatId || !this.currentOtherUserId) {
            this.showToast('Введите имя', 'error');
            return;
        }
        try {
            const chatRef = db.collection('chats').doc(this.currentChatId);
            await chatRef.update({
                [`customNames.${this.currentOtherUserId}`]: newName
            });
            const chat = this.chats.find(c => c.id === this.currentChatId);
            if (chat) {
                if (!chat.customNames) chat.customNames = {};
                chat.customNames[this.currentOtherUserId] = newName;
            }
            this.updateChatHeader(chat);
            this.renderChats();
            this.closeAllModals();
            this.showToast('Имя сохранено', 'success');
        } catch (error) {
            console.error('Error saving contact name:', error);
            this.showToast('Ошибка', 'error');
        }
    }

    openEditContactModal() {
        if (!this.currentChatId || !this.currentOtherUserId) return;
        const currentName = this.getLocalContactName(this.currentOtherUserId);
        this.editContactName.value = currentName;
        this.showModal('editContactModal');
    }
    
    // ========== МЕТОДЫ ДЛЯ КАНАЛОВ ==========
    async createChannel() {
        const name = this.channelName.value.trim();
        const description = this.channelDescription.value.trim();
        const avatarFile = this.channelAvatar.files[0];
        if (!name) {
            this.showToast('Введите название канала', 'error');
            return;
        }
        try {
            const channelData = {
                name: name,
                description: description,
                type: 'channel',
                ownerId: this.currentUser.uid,
                participants: [this.currentUser.uid],
                subscribers: [this.currentUser.uid],
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastMessageTime: firebase.firestore.FieldValue.serverTimestamp(),
                lastMessage: 'Канал создан',
                avatarColor: this.getRandomColor(name),
                unreadCount: 0
            };
            const channelRef = await db.collection('chats').add(channelData);
            const channelId = channelRef.id;
            if (avatarFile) {
                const storagePath = `channels/${channelId}/avatar.jpg`;
                const storageRef = storage.ref().child(storagePath);
                await storageRef.put(avatarFile);
                const avatarURL = await storageRef.getDownloadURL();
                await channelRef.update({ avatarURL });
            }
            this.closeAllModals();
            this.channelName.value = '';
            this.channelDescription.value = '';
            this.channelAvatar.value = '';
            this.showToast('Канал создан!', 'success');
            this.selectChat(channelId);
        } catch (error) {
            console.error('Error creating channel:', error);
            this.showToast('Ошибка при создании канала', 'error');
        }
    }
    
    async subscribeToChannel() {
        if (!this.currentChatId || !this.currentUser) return;
        try {
            const chatRef = db.collection('chats').doc(this.currentChatId);
            await chatRef.update({
                subscribers: firebase.firestore.FieldValue.arrayUnion(this.currentUser.uid),
                participants: firebase.firestore.FieldValue.arrayUnion(this.currentUser.uid)
            });
            this.showToast('Вы подписались на канал', 'success');
        } catch (error) {
            console.error('Error subscribing:', error);
            this.showToast('Ошибка подписки', 'error');
        }
    }
    
    async unsubscribeFromChannel() {
        if (!this.currentChatId || !this.currentUser) return;
        try {
            const chatRef = db.collection('chats').doc(this.currentChatId);
            await chatRef.update({
                subscribers: firebase.firestore.FieldValue.arrayRemove(this.currentUser.uid),
                participants: firebase.firestore.FieldValue.arrayRemove(this.currentUser.uid)
            });
            this.showToast('Вы отписались от канала', 'info');
        } catch (error) {
            console.error('Error unsubscribing:', error);
            this.showToast('Ошибка отписки', 'error');
        }
    }
    
    canSendMessage(chat) {
        if (!chat) return false;
        if (chat.type === 'private') return true;
        if (chat.type === 'channel') return chat.ownerId === this.currentUser.uid;
        if (chat.type === 'group') return true;
        return false;
    }
    
    // ========== МЕТОДЫ ДЛЯ ГРУПП ==========
    async addMemberToNewGroup() {
        const input = this.addMemberInput.value.trim();
        if (!input) return;
        try {
            const usersRef = db.collection('users');
            let query;
            if (input.startsWith('@')) {
                const username = input.substring(1);
                query = usersRef.where('username', '==', username).limit(1);
            } else {
                query = usersRef.where('email', '==', input).limit(1);
            }
            const snapshot = await query.get();
            if (snapshot.empty) {
                this.showToast('Пользователь не найден', 'error');
                return;
            }
            const user = snapshot.docs[0];
            const uid = user.id;
            const userData = user.data();
            if (uid === this.currentUser.uid) {
                this.showToast('Нельзя добавить себя', 'error');
                return;
            }
            if (this.newGroupMembers.some(m => m.uid === uid)) {
                this.showToast('Пользователь уже в списке', 'info');
                return;
            }
            this.newGroupMembers.push({
                uid: uid,
                name: userData.displayName || userData.email.split('@')[0],
                username: userData.username
            });
            this.renderMembersPreview();
            this.addMemberInput.value = '';
        } catch (error) {
            console.error('Error adding member:', error);
            this.showToast('Ошибка при добавлении', 'error');
        }
    }
    
    renderMembersPreview() {
        if (!this.membersPreview) return;
        if (this.newGroupMembers.length === 0) {
            this.membersPreview.innerHTML = '<small>Пока никого не добавили</small>';
            return;
        }
        let html = '<div style="display: flex; flex-wrap: wrap; gap: 8px;">';
        this.newGroupMembers.forEach(member => {
            html += `
                <div class="member-tag">
                    <span>${this.escapeHtml(member.name)}</span>
                    <button class="remove-member" data-uid="${member.uid}">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
        });
        html += '</div>';
        this.membersPreview.innerHTML = html;
        this.membersPreview.querySelectorAll('.remove-member').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const uid = btn.dataset.uid;
                this.newGroupMembers = this.newGroupMembers.filter(m => m.uid !== uid);
                this.renderMembersPreview();
            });
        });
    }
    
    async createGroup() {
        const name = this.groupName.value.trim();
        const description = this.groupDescription.value.trim();
        const avatarFile = this.groupAvatar.files[0];
        if (!name) {
            this.showToast('Введите название группы', 'error');
            return;
        }
        const participants = [this.currentUser.uid, ...this.newGroupMembers.map(m => m.uid)];
        const admins = [this.currentUser.uid];
        try {
            const groupData = {
                name: name,
                description: description,
                type: 'group',
                ownerId: this.currentUser.uid,
                participants: participants,
                admins: admins,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastMessageTime: firebase.firestore.FieldValue.serverTimestamp(),
                lastMessage: 'Группа создана',
                avatarColor: this.getRandomColor(name),
                unreadCount: 0
            };
            const groupRef = await db.collection('chats').add(groupData);
            const groupId = groupRef.id;
            if (avatarFile) {
                const storagePath = `groups/${groupId}/avatar.jpg`;
                const storageRef = storage.ref().child(storagePath);
                await storageRef.put(avatarFile);
                const avatarURL = await storageRef.getDownloadURL();
                await groupRef.update({ avatarURL });
            }
            this.newGroupMembers = [];
            this.closeAllModals();
            this.groupName.value = '';
            this.groupDescription.value = '';
            this.groupAvatar.value = '';
            this.membersPreview.innerHTML = '';
            this.showToast('Группа создана!', 'success');
            this.selectChat(groupId);
        } catch (error) {
            console.error('Error creating group:', error);
            this.showToast('Ошибка при создании группы', 'error');
        }
    }
    
    async openManageGroupModal() {
        if (!this.currentChatId) return;
        const chat = this.chats.find(c => c.id === this.currentChatId);
        if (!chat || chat.type !== 'group') return;
        this.manageGroupName.value = chat.name || '';
        this.manageGroupDescription.value = chat.description || '';
        this.manageGroupAvatar.value = '';
        await this.renderMembersList(chat.participants || [], chat.admins || []);
        const isAdmin = chat.admins && chat.admins.includes(this.currentUser.uid);
        const isOwner = chat.ownerId === this.currentUser.uid;
        if (!isAdmin) {
            this.manageGroupName.disabled = true;
            this.manageGroupDescription.disabled = true;
            this.manageGroupAvatar.disabled = true;
            this.saveGroupSettingsBtn.style.display = 'none';
            this.addGroupMemberInput.style.display = 'none';
            this.addGroupMemberBtn.style.display = 'none';
        } else {
            this.manageGroupName.disabled = false;
            this.manageGroupDescription.disabled = false;
            this.manageGroupAvatar.disabled = false;
            this.saveGroupSettingsBtn.style.display = 'flex';
            this.addGroupMemberInput.style.display = 'block';
            this.addGroupMemberBtn.style.display = 'inline-flex';
        }
        this.deleteGroupBtn.style.display = isOwner ? 'flex' : 'none';
        this.leaveGroupBtn.style.display = isOwner ? 'none' : 'flex';
        this.showModal('manageGroupModal');
    }
    
    async renderMembersList(participantIds, adminIds = []) {
        if (!this.membersList) return;
        this.memberCount.textContent = participantIds.length;
        if (participantIds.length === 0) {
            this.membersList.innerHTML = '<p class="empty-list">Нет участников</p>';
            return;
        }
        const usersData = {};
        const promises = participantIds.map(async (uid) => {
            if (uid === this.currentUser.uid) {
                usersData[uid] = { displayName: this.currentUserData.displayName, username: this.currentUserData.username };
            } else {
                try {
                    const userDoc = await db.collection('users').doc(uid).get();
                    if (userDoc.exists) {
                        usersData[uid] = userDoc.data();
                    }
                } catch (e) {
                    console.error('Error loading user', uid, e);
                }
            }
        });
        await Promise.all(promises);
        let html = '';
        participantIds.forEach(uid => {
            const user = usersData[uid] || { displayName: 'Неизвестно', username: '' };
            const displayName = user.displayName || 'Пользователь';
            const username = user.username ? '@' + user.username : '';
            const isAdmin = adminIds.includes(uid) ? ' (админ)' : '';
            const isOwner = uid === this.manageGroupOwnerId;
            const canManage = adminIds.includes(this.currentUser.uid);
            html += `
                <div class="member-item" data-uid="${uid}">
                    <div class="member-info">
                        <span class="member-name clickable" data-uid="${uid}">${this.escapeHtml(displayName)}${isAdmin}${isOwner ? ' (владелец)' : ''}</span>
                        <span class="member-username">${this.escapeHtml(username)}</span>
                    </div>
                    ${canManage && uid !== this.currentUser.uid ? `
                        <div class="member-actions">
                            ${!adminIds.includes(uid) ? `<button class="make-admin-btn" title="Сделать администратором"><i class="fas fa-crown"></i></button>` : ''}
                            ${adminIds.includes(uid) && uid !== this.manageGroupOwnerId ? `<button class="remove-admin-btn" title="Убрать администратора"><i class="fas fa-user-minus"></i></button>` : ''}
                            <button class="remove-member-btn" title="Удалить из группы"><i class="fas fa-times"></i></button>
                        </div>
                    ` : ''}
                </div>
            `;
        });
        this.membersList.innerHTML = html;
        this.membersList.querySelectorAll('.member-name.clickable').forEach(el => {
            el.addEventListener('click', (e) => {
                e.stopPropagation();
                const uid = el.dataset.uid;
                if (uid && uid !== this.currentUser.uid) {
                    this.openProfile(uid);
                } else if (uid === this.currentUser.uid) {
                    this.showToast('Это вы', 'info');
                }
            });
        });
        if (adminIds.includes(this.currentUser.uid)) {
            this.membersList.querySelectorAll('.make-admin-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    const memberItem = btn.closest('.member-item');
                    const uid = memberItem.dataset.uid;
                    await this.toggleAdmin(uid, true);
                });
            });
            this.membersList.querySelectorAll('.remove-admin-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    const memberItem = btn.closest('.member-item');
                    const uid = memberItem.dataset.uid;
                    await this.toggleAdmin(uid, false);
                });
            });
            this.membersList.querySelectorAll('.remove-member-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    const memberItem = btn.closest('.member-item');
                    const uid = memberItem.dataset.uid;
                    if (confirm(`Удалить пользователя из группы?`)) {
                        await this.removeGroupMember(uid);
                    }
                });
            });
        }
    }
    
    async toggleAdmin(uid, makeAdmin) {
        if (!this.currentChatId) return;
        try {
            const chatRef = db.collection('chats').doc(this.currentChatId);
            if (makeAdmin) {
                await chatRef.update({
                    admins: firebase.firestore.FieldValue.arrayUnion(uid)
                });
                this.showToast('Администратор назначен', 'success');
            } else {
                await chatRef.update({
                    admins: firebase.firestore.FieldValue.arrayRemove(uid)
                });
                this.showToast('Администратор снят', 'info');
            }
            const chat = this.chats.find(c => c.id === this.currentChatId);
            await this.renderMembersList(chat.participants, chat.admins);
        } catch (error) {
            console.error('Error toggling admin:', error);
            this.showToast('Ошибка', 'error');
        }
    }
    
    async removeGroupMember(uid) {
        if (!this.currentChatId) return;
        try {
            const chatRef = db.collection('chats').doc(this.currentChatId);
            await chatRef.update({
                participants: firebase.firestore.FieldValue.arrayRemove(uid),
                admins: firebase.firestore.FieldValue.arrayRemove(uid)
            });
            this.showToast('Участник удалён', 'success');
            const chat = this.chats.find(c => c.id === this.currentChatId);
            await this.renderMembersList(chat.participants, chat.admins);
        } catch (error) {
            console.error('Error removing member:', error);
            this.showToast('Ошибка при удалении', 'error');
        }
    }
    
    async addGroupMember() {
        const input = this.addGroupMemberInput.value.trim();
        if (!input) return;
        try {
            const usersRef = db.collection('users');
            let query;
            if (input.startsWith('@')) {
                const username = input.substring(1);
                query = usersRef.where('username', '==', username).limit(1);
            } else {
                query = usersRef.where('email', '==', input).limit(1);
            }
            const snapshot = await query.get();
            if (snapshot.empty) {
                this.showToast('Пользователь не найден', 'error');
                return;
            }
            const user = snapshot.docs[0];
            const uid = user.id;
            const chat = this.chats.find(c => c.id === this.currentChatId);
            if (chat.participants && chat.participants.includes(uid)) {
                this.showToast('Пользователь уже в группе', 'info');
                return;
            }
            const chatRef = db.collection('chats').doc(this.currentChatId);
            await chatRef.update({
                participants: firebase.firestore.FieldValue.arrayUnion(uid)
            });
            this.showToast('Участник добавлен', 'success');
            this.addGroupMemberInput.value = '';
            await this.renderMembersList([...chat.participants, uid], chat.admins);
        } catch (error) {
            console.error('Error adding member:', error);
            this.showToast('Ошибка при добавлении', 'error');
        }
    }
    
    async saveGroupSettings() {
        const newName = this.manageGroupName.value.trim();
        const newDescription = this.manageGroupDescription.value.trim();
        const avatarFile = this.manageGroupAvatar.files[0];
        if (!newName) {
            this.showToast('Название не может быть пустым', 'error');
            return;
        }
        try {
            const updateData = {
                name: newName,
                description: newDescription
            };
            if (avatarFile) {
                const storagePath = `groups/${this.currentChatId}/avatar.jpg`;
                const storageRef = storage.ref().child(storagePath);
                await storageRef.put(avatarFile);
                const avatarURL = await storageRef.getDownloadURL();
                updateData.avatarURL = avatarURL;
            }
            await db.collection('chats').doc(this.currentChatId).update(updateData);
            this.showToast('Настройки сохранены', 'success');
            this.closeAllModals();
            const chat = this.chats.find(c => c.id === this.currentChatId);
            if (chat) {
                chat.name = newName;
                chat.description = newDescription;
                if (updateData.avatarURL) chat.avatarURL = updateData.avatarURL;
                this.updateChatHeader(chat);
                this.renderChats();
            }
        } catch (error) {
            console.error('Error saving group settings:', error);
            this.showToast('Ошибка при сохранении', 'error');
        }
    }
    
    async leaveGroup() {
        if (!this.currentChatId) return;
        const chat = this.chats.find(c => c.id === this.currentChatId);
        if (chat.ownerId === this.currentUser.uid) {
            this.showToast('Владелец не может покинуть группу. Сначала передайте права или удалите группу.', 'error');
            return;
        }
        if (confirm('Вы уверены, что хотите покинуть группу?')) {
            try {
                const chatRef = db.collection('chats').doc(this.currentChatId);
                await chatRef.update({
                    participants: firebase.firestore.FieldValue.arrayRemove(this.currentUser.uid),
                    admins: firebase.firestore.FieldValue.arrayRemove(this.currentUser.uid)
                });
                this.closeAllModals();
                this.showToast('Вы покинули группу', 'info');
                this.currentChatId = null;
                this.currentOtherUserId = null;
                this.chatHeader.style.display = 'none';
                this.messageInputWrapper.style.display = 'none';
                this.emptyChat.style.display = 'flex';
            } catch (error) {
                console.error('Error leaving group:', error);
                this.showToast('Ошибка при выходе', 'error');
            }
        }
    }
    
    // ========== МЕТОДЫ ДЛЯ ПРОФИЛЯ ==========
    async openProfile(userId) {
        if (!userId) return;
        if (userId === this.currentUser.uid) {
            this.showToast('Это ваш профиль', 'info');
            return;
        }
        try {
            const userData = await this.loadUserProfileData(userId);
            if (!userData) {
                this.showToast('Пользователь не найден', 'error');
                return;
            }
            this.renderProfile(userId, userData);
            this.showModal('profileModal');
        } catch (error) {
            console.error('Error loading profile:', error);
            this.showToast('Ошибка загрузки профиля', 'error');
        }
    }
    
    async loadUserProfileData(userId) {
        try {
            const userDoc = await db.collection('users').doc(userId).get();
            if (!userDoc.exists) return null;
            return userDoc.data();
        } catch (error) {
            console.error('Error loading user data:', error);
            return null;
        }
    }
    
    renderProfile(userId, userData) {
        const avatarText = userData.displayName ? userData.displayName.charAt(0).toUpperCase() : '?';
        const avatarColor = userData.avatarColor || this.getRandomColor(userData.displayName || '');
        this.renderAvatar(this.profileViewAvatar, avatarText, avatarColor, userData.avatarURL);
        this.profileViewName.textContent = userData.displayName || 'Без имени';
        this.profileViewUsername.textContent = userData.username ? '@' + userData.username : '';
        this.profileViewBio.textContent = userData.bio || 'Нет информации';
        this.profileSendMessageBtn.dataset.userId = userId;
    }
    
    async startChatFromProfile(userId) {
        if (!userId) return;
        const existingChat = this.chats.find(chat => 
            chat.type === 'private' && 
            chat.participants.includes(userId)
        );
        if (existingChat) {
            this.closeAllModals();
            this.selectChat(existingChat.id);
            return;
        }
        try {
            const userData = await this.loadUserProfileData(userId);
            const userName = userData.displayName || 'Пользователь';
            const newChat = {
                name: userName,
                participants: [this.currentUser.uid, userId],
                type: 'private',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastMessageTime: firebase.firestore.FieldValue.serverTimestamp(),
                lastMessage: 'Чат создан',
                avatarColor: this.getRandomColor(userName),
                unreadCount: 0,
                customNames: {
                    [this.currentUser.uid]: userName,
                    [userId]: this.currentUserData.displayName
                }
            };
            const chatRef = await db.collection('chats').add(newChat);
            this.closeAllModals();
            this.showToast('Чат создан!', 'success');
            this.selectChat(chatRef.id);
        } catch (error) {
            console.error('Error creating chat from profile:', error);
            this.showToast('Ошибка при создании чата', 'error');
        }
    }
    
    // ========== МЕТОДЫ ДЛЯ СТАТУСОВ ==========
    async setUserOnline() {
        if (!this.currentUser) return;
        const userRef = db.collection('presence').doc(this.currentUser.uid);
        const updateStatus = async (online) => {
            try {
                await userRef.set({
                    online: online,
                    lastSeen: firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
            } catch (error) {
                console.error('Error updating status:', error);
            }
        };
        await updateStatus(true);
        window.addEventListener('beforeunload', () => {
            const data = {
                fields: {
                    online: { booleanValue: false },
                    lastSeen: { timestampValue: new Date().toISOString() }
                }
            };
            navigator.sendBeacon(
                `https://firestore.googleapis.com/v1/projects/${firebase.app().options.projectId}/databases/(default)/documents/presence/${this.currentUser.uid}`,
                JSON.stringify(data)
            );
        });
        document.addEventListener('visibilitychange', () => {
            updateStatus(!document.hidden);
        });
        setInterval(() => {
            if (this.currentUser && !document.hidden) {
                updateStatus(true);
            }
        }, 30000);
    }
    
    // ========== НОВЫЕ МЕТОДЫ: РЕАКЦИИ ==========
    async addReaction(messageId, reaction) {
        if (!this.currentUser || !this.currentChatId) return;
        try {
            const messageRef = db.collection('messages').doc(messageId);
            const messageDoc = await messageRef.get();
            if (!messageDoc.exists) return;
            const message = messageDoc.data();
            const reactions = message.reactions || {};
            const users = reactions[reaction] || [];
            if (users.includes(this.currentUser.uid)) {
                const newUsers = users.filter(uid => uid !== this.currentUser.uid);
                if (newUsers.length === 0) {
                    delete reactions[reaction];
                } else {
                    reactions[reaction] = newUsers;
                }
            } else {
                reactions[reaction] = [...users, this.currentUser.uid];
            }
            await messageRef.update({ reactions });
        } catch (error) {
            console.error('Error adding reaction:', error);
        }
    }
    
    renderReactions(messageId, reactions = {}) {
        const container = document.querySelector(`[data-message-id="${messageId}"] .message-reactions`);
        if (!container) return;
        container.innerHTML = '';
        const sortedReactions = Object.entries(reactions).sort((a, b) => b[1].length - a[1].length);
        sortedReactions.forEach(([reaction, users]) => {
            if (users.length === 0) return;
            const badge = document.createElement('span');
            badge.className = `reaction-badge ${users.includes(this.currentUser?.uid) ? 'active' : ''}`;
            badge.dataset.reaction = reaction;
            badge.dataset.messageId = messageId;
            badge.innerHTML = `${reaction} <span class="reaction-count">${users.length}</span>`;
            badge.addEventListener('click', (e) => {
                e.stopPropagation();
                this.addReaction(messageId, reaction);
            });
            container.appendChild(badge);
        });
    }
    
    showReactionsPanel(messageId, x, y) {
        const panel = this.reactionsPanel;
        if (!panel) return;
        panel.dataset.messageId = messageId;
        panel.style.left = x + 'px';
        panel.style.top = y + 'px';
        panel.classList.add('show');
        const closePanel = (e) => {
            if (!panel.contains(e.target) && !e.target.closest('.add-reaction-btn')) {
                panel.classList.remove('show');
                document.removeEventListener('click', closePanel);
            }
        };
        setTimeout(() => {
            document.addEventListener('click', closePanel);
        }, 100);
    }
    
    // ========== НОВЫЕ МЕТОДЫ: ЗАКРЕПЛЕННЫЕ СООБЩЕНИЯ ==========
    async pinMessage(messageId) {
        if (!this.currentChatId || !this.currentUser) return;
        const chat = this.chats.find(c => c.id === this.currentChatId);
        if (chat.type === 'channel' && chat.ownerId !== this.currentUser.uid) {
            this.showToast('Только владелец канала может закрепить сообщение', 'error');
            return;
        }
        if (chat.type === 'group' && !(chat.admins && chat.admins.includes(this.currentUser.uid))) {
            this.showToast('Только администраторы могут закрепить сообщение', 'error');
            return;
        }
        try {
            const messageDoc = await db.collection('messages').doc(messageId).get();
            if (!messageDoc.exists) return;
            const message = messageDoc.data();
            await db.collection('chats').doc(this.currentChatId).update({
                pinnedMessage: {
                    id: messageId,
                    text: message.text || (message.type === 'file' ? 'Файл' : 'Сообщение'),
                    senderId: message.senderId,
                    timestamp: message.timestamp
                }
            });
            this.showToast('Сообщение закреплено', 'success');
        } catch (error) {
            console.error('Error pinning message:', error);
            this.showToast('Ошибка при закреплении', 'error');
        }
    }
    
    async unpinMessage() {
        if (!this.currentChatId) return;
        try {
            await db.collection('chats').doc(this.currentChatId).update({
                pinnedMessage: firebase.firestore.FieldValue.delete()
            });
            this.showToast('Сообщение откреплено', 'info');
        } catch (error) {
            console.error('Error unpinning message:', error);
            this.showToast('Ошибка при откреплении', 'error');
        }
    }
    
    scrollToPinnedMessage() {
        const chat = this.chats.find(c => c.id === this.currentChatId);
        if (chat && chat.pinnedMessage) {
            this.scrollToMessage(chat.pinnedMessage.id);
        }
    }
    
    // ========== НОВЫЕ МЕТОДЫ: ОТВЕТЫ НА СООБЩЕНИЯ ==========
    setReplyTo(message) {
        this.replyToMessage = {
            id: message.id,
            text: message.text || (message.type === 'file' ? message.fileName : 'Сообщение'),
            senderName: message.senderName,
            type: message.type
        };
        if (this.replyPreview && this.replyPreviewSender && this.replyPreviewText) {
            this.replyPreviewSender.textContent = message.senderName;
            this.replyPreviewText.textContent = this.replyToMessage.text;
            this.replyPreview.style.display = 'flex';
        }
        this.messageInput.focus();
    }
    
    cancelReply() {
        this.replyToMessage = null;
        if (this.replyPreview) {
            this.replyPreview.style.display = 'none';
        }
    }
    
    // ========== НОВЫЕ МЕТОДЫ: ЧЕРНОВИКИ ==========
    saveDraft(chatId, text) {
        if (!chatId || !this.currentUser) return;
        try {
            const drafts = JSON.parse(localStorage.getItem('drafts') || '{}');
            if (text.trim()) {
                drafts[chatId] = {
                    text: text,
                    timestamp: Date.now(),
                    replyTo: this.replyToMessage
                };
            } else {
                delete drafts[chatId];
            }
            localStorage.setItem('drafts', JSON.stringify(drafts));
            const container = document.querySelector('.message-input-container');
            if (container) {
                if (text.trim()) {
                    container.classList.add('has-draft');
                } else {
                    container.classList.remove('has-draft');
                }
            }
        } catch (error) {
            console.error('Error saving draft:', error);
        }
    }
    
    loadDraft(chatId) {
        if (!chatId) return null;
        try {
            const drafts = JSON.parse(localStorage.getItem('drafts') || '{}');
            const draft = drafts[chatId];
            if (draft) {
                if (Date.now() - draft.timestamp > 7 * 24 * 60 * 60 * 1000) {
                    delete drafts[chatId];
                    localStorage.setItem('drafts', JSON.stringify(drafts));
                    return null;
                }
                return draft;
            }
        } catch (error) {
            console.error('Error loading draft:', error);
        }
        return null;
    }
    
    clearDraft(chatId) {
        if (!chatId) return;
        try {
            const drafts = JSON.parse(localStorage.getItem('drafts') || '{}');
            delete drafts[chatId];
            localStorage.setItem('drafts', JSON.stringify(drafts));
            const container = document.querySelector('.message-input-container');
            if (container) {
                container.classList.remove('has-draft');
            }
        } catch (error) {
            console.error('Error clearing draft:', error);
        }
    }
    
    // ========== ОСТАЛЬНЫЕ МЕТОДЫ ==========
    createUploadProgressElement() {
        if (!document.getElementById('uploadProgress')) {
            const progressHTML = `
                <div class="upload-progress" id="uploadProgress">
                    <div class="progress-header">
                        <span class="progress-filename">Загрузка...</span>
                        <button class="cancel-upload" id="cancelUploadBtn">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="progress-bar-container">
                        <div class="progress-bar" id="uploadProgressBar" style="width: 0%"></div>
                    </div>
                    <div class="progress-text" id="uploadProgressText">0%</div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', progressHTML);
            this.uploadProgress = document.getElementById('uploadProgress');
            this.uploadProgressBar = document.getElementById('uploadProgressBar');
            this.uploadProgressText = document.getElementById('uploadProgressText');
            this.uploadProgressFilename = document.querySelector('.progress-filename');
            this.cancelUploadBtn = document.getElementById('cancelUploadBtn');
            if (this.cancelUploadBtn) {
                this.cancelUploadBtn.addEventListener('click', () => this.cancelCurrentUpload());
            }
        }
    }
    
    renderAvatar(container, text, color, url) {
        if (url) {
            const img = document.createElement('img');
            img.src = url;
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'cover';
            img.onerror = () => {
                container.innerHTML = `<span>${this.escapeHtml(text)}</span>`;
                container.style.background = color;
            };
            container.innerHTML = '';
            container.appendChild(img);
            container.style.background = 'transparent';
        } else {
            container.innerHTML = `<span>${this.escapeHtml(text)}</span>`;
            container.style.background = color;
        }
    }
    
    initEventListeners() {
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
        
        this.loginBtn.addEventListener('click', () => this.login());
        this.loginPassword.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.login();
        });
        
        this.registerBtn.addEventListener('click', () => this.register());
        this.testAuthBtn.addEventListener('click', () => this.testAuth());
        
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
        
        this.menuCreateGroup.addEventListener('click', () => {
            this.userMenu.classList.remove('show');
            this.newGroupMembers = [];
            this.renderMembersPreview();
            this.showModal('createGroupModal');
        });
        
        this.menuCreateChannel.addEventListener('click', () => {
            this.userMenu.classList.remove('show');
            this.showModal('createChannelModal');
        });
        
        this.menuArchive.addEventListener('click', () => {
            this.userMenu.classList.remove('show');
            this.toggleArchive();
        });
        
        this.menuFavorites.addEventListener('click', () => {
            this.userMenu.classList.remove('show');
            this.showFavorites();
        });
        
        this.settingsBtn.addEventListener('click', () => this.openSettings());
        this.saveSettingsBtn.addEventListener('click', () => this.saveSettings());
        
        this.addChatBtn.addEventListener('click', () => this.showModal('newChatModal'));
        this.createChatBtn.addEventListener('click', () => this.createNewChat());
        
        this.searchInput.addEventListener('input', () => this.filterChats());
        
        this.sendMessageBtn.addEventListener('click', () => this.sendMessage());
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        this.messageInput.addEventListener('input', () => {
            this.handleTyping();
        });
        
        this.deleteChatBtn.addEventListener('click', () => this.deleteCurrentChat());
        this.archiveChatBtn.addEventListener('click', () => this.toggleArchiveChat());
        
        this.manageChannelBtn.addEventListener('click', () => this.openManageChannelModal());
        this.manageGroupBtn.addEventListener('click', () => this.openManageGroupModal());
        this.subscribeChannelBtn.addEventListener('click', () => this.subscribeToChannel());
        this.unsubscribeChannelBtn.addEventListener('click', () => this.unsubscribeFromChannel());
        
        this.backToChatsBtn.addEventListener('click', () => {
            document.querySelector('.sidebar').classList.remove('hidden');
        });
        
        if (this.backFromArchiveBtn) {
            this.backFromArchiveBtn.addEventListener('click', () => {
                this.exitArchive();
            });
        }
        
        this.chatName.addEventListener('click', () => {
            if (this.currentChatId && this.currentOtherUserId) {
                this.openEditContactModal();
            }
        });

        this.saveContactNameBtn.addEventListener('click', () => this.saveContactName());
        
        this.attachBtn.addEventListener('click', () => {
            this.fileInput.click();
        });
        
        this.fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.uploadFile(e.target.files[0]);
            }
        });
        
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
        
        this.closeModalBtns.forEach(btn => {
            btn.addEventListener('click', () => this.closeAllModals());
        });
        
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeAllModals();
            }
        });
        
        this.createChannelBtn.addEventListener('click', () => this.createChannel());
        
        this.addSubscriberBtn.addEventListener('click', () => this.addSubscriber());
        this.saveChannelSettingsBtn.addEventListener('click', () => this.saveChannelSettings());
      
        if (this.addMemberBtn) {
            this.addMemberBtn.addEventListener('click', () => this.addMemberToNewGroup());
        }
        if (this.createGroupBtn) {
            this.createGroupBtn.addEventListener('click', () => this.createGroup());
        }
        if (this.addGroupMemberBtn) {
            this.addGroupMemberBtn.addEventListener('click', () => this.addGroupMember());
        }
        if (this.saveGroupSettingsBtn) {
            this.saveGroupSettingsBtn.addEventListener('click', () => this.saveGroupSettings());
        }
        if (this.deleteGroupBtn) {
            this.deleteGroupBtn.addEventListener('click', () => this.deleteCurrentChat());
        }
        if (this.leaveGroupBtn) {
            this.leaveGroupBtn.addEventListener('click', () => this.leaveGroup());
        }
        
        if (this.profileSendMessageBtn) {
            this.profileSendMessageBtn.addEventListener('click', () => {
                const userId = this.profileSendMessageBtn.dataset.userId;
                if (userId) {
                    this.startChatFromProfile(userId);
                }
            });
        }
        
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
        const compression = localStorage.getItem('compression');
        if (compression !== null) {
            this.compressionEnabled = compression === 'true';
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
                this.loadArchivedChats();
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
        if (this.currentStatusListener) {
            this.currentStatusListener();
            this.currentStatusListener = null;
        }
        Object.values(this.userPresenceListeners).forEach(unsubscribe => {
            if (unsubscribe) unsubscribe();
        });
        this.userPresenceListeners = {};
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
                    username: userData.username || null,
                    bio: userData.bio || '',
                    avatarColor: userData.avatarColor || '#2AABEE',
                    avatarURL: userData.avatarURL || null,
                    email: this.currentUser.email
                };
            } else {
                const displayName = this.currentUser.email.split('@')[0];
                const username = await this.generateUniqueUsername(displayName);
                await db.collection('usernames').doc(username).set({ uid: this.currentUser.uid });
                await db.collection('users').doc(this.currentUser.uid).set({
                    email: this.currentUser.email,
                    displayName: displayName,
                    username: username,
                    bio: '',
                    avatarColor: '#2AABEE',
                    avatarURL: null,
                    createdAt: new Date().toISOString()
                });
                await this.currentUser.updateProfile({
                    displayName: displayName
                });
                this.currentUserData = {
                    displayName: displayName,
                    username: username,
                    bio: '',
                    avatarColor: '#2AABEE',
                    avatarURL: null,
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
        const avatarURL = this.currentUserData.avatarURL;
        const color = this.currentUserData.avatarColor || '#2AABEE';
        this.renderAvatar(this.profileAvatar, avatarText, color, avatarURL);
        this.renderAvatar(this.menuAvatar, avatarText, color, avatarURL);
        this.profileName.textContent = displayName;
        this.profileEmail.textContent = this.currentUserData.username 
            ? '@' + this.currentUserData.username 
            : this.currentUserData.email;
        this.menuName.textContent = displayName;
        this.menuEmail.textContent = this.currentUserData.username 
            ? '@' + this.currentUserData.username 
            : this.currentUserData.email;
    }
    
    // ========== АРХИВ ==========
    async loadArchivedChats() {
        if (!this.currentUser) return;
        try {
            const userDoc = await db.collection('users').doc(this.currentUser.uid).get();
            if (userDoc.exists && userDoc.data().archivedChats) {
                this.archivedChats = new Set(userDoc.data().archivedChats);
            } else {
                this.archivedChats = new Set();
            }
        } catch (error) {
            console.error('Error loading archived chats:', error);
        }
    }
    
    async saveArchivedChats() {
        if (!this.currentUser) return;
        try {
            await db.collection('users').doc(this.currentUser.uid).set({
                archivedChats: Array.from(this.archivedChats)
            }, { merge: true });
        } catch (error) {
            console.error('Error saving archived chats:', error);
        }
    }
    
    async toggleArchiveChat() {
        if (!this.currentChatId) return;
        if (this.archivedChats.has(this.currentChatId)) {
            this.archivedChats.delete(this.currentChatId);
            this.showToast('Чат разархивирован', 'success');
            this.archiveChatBtn.innerHTML = '<i class="fas fa-archive"></i>';
            this.archiveChatBtn.title = 'Архивировать';
        } else {
            this.archivedChats.add(this.currentChatId);
            this.showToast('Чат архивирован', 'success');
            this.archiveChatBtn.innerHTML = '<i class="fas fa-box-open"></i>';
            this.archiveChatBtn.title = 'Разархивировать';
        }
        await this.saveArchivedChats();
        this.renderChats();
    }
    
    toggleArchive() {
        if (this.showingArchive) this.exitArchive();
        else this.enterArchive();
    }
    
    enterArchive() {
        this.showingArchive = true;
        this.showingFavorites = false;
        if (this.archiveHeader) this.archiveHeader.style.display = 'flex';
        document.querySelector('.search-box').style.display = 'none';
        this.renderArchive();
    }
    
    exitArchive() {
        this.showingArchive = false;
        if (this.archiveHeader) this.archiveHeader.style.display = 'none';
        document.querySelector('.search-box').style.display = 'block';
        this.renderChats();
    }
    
    renderArchive() {
        this.chatsList.innerHTML = '';
        const archivedChatsList = this.chats.filter(chat => this.archivedChats.has(chat.id));
        if (archivedChatsList.length === 0) {
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'empty-archive';
            emptyDiv.innerHTML = `
                <i class="fas fa-archive"></i>
                <p>В архиве нет чатов</p>
                <small>Чтобы архивировать чат, откройте его и нажмите кнопку архивации</small>
            `;
            this.chatsList.appendChild(emptyDiv);
            return;
        }
        archivedChatsList.sort((a, b) => {
            const timeA = a.lastMessageTime ? a.lastMessageTime.toDate() : new Date(0);
            const timeB = b.lastMessageTime ? b.lastMessageTime.toDate() : new Date(0);
            return timeB - timeA;
        });
        archivedChatsList.forEach(chat => {
            const chatElement = this.createChatElement(chat, true);
            this.chatsList.appendChild(chatElement);
        });
    }
    
    // ========== ИЗБРАННОЕ ==========
    async showFavorites() {
        this.showingFavorites = true;
        await this.loadFavorites();
        this.showModal('favoritesModal');
    }
    
    async loadFavorites() {
        if (!this.currentUser) return;
        try {
            const snapshot = await db.collection('favorites')
                .where('userId', '==', this.currentUser.uid)
                .orderBy('addedAt', 'desc')
                .get();
            this.favorites = [];
            for (const doc of snapshot.docs) {
                const favorite = { id: doc.id, ...doc.data() };
                const chatDoc = await db.collection('chats').doc(favorite.chatId).get();
                if (chatDoc.exists) favorite.chatName = chatDoc.data().name;
                this.favorites.push(favorite);
            }
            this.renderFavorites();
        } catch (error) {
            console.error('Error loading favorites:', error);
            this.showToast('Ошибка загрузки избранного', 'error');
        }
    }
    
    renderFavorites() {
        if (!this.favoritesList) return;
        this.favoritesList.innerHTML = '';
        if (this.favorites.length === 0) {
            this.favoritesList.innerHTML = `
                <div class="empty-favorites">
                    <i class="fas fa-star"></i>
                    <p>Нет избранных сообщений</p>
                    <small>Нажмите на звездочку у сообщения, чтобы добавить его в избранное</small>
                </div>
            `;
            return;
        }
        this.favorites.forEach(fav => {
            const item = document.createElement('div');
            item.className = 'favorite-item';
            item.dataset.chatId = fav.chatId;
            item.dataset.messageId = fav.messageId;
            const avatarText = fav.chatName ? fav.chatName.charAt(0).toUpperCase() : '?';
            const time = fav.addedAt ? fav.addedAt.toDate().toLocaleString() : '';
            let messageContent = '';
            if (fav.messageType === 'image') {
                messageContent = '<i class="fas fa-image"></i> Фото';
            } else if (fav.messageType === 'file') {
                messageContent = '<i class="fas fa-file"></i> Файл';
            } else if (fav.messageType === 'video') {
                messageContent = '<i class="fas fa-video"></i> Видео';
            } else {
                messageContent = this.escapeHtml(fav.messageText || 'Сообщение');
            }
            item.innerHTML = `
                <div class="favorite-item-avatar">${this.escapeHtml(avatarText)}</div>
                <div class="favorite-item-content">
                    <div class="favorite-item-header">
                        <span class="favorite-item-chat">${this.escapeHtml(fav.chatName || 'Чат')}</span>
                        <span class="favorite-item-time">${this.escapeHtml(time)}</span>
                    </div>
                    <div class="favorite-item-message ${fav.messageType === 'file' || fav.messageType === 'image' || fav.messageType === 'video' ? 'file-message' : ''}">
                        ${messageContent}
                    </div>
                </div>
            `;
            item.addEventListener('click', () => {
                this.closeAllModals();
                this.selectChat(fav.chatId);
                setTimeout(() => {
                    this.scrollToMessage(fav.messageId);
                }, 500);
            });
            this.favoritesList.appendChild(item);
        });
    }
    
    async toggleFavorite(message) {
        if (!this.currentUser) return;
        try {
            const snapshot = await db.collection('favorites')
                .where('userId', '==', this.currentUser.uid)
                .where('messageId', '==', message.id)
                .get();
            if (!snapshot.empty) {
                await snapshot.docs[0].ref.delete();
                this.showToast('Удалено из избранного', 'info');
                return false;
            } else {
                await db.collection('favorites').add({
                    userId: this.currentUser.uid,
                    chatId: this.currentChatId,
                    messageId: message.id,
                    messageText: message.text || '',
                    messageType: message.type || 'text',
                    addedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                this.showToast('Добавлено в избранное', 'success');
                return true;
            }
        } catch (error) {
            console.error('Error toggling favorite:', error);
            this.showToast('Ошибка', 'error');
            return false;
        }
    }
    
    async toggleFavoriteMessage(messageId) {
        const message = this.messages[this.currentChatId]?.find(m => m.id === messageId);
        if (!message) return;
        const isFavorite = await this.toggleFavorite(message);
        const icon = document.querySelector(`[data-message-id="${messageId}"] .favorite-icon`);
        if (icon) {
            if (isFavorite) icon.className = 'fas fa-star favorite-icon active';
            else icon.className = 'far fa-star favorite-icon';
        }
    }
    
    scrollToMessage(messageId) {
        const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
        if (messageElement) {
            messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            messageElement.classList.add('highlight');
            setTimeout(() => messageElement.classList.remove('highlight'), 2000);
        }
    }
    
    subscribeToChats() {
        if (this.unsubscribeChats) this.unsubscribeChats();
        
        this.unsubscribeChats = db.collection('chats')
            .where('participants', 'array-contains', this.currentUser.uid)
            .onSnapshot((snapshot) => {
                Object.values(this.userPresenceListeners).forEach(unsubscribe => unsubscribe());
                this.userPresenceListeners = {};
                
                this.chats = [];
                snapshot.forEach(doc => {
                    const chat = { id: doc.id, ...doc.data() };
                    this.chats.push(chat);
                    
                    if (chat.type === 'private') {
                        const otherParticipantId = chat.participants.find(id => id !== this.currentUser.uid);
                        if (otherParticipantId && !this.userPresenceListeners[otherParticipantId]) {
                            this.userPresenceListeners[otherParticipantId] = db.collection('presence')
                                .doc(otherParticipantId)
                                .onSnapshot(() => {
                                    if (!this.showingArchive && !this.showingFavorites) this.renderChats();
                                    if (this.currentChatId === chat.id) {
                                        this.updateChatStatus(chat);
                                    }
                                });
                        }
                    }
                });
                
                this.chats.sort((a, b) => {
                    const timeA = a.lastMessageTime ? a.lastMessageTime.toDate() : new Date(0);
                    const timeB = b.lastMessageTime ? b.lastMessageTime.toDate() : new Date(0);
                    return timeB - timeA;
                });
                
                if (this.showingArchive) this.renderArchive();
                else this.renderChats();
                
                if (this.currentChatId) {
                    const currentChat = this.chats.find(c => c.id === this.currentChatId);
                    if (currentChat) {
                        if (currentChat.type === 'private') {
                            this.currentOtherUserId = currentChat.participants.find(id => id !== this.currentUser.uid);
                        } else {
                            this.currentOtherUserId = null;
                        }
                        this.updateChatHeader(currentChat);
                        
                        if (this.pinnedMessage && this.pinnedMessageText) {
                            if (currentChat.pinnedMessage) {
                                this.pinnedMessageText.textContent = currentChat.pinnedMessage.text || 'Сообщение';
                                this.pinnedMessage.style.display = 'flex';
                            } else {
                                this.pinnedMessage.style.display = 'none';
                            }
                        }
                        
                        if (this.archiveChatBtn) {
                            if (this.archivedChats.has(this.currentChatId)) {
                                this.archiveChatBtn.innerHTML = '<i class="fas fa-box-open"></i>';
                                this.archiveChatBtn.title = 'Разархивировать';
                            } else {
                                this.archiveChatBtn.innerHTML = '<i class="fas fa-archive"></i>';
                                this.archiveChatBtn.title = 'Архивировать';
                            }
                        }
                    } else {
                        this.currentChatId = null;
                        this.currentOtherUserId = null;
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
        if (this.unsubscribeMessages) this.unsubscribeMessages();
        
        this.unsubscribeMessages = db.collection('messages')
            .where('chatId', '==', chatId)
            .orderBy('timestamp')
            .onSnapshot((snapshot) => {
                const hadMessages = this.messages[chatId] && this.messages[chatId].length > 0;
                
                this.messages[chatId] = [];
                snapshot.forEach(doc => {
                    this.messages[chatId].push({ id: doc.id, ...doc.data() });
                });
                
                this.renderMessages(this.messages[chatId]);
                this.markMessagesAsRead(chatId);
                
                if (hadMessages && this.notificationsEnabled && document.hidden) {
                    this.playNotificationSound();
                }
            }, (error) => {
                console.error('Error subscribing to messages:', error);
                this.showToast('Ошибка загрузки сообщений', 'error');
            });
        
        db.collection('chats').doc(chatId).collection('typing')
            .doc(this.currentUser.uid)
            .onSnapshot((doc) => {
                if (doc.exists && doc.data().isTyping) this.showTypingIndicator();
                else this.hideTypingIndicator();
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
        snapshot.forEach(doc => batch.update(doc.ref, { read: true }));
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
        if (indicator) indicator.remove();
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
            if (error.code === 'auth/user-not-found') message = 'Пользователь не найден';
            else if (error.code === 'auth/wrong-password') message = 'Неверный пароль';
            else if (error.code === 'auth/invalid-email') message = 'Неверный формат email';
            else if (error.code === 'auth/invalid-login-credentials') message = 'Неверный email или пароль';
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
            const username = await this.generateUniqueUsername(name);
            await db.collection('usernames').doc(username).set({ uid: userCredential.user.uid });
            
            await userCredential.user.updateProfile({ displayName: name });
            
            await db.collection('users').doc(userCredential.user.uid).set({
                email: email,
                displayName: name,
                username: username,
                bio: '',
                avatarColor: this.getRandomColor(name),
                avatarURL: null,
                createdAt: new Date().toISOString()
            });
            
            this.showToast('Регистрация успешна!', 'success');
        } catch (error) {
            console.error('Registration error:', error);
            let message = 'Ошибка регистрации';
            if (error.code === 'auth/email-already-in-use') message = 'Email уже используется';
            else if (error.code === 'auth/invalid-email') message = 'Неверный формат email';
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
            const testEmail = `test_${Date.now()}@alexa.com`;
            const testPassword = '123456';
            const testName = 'Тестовый пользователь';
            
            const userCredential = await auth.createUserWithEmailAndPassword(testEmail, testPassword);
            const username = await this.generateUniqueUsername(testName);
            await db.collection('usernames').doc(username).set({ uid: userCredential.user.uid });
            
            await userCredential.user.updateProfile({ displayName: testName });
            await db.collection('users').doc(userCredential.user.uid).set({
                email: testEmail,
                displayName: testName,
                username: username,
                bio: 'Тестовый аккаунт',
                avatarColor: this.getRandomColor(testName),
                avatarURL: null,
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
                await db.collection('presence').doc(this.currentUser.uid).set({
                    online: false,
                    lastSeen: firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
            }
            
            this.cleanupSubscriptions();
            await auth.signOut();
            this.currentUser = null;
            this.currentUserData = null;
            this.chats = [];
            this.currentChatId = null;
            this.currentOtherUserId = null;
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
            this.settingsUsername.value = this.currentUserData.username || '';
            this.settingsBio.value = this.currentUserData.bio || '';
            this.settingsColor.value = this.currentUserData.avatarColor || '#2AABEE';
            this.showModal('settingsModal');
        }
    }
    
    // ========== СОХРАНЕНИЕ НАСТРОЕК С АВАТАРОМ ЧЕРЕЗ IMGBB ==========
    async saveSettings() {
        const newName = this.settingsName.value.trim();
        const newUsername = this.settingsUsername.value.trim().toLowerCase();
        const newBio = this.settingsBio.value.trim();
        const newColor = this.settingsColor.value;
        const compression = this.settingsCompression.checked;
        const avatarFile = this.settingsAvatar.files[0];
        
        if (!newName) {
            this.showToast('Имя не может быть пустым', 'error');
            return;
        }
        
        if (newUsername) {
            if (!/^[a-z0-9_]{3,20}$/.test(newUsername)) {
                this.showToast('Username должен содержать только латиницу, цифры или _, от 3 до 20 символов', 'error');
                return;
            }
        } else {
            this.showToast('Username не может быть пустым', 'error');
            return;
        }
        
        try {
            if (newUsername !== this.currentUserData.username) {
                const available = await this.isUsernameAvailable(newUsername);
                if (!available) {
                    this.showToast('Этот username уже занят', 'error');
                    return;
                }
                await this.claimUsername(newUsername);
            }
            
            const updateData = {
                displayName: newName,
                bio: newBio,
                avatarColor: newColor
            };
            
            // Загрузка фото на ImgBB
            if (avatarFile) {
                this.showToast('Загрузка фото...', 'info');
                
                const formData = new FormData();
                formData.append('key', '2172d5fee0e315017bad542b495406e0'); // <-- ВСТАВЬТЕ СВОЙ КЛЮЧ!
                formData.append('image', avatarFile);
                
                try {
                    const response = await fetch('https://api.imgbb.com/1/upload', {
                        method: 'POST',
                        body: formData
                    });
                    
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    
                    const result = await response.json();
                    
                    if (result.success) {
                        const avatarURL = result.data.url;
                        console.log('ImgBB upload success:', avatarURL);
                        updateData.avatarURL = avatarURL;
                    } else {
                        throw new Error('ImgBB upload failed');
                    }
                } catch (uploadError) {
                    console.error('ImgBB upload error:', uploadError);
                    this.showToast('Ошибка загрузки фото на сервер', 'error');
                    return;
                }
            }
            
            await db.collection('users').doc(this.currentUser.uid).update(updateData);
            
            if (newName !== this.currentUserData.displayName) {
                await this.currentUser.updateProfile({ displayName: newName });
            }
            
            this.currentUserData.displayName = newName;
            this.currentUserData.bio = newBio;
            this.currentUserData.avatarColor = newColor;
            if (updateData.avatarURL) {
                this.currentUserData.avatarURL = updateData.avatarURL;
            }
            this.compressionEnabled = compression;
            localStorage.setItem('compression', compression);
            
            this.updateUserDisplay();
            this.closeAllModals();
            this.settingsAvatar.value = '';
            this.showToast('Настройки сохранены', 'success');
        } catch (error) {
            console.error('Save settings error:', error);
            this.showToast('Ошибка при сохранении: ' + error.message, 'error');
        }
    }
    
    renderChats() {
        const filter = this.searchInput.value.toLowerCase();
        this.chatsList.innerHTML = '';
        
        const filteredChats = this.chats.filter(chat => 
            !this.archivedChats.has(chat.id) && 
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
    
    async getUserStatus(userId) {
        try {
            const presenceDoc = await db.collection('presence').doc(userId).get();
            if (presenceDoc.exists) {
                const data = presenceDoc.data();
                if (data.online) return { text: 'в сети', color: '#2AABEE', online: true };
                else if (data.lastSeen) {
                    const lastSeen = data.lastSeen.toDate();
                    const now = new Date();
                    const diffMinutes = Math.floor((now - lastSeen) / 60000);
                    let text;
                    if (diffMinutes < 1) text = 'только что';
                    else if (diffMinutes < 60) text = `${diffMinutes} мин назад`;
                    else if (diffMinutes < 1440) text = `${Math.floor(diffMinutes / 60)} ч назад`;
                    else text = lastSeen.toLocaleDateString();
                    return { text, color: '#707579', online: false };
                }
            }
            return { text: '', color: '#707579', online: false };
        } catch (error) {
            console.error('Error getting user status:', error);
            return { text: '', color: '#707579', online: false };
        }
    }
    
    createChatElement(chat, isArchive = false) {
        const div = document.createElement('div');
        div.className = `chat-item ${this.currentChatId === chat.id ? 'active' : ''} ${isArchive ? 'archived' : ''}`;
        if (chat.unreadCount > 0 && chat.lastMessageSender !== this.currentUser?.uid && !isArchive) {
            div.classList.add('unread');
        }
        div.dataset.chatId = chat.id;
        
        const lastMessageTime = chat.lastMessageTime ? chat.lastMessageTime.toDate() : new Date();
        const timeString = this.formatTime(lastMessageTime);
        
        let displayName = chat.name;
        if (chat.type === 'private') {
            displayName = this.getDisplayNameForChat(chat, this.currentUser.uid);
        }
        
        let icon = '';
        if (chat.type === 'channel') icon = '<i class="fas fa-bullhorn" style="margin-right: 5px;"></i>';
        else if (chat.type === 'group') icon = '<i class="fas fa-users" style="margin-right: 5px;"></i>';
        
        const draft = this.loadDraft(chat.id);
        const draftIndicator = draft ? '<span class="draft-indicator"><i class="fas fa-pencil-alt"></i> Черновик</span>' : '';
        
        div.innerHTML = `
            <div class="chat-item-avatar" style="background: ${chat.avatarColor || this.getRandomColor(chat.name)}">${chat.name.charAt(0).toUpperCase()}</div>
            <div class="chat-item-info">
                <div class="chat-item-header">
                    <span class="chat-item-name">${icon}${this.escapeHtml(displayName)}</span>
                    <span class="chat-item-time">${timeString}</span>
                </div>
                <div class="chat-item-last-message">
                    ${draftIndicator ? draftIndicator : (chat.lastMessage ? this.escapeHtml(chat.lastMessage.substring(0, 30)) + (chat.lastMessage.length > 30 ? '...' : '') : 'Нет сообщений')}
                </div>
            </div>
        `;
        
        div.addEventListener('click', () => {
            if (isArchive) {
                this.selectChat(chat.id);
                this.exitArchive();
            } else {
                this.selectChat(chat.id);
            }
        });
        
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
            if (chat.type === 'private') {
                this.currentOtherUserId = chat.participants.find(id => id !== this.currentUser.uid);
            } else {
                this.currentOtherUserId = null;
            }
            
            if (window.innerWidth <= 768) {
                document.querySelector('.sidebar').classList.add('hidden');
            }
            
            this.updateChatHeader(chat);
            this.subscribeToMessages(chatId);
            
            const draft = this.loadDraft(chatId);
            if (draft) {
                this.messageInput.value = draft.text || '';
                this.messageInput.style.height = 'auto';
                this.messageInput.style.height = this.messageInput.scrollHeight + 'px';
                
                if (draft.replyTo) {
                    this.replyToMessage = draft.replyTo;
                    if (this.replyPreview && this.replyPreviewSender && this.replyPreviewText && draft.replyTo) {
                        this.replyPreviewSender.textContent = draft.replyTo.senderName || '';
                        this.replyPreviewText.textContent = draft.replyTo.text || '';
                        this.replyPreview.style.display = 'flex';
                    }
                }
                
                const container = document.querySelector('.message-input-container');
                if (container) {
                    container.classList.add('has-draft');
                }
            }
        }
    }
    
    updateChatHeader(chat) {
        this.chatHeader.style.display = 'flex';
        this.messageInputWrapper.style.display = 'flex';
        this.emptyChat.style.display = 'none';
        
        const avatarText = chat.name.charAt(0).toUpperCase();
        const avatarColor = chat.avatarColor || this.getRandomColor(chat.name);
        
        if (chat.avatarURL) {
            this.renderAvatar(this.chatAvatar, avatarText, avatarColor, chat.avatarURL);
        } else {
            this.chatAvatar.textContent = avatarText;
            this.chatAvatar.style.backgroundColor = avatarColor;
        }
        
        let displayName = chat.name;
        if (chat.type === 'private') {
            displayName = this.getDisplayNameForChat(chat, this.currentUser.uid);
        }
        this.chatName.textContent = displayName;
        
        if (chat.type === 'private') {
            this.chatStatus.style.display = 'block';
            this.updateChatStatus(chat);
            this.chatAvatar.style.cursor = 'pointer';
            this.chatAvatar.onclick = (e) => {
                e.stopPropagation();
                if (this.currentOtherUserId) {
                    this.openProfile(this.currentOtherUserId);
                }
            };
            this.chatName.style.cursor = 'pointer';
            this.chatName.onclick = (e) => {
                e.stopPropagation();
                this.openEditContactModal();
            };
        } else if (chat.type === 'group') {
            this.chatStatus.style.display = 'block';
            this.chatStatus.textContent = `участников: ${chat.participants ? chat.participants.length : 0}`;
            this.chatStatus.style.color = 'var(--text-secondary)';
            this.chatAvatar.style.cursor = 'default';
            this.chatAvatar.onclick = null;
            this.chatName.style.cursor = 'default';
            this.chatName.onclick = null;
        } else if (chat.type === 'channel') {
            this.chatStatus.style.display = 'block';
            this.chatStatus.textContent = `подписчиков: ${chat.subscribers ? chat.subscribers.length : 0}`;
            this.chatStatus.style.color = 'var(--text-secondary)';
            this.chatAvatar.style.cursor = 'default';
            this.chatAvatar.onclick = null;
            this.chatName.style.cursor = 'default';
            this.chatName.onclick = null;
        }
        
        if (chat.type === 'channel') {
            const isSubscribed = chat.subscribers && chat.subscribers.includes(this.currentUser.uid);
            const isOwner = chat.ownerId === this.currentUser.uid;
            this.manageChannelBtn.style.display = isOwner ? 'inline-flex' : 'none';
            this.manageGroupBtn.style.display = 'none';
            if (isOwner) {
                this.subscribeChannelBtn.style.display = 'none';
                this.unsubscribeChannelBtn.style.display = 'none';
            } else {
                if (isSubscribed) {
                    this.subscribeChannelBtn.style.display = 'none';
                    this.unsubscribeChannelBtn.style.display = 'inline-flex';
                } else {
                    this.subscribeChannelBtn.style.display = 'inline-flex';
                    this.unsubscribeChannelBtn.style.display = 'none';
                }
            }
            if (!this.canSendMessage(chat)) {
                this.messageInput.disabled = true;
                this.attachBtn.disabled = true;
                this.sendMessageBtn.disabled = true;
                this.messageInput.placeholder = 'Только чтение';
            } else {
                this.messageInput.disabled = false;
                this.attachBtn.disabled = false;
                this.sendMessageBtn.disabled = false;
                this.messageInput.placeholder = 'Написать сообщение...';
            }
        } else if (chat.type === 'group') {
            this.manageChannelBtn.style.display = 'none';
            this.manageGroupBtn.style.display = 'inline-flex';
            this.subscribeChannelBtn.style.display = 'none';
            this.unsubscribeChannelBtn.style.display = 'none';
            this.messageInput.disabled = false;
            this.attachBtn.disabled = false;
            this.sendMessageBtn.disabled = false;
            this.messageInput.placeholder = 'Написать сообщение...';
        } else {
            this.manageChannelBtn.style.display = 'none';
            this.manageGroupBtn.style.display = 'none';
            this.subscribeChannelBtn.style.display = 'none';
            this.unsubscribeChannelBtn.style.display = 'none';
            this.messageInput.disabled = false;
            this.attachBtn.disabled = false;
            this.sendMessageBtn.disabled = false;
            this.messageInput.placeholder = 'Написать сообщение...';
        }
        
        if (this.archiveChatBtn) {
            if (this.archivedChats.has(chat.id)) {
                this.archiveChatBtn.innerHTML = '<i class="fas fa-box-open"></i>';
                this.archiveChatBtn.title = 'Разархивировать';
            } else {
                this.archiveChatBtn.innerHTML = '<i class="fas fa-archive"></i>';
                this.archiveChatBtn.title = 'Архивировать';
            }
        }
    }
    
    async updateChatStatus(chat) {
        if (chat.type !== 'private') return;
        const otherParticipantId = chat.participants.find(id => id !== this.currentUser.uid);
        if (!otherParticipantId) return;
        if (this.currentStatusListener) {
            this.currentStatusListener();
            this.currentStatusListener = null;
        }
        const presenceRef = db.collection('presence').doc(otherParticipantId);
        this.currentStatusListener = presenceRef.onSnapshot(async (doc) => {
            if (doc.exists) {
                const data = doc.data();
                if (data.online) {
                    this.chatStatus.textContent = 'в сети';
                    this.chatStatus.style.color = '#2AABEE';
                } else if (data.lastSeen) {
                    const lastSeen = data.lastSeen.toDate();
                    const now = new Date();
                    const diffMinutes = Math.floor((now - lastSeen) / 60000);
                    if (diffMinutes < 1) this.chatStatus.textContent = 'был(а) только что';
                    else if (diffMinutes < 60) this.chatStatus.textContent = `был(а) ${diffMinutes} мин назад`;
                    else if (diffMinutes < 1440) this.chatStatus.textContent = `был(а) ${Math.floor(diffMinutes / 60)} ч назад`;
                    else this.chatStatus.textContent = `был(а) ${lastSeen.toLocaleDateString()}`;
                    this.chatStatus.style.color = '#707579';
                }
            } else {
                this.chatStatus.textContent = 'не в сети';
                this.chatStatus.style.color = '#707579';
            }
        }, (error) => {
            console.error('Error in presence listener:', error);
        });
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
                if (messageDate === today) dateText = 'Сегодня';
                else if (messageDate === yesterday) dateText = 'Вчера';
                else dateText = message.timestamp.toDate().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
                dateDiv.innerHTML = `<span>${dateText}</span>`;
                this.messagesContainer.appendChild(dateDiv);
                lastDate = messageDate;
            }
            const messageElement = this.createMessageElement(message);
            this.messagesContainer.appendChild(messageElement);
            
            setTimeout(() => {
                if (message.reactions) {
                    this.renderReactions(message.id, message.reactions);
                }
            }, 0);
        });
        
        this.scrollToBottom();
    }
    
    createMessageElement(message) {
        const div = document.createElement('div');
        div.className = `message ${message.senderId === this.currentUser?.uid ? 'sent' : 'received'}`;
        div.dataset.messageId = message.id;
        
        let time = '';
        if (message.timestamp) {
            time = message.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        
        let replyHtml = '';
        if (message.replyTo) {
            replyHtml = `
                <div class="reply-indicator" onclick="event.stopPropagation(); window.app.scrollToMessage('${message.replyTo.messageId}')">
                    <span class="reply-indicator-sender">${this.escapeHtml(message.replyTo.senderName)}</span>
                    <span class="reply-indicator-text">${this.escapeHtml(message.replyTo.text)}</span>
                </div>
            `;
        }
        
        let content = '';
        if (message.type === 'image') {
            content = `
                <div class="message-content image" onclick="window.open('${message.fileURL}', '_blank')">
                    <img src="${message.fileURL}" alt="Image" style="max-width: 100%; max-height: 400px;">
                </div>
            `;
        } else if (message.type === 'video') {
            content = `
                <div class="message-content video">
                    <video controls style="max-width: 100%; max-height: 400px; border-radius: 12px;">
                        <source src="${message.fileURL}" type="${message.fileType}">
                    </video>
                </div>
            `;
        } else if (message.type === 'file') {
            content = `
                <div class="message-content file" onclick="window.open('${message.fileURL}')">
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
        
        let reactionsHtml = '';
        if (message.reactions && Object.keys(message.reactions).length > 0) {
            reactionsHtml = '<div class="message-reactions"></div>';
        }
        
        let statusIcon = '';
        if (message.senderId === this.currentUser?.uid) {
            if (message.read) statusIcon = '<i class="fas fa-check-double message-status read"></i>';
            else statusIcon = '<i class="fas fa-check message-status"></i>';
        }
        
        const favoriteIcon = '<i class="far fa-star favorite-icon" onclick="event.stopPropagation(); window.app.toggleFavoriteMessage(\'' + message.id + '\')"></i>';
        
        div.innerHTML = `
            ${replyHtml}
            ${content}
            ${reactionsHtml}
            <div class="message-info">
                <span class="message-time">${time}</span>
                ${statusIcon}
                ${favoriteIcon}
            </div>
            <div class="add-reaction-btn" onclick="event.stopPropagation(); window.app.showReactionsPanel('${message.id}', event.clientX, event.clientY)">
                <i class="far fa-smile"></i>
            </div>
        `;
        
        let longPressTimer;
        div.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return;
            longPressTimer = setTimeout(() => {
                this.showContextMenu(message, e.clientX, e.clientY);
            }, 500);
        });
        
        div.addEventListener('mouseup', () => clearTimeout(longPressTimer));
        div.addEventListener('mouseleave', () => clearTimeout(longPressTimer));
        
        div.addEventListener('touchstart', (e) => {
            longPressTimer = setTimeout(() => {
                this.showContextMenu(message, e.touches[0].clientX, e.touches[0].clientY);
            }, 500);
        });
        
        div.addEventListener('touchend', () => clearTimeout(longPressTimer));
        div.addEventListener('touchcancel', () => clearTimeout(longPressTimer));
        
        return div;
    }
    
    showContextMenu(message, x, y) {
        const menu = this.messageContextMenu;
        if (!menu) return;
        
        menu.dataset.messageId = message.id;
        menu.style.left = x + 'px';
        menu.style.top = y + 'px';
        menu.classList.add('show');
        
        const pinItem = document.getElementById('pinMenuItem');
        const chat = this.chats.find(c => c.id === this.currentChatId);
        
        if (chat && chat.pinnedMessage && chat.pinnedMessage.id === message.id) {
            pinItem.textContent = 'Открепить';
        } else {
            pinItem.textContent = 'Закрепить';
        }
        
        const closeMenu = (e) => {
            if (!menu.contains(e.target)) {
                menu.classList.remove('show');
                document.removeEventListener('click', closeMenu);
            }
        };
        
        setTimeout(() => {
            document.addEventListener('click', closeMenu);
        }, 100);
    }
    
    formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
        return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
    }
    
    // ========== ЗАГРУЗКА ФАЙЛОВ (изображения через ImgBB, остальное через Storage) ==========
    async uploadFile(file) {
        if (!this.currentChatId) {
            this.showToast('Выберите чат', 'error');
            return;
        }
        
        const chat = this.chats.find(c => c.id === this.currentChatId);
        if (!this.canSendMessage(chat)) {
            this.showToast('Вы не можете отправлять сообщения в этот канал', 'error');
            return;
        }
        
        if (file.size > this.maxFileSize) {
            this.showToast(`Файл слишком большой. Максимальный размер: ${this.formatFileSize(this.maxFileSize)}`, 'error');
            return;
        }
        
        this.attachBtn.disabled = true;
        
        const isImage = file.type.startsWith('image/');
        const isVideo = file.type.startsWith('video/');
        
        try {
            this.showUploadProgress(file.name);
            
            let fileURL = '';
            let filePath = '';
            let finalFile = file;
            
            if (isImage && this.compressionEnabled && file.size > 1024 * 1024) {
                finalFile = await this.compressImage(file);
            }
            
            if (isImage) {
                // Загружаем изображение на ImgBB
                this.showToast('Загрузка фото на ImgBB...', 'info');
                
                const formData = new FormData();
                formData.append('key', '2172d5fee0e315017bad542b495406e0'); // <-- ВСТАВЬТЕ СВОЙ КЛЮЧ!
                formData.append('image', finalFile);
                
                const response = await fetch('https://api.imgbb.com/1/upload', {
                    method: 'POST',
                    body: formData
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const result = await response.json();
                
                if (!result.success) {
                    throw new Error('ImgBB upload failed');
                }
                
                fileURL = result.data.url;
                console.log('ImgBB upload success:', fileURL);
            } else {
                // Для видео и других файлов используем Firebase Storage (может не работать без платного плана)
                this.showToast('Загрузка в Firebase Storage... (может не работать без платного плана)', 'info');
                
                const timestamp = Date.now();
                const randomString = Math.random().toString(36).substring(2, 15);
                const extension = file.name.split('.').pop();
                const fileName = `${timestamp}_${randomString}.${extension}`;
                filePath = `chats/${this.currentChatId}/${fileName}`;
                const storageRef = storage.ref().child(filePath);
                
                const metadata = {
                    contentType: file.type,
                    customMetadata: {
                        originalName: file.name,
                        uploadedBy: this.currentUser.uid,
                        chatId: this.currentChatId
                    }
                };
                
                const uploadTask = storageRef.put(finalFile, metadata);
                this.uploadTasks.set(filePath, uploadTask);
                
                await new Promise((resolve, reject) => {
                    uploadTask.on('state_changed',
                        (snapshot) => {
                            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                            this.updateUploadProgress(progress);
                        },
                        (error) => {
                            reject(error);
                        },
                        async () => {
                            try {
                                fileURL = await storageRef.getDownloadURL();
                                resolve();
                            } catch (error) {
                                reject(error);
                            }
                        }
                    );
                });
                
                this.uploadTasks.delete(filePath);
            }
            
            // Создаём сообщение
            const message = {
                type: isImage ? 'image' : (isVideo ? 'video' : 'file'),
                text: isImage ? '📷 Фото' : (isVideo ? '🎥 Видео' : '📎 Файл'),
                fileURL: fileURL,
                filePath: filePath || null,
                fileName: file.name,
                fileSize: file.size,
                fileType: file.type,
                senderId: this.currentUser.uid,
                senderName: this.currentUserData.displayName,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                chatId: this.currentChatId,
                read: false
            };
            
            if (this.replyToMessage) {
                message.replyTo = {
                    messageId: this.replyToMessage.id,
                    text: this.replyToMessage.text,
                    senderName: this.replyToMessage.senderName
                };
            }
            
            await db.collection('messages').add(message);
            await db.collection('chats').doc(this.currentChatId).update({
                lastMessage: message.text,
                lastMessageTime: firebase.firestore.FieldValue.serverTimestamp(),
                lastMessageSender: this.currentUser.uid
            });
            
            this.cancelReply();
            this.clearDraft(this.currentChatId);
            this.hideUploadProgress();
            this.attachBtn.disabled = false;
            this.showToast('Файл отправлен', 'success');
            
        } catch (error) {
            console.error('Upload error:', error);
            this.hideUploadProgress();
            this.attachBtn.disabled = false;
            this.showToast('Ошибка загрузки: ' + error.message, 'error');
        }
        
        this.fileInput.value = '';
    }
    
    compressImage(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (e) => {
                const img = new Image();
                img.src = e.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    const MAX_WIDTH = 1920;
                    const MAX_HEIGHT = 1080;
                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    canvas.toBlob((blob) => {
                        if (blob) {
                            const compressedFile = new File([blob], file.name, {
                                type: file.type,
                                lastModified: Date.now()
                            });
                            resolve(compressedFile);
                        } else {
                            resolve(file);
                        }
                    }, file.type, 0.8);
                };
                img.onerror = reject;
            };
            reader.onerror = reject;
        });
    }
    
    showUploadProgress(filename) {
        if (this.uploadProgress) {
            this.uploadProgressFilename.textContent = `Загрузка: ${filename}`;
            this.uploadProgress.classList.add('show');
            this.currentUploadPath = filename;
        }
    }
    
    updateUploadProgress(percent) {
        if (this.uploadProgressBar && this.uploadProgressText) {
            const roundedPercent = Math.round(percent);
            this.uploadProgressBar.style.width = roundedPercent + '%';
            this.uploadProgressText.textContent = roundedPercent + '%';
        }
    }
    
    hideUploadProgress() {
        if (this.uploadProgress) {
            this.uploadProgress.classList.remove('show');
            this.uploadProgressBar.style.width = '0%';
            this.uploadProgressText.textContent = '0%';
        }
    }
    
    cancelCurrentUpload() {
        if (this.currentUploadPath && this.uploadTasks.has(this.currentUploadPath)) {
            const uploadTask = this.uploadTasks.get(this.currentUploadPath);
            uploadTask.cancel();
            this.uploadTasks.delete(this.currentUploadPath);
            this.hideUploadProgress();
            this.attachBtn.disabled = false;
            this.showToast('Загрузка отменена', 'info');
        }
    }
    
    async sendMessage() {
        const text = this.messageInput.value.trim();
        if (!text && !this.replyToMessage || !this.currentChatId) return;
        
        const chat = this.chats.find(c => c.id === this.currentChatId);
        if (!this.canSendMessage(chat)) {
            this.showToast('Вы не можете отправлять сообщения в этот канал', 'error');
            return;
        }
        
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
            
            if (this.replyToMessage) {
                message.replyTo = {
                    messageId: this.replyToMessage.id,
                    text: this.replyToMessage.text,
                    senderName: this.replyToMessage.senderName
                };
            }
            
            await db.collection('messages').add(message);
            
            await db.collection('chats').doc(this.currentChatId).update({
                lastMessage: text,
                lastMessageTime: firebase.firestore.FieldValue.serverTimestamp(),
                lastMessageSender: this.currentUser.uid
            });
            
            this.messageInput.value = '';
            this.messageInput.style.height = 'auto';
            this.cancelReply();
            this.clearDraft(this.currentChatId);
            
        } catch (error) {
            console.error('Error sending message:', error);
            this.showToast('Ошибка при отправке', 'error');
        }
    }
    
    async deleteCurrentChat() {
        if (!this.currentChatId) return;
        
        const chat = this.chats.find(c => c.id === this.currentChatId);
        if (chat && chat.type === 'channel' && chat.ownerId !== this.currentUser.uid) {
            this.showToast('Только владелец может удалить канал', 'error');
            return;
        }
        if (chat && chat.type === 'group' && chat.ownerId !== this.currentUser.uid) {
            this.showToast('Только владелец может удалить группу', 'error');
            return;
        }
        
        if (confirm('Удалить чат? Все сообщения будут удалены.')) {
            try {
                if (this.unsubscribeMessages) {
                    this.unsubscribeMessages();
                    this.unsubscribeMessages = null;
                }
                if (this.currentStatusListener) {
                    this.currentStatusListener();
                    this.currentStatusListener = null;
                }
                const messagesRef = db.collection('messages').where('chatId', '==', this.currentChatId);
                const snapshot = await messagesRef.get();
                const batch = db.batch();
                snapshot.forEach(doc => batch.delete(doc.ref));
                batch.delete(db.collection('chats').doc(this.currentChatId));
                await batch.commit();
                this.currentChatId = null;
                this.currentOtherUserId = null;
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
    
    async deleteMessage(messageId) {
        if (!confirm('Удалить сообщение?')) return;
        
        try {
            await db.collection('messages').doc(messageId).delete();
            this.showToast('Сообщение удалено', 'success');
        } catch (error) {
            console.error('Error deleting message:', error);
            this.showToast('Ошибка при удалении', 'error');
        }
    }
    
    async createNewChat() {
        const input = this.newChatEmail.value.trim();
        const name = this.newChatName.value.trim();
        
        if (!input || !name) {
            this.showToast('Заполните все поля', 'error');
            return;
        }
        
        if (input === this.currentUser.email || input === '@' + this.currentUserData.username) {
            this.showToast('Нельзя создать чат с самим собой', 'error');
            return;
        }
        
        try {
            const usersRef = db.collection('users');
            let query;
            if (input.startsWith('@')) {
                const username = input.substring(1);
                query = usersRef.where('username', '==', username).limit(1);
            } else {
                query = usersRef.where('email', '==', input).limit(1);
            }
            
            const snapshot = await query.get();
            
            if (snapshot.empty) {
                this.showToast('Пользователь не найден', 'error');
                return;
            }
            
            const otherUser = snapshot.docs[0];
            const otherUserData = otherUser.data();
            const otherUserName = otherUserData.displayName || otherUserData.email.split('@')[0];
            
            const chatsRef = db.collection('chats').where('participants', 'array-contains', this.currentUser.uid);
            const existingChats = await chatsRef.get();
            
            let chatExists = false;
            existingChats.forEach(doc => {
                const chat = doc.data();
                if (chat.participants && chat.participants.includes(otherUser.id) && chat.type === 'private') {
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
                unreadCount: 0,
                customNames: {
                    [this.currentUser.uid]: name,
                    [otherUser.id]: otherUserName
                }
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
        if (this.showingArchive) this.renderArchive();
        else this.renderChats();
    }
    
    showModal(modalId) {
        document.getElementById(modalId).classList.add('show');
    }
    
    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => modal.classList.remove('show'));
        this.showingFavorites = false;
        this.newGroupMembers = [];
        if (this.membersPreview) this.membersPreview.innerHTML = '';
    }
    
    scrollToBottom() {
        setTimeout(() => {
            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        }, 100);
    }
    
    showToast(message, type = 'info') {
        this.toast.textContent = message;
        this.toast.className = `toast show ${type}`;
        setTimeout(() => this.toast.classList.remove('show'), 3000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new AlexaApp();
});// script.js - ПОЛНАЯ ВЕРСИЯ с каналами, username, локальными именами и управлением каналами

const firebaseConfig = {
    apiKey: "AIzaSyAj_Mh359ecv87XPV1ygtzQPWg2lsKyvzw",
    authDomain: "alexa-62aaf.firebaseapp.com",
    projectId: "alexa-62aaf",
    storageBucket: "alexa-62aaf.firebasestorage.app",
    messagingSenderId: "233934948868",
    appId: "1:233934948868:web:c503a5062e19b02a910351",
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

db.settings({ ignoreUndefinedProperties: true }, { merge: true });

class AlexaApp {
    constructor() {
        this.currentUser = null;
        this.currentUserData = null;
        this.currentChatId = null;
        this.currentOtherUserId = null;
        this.chats = [];
        this.messages = {};
        this.unsubscribeChats = null;
        this.unsubscribeMessages = null;
        this.typingTimeout = null;
        this.isTyping = false;
        this.notificationsEnabled = false;
        this.theme = 'light';
        
        this.userPresenceListeners = {};
        this.currentStatusListener = null;
        
        this.archivedChats = new Set();
        this.showingArchive = false;
        this.showingFavorites = false;
        this.favorites = [];
        
        this.uploadTasks = new Map();
        this.compressionEnabled = true;
        this.maxFileSize = 100 * 1024 * 1024;
        
        this.init();
    }
    
    init() {
        this.initElements();
        this.initEventListeners();
        this.checkAuthState();
        this.loadSettings();
        
        setTimeout(() => {
            document.getElementById('loadingScreen').classList.add('hidden');
        }, 1000);
    }
    
    initElements() {
        this.loadingScreen = document.getElementById('loadingScreen');
        this.authPage = document.getElementById('authPage');
        this.appPage = document.getElementById('appPage');
        
        this.loginTab = document.getElementById('loginTab');
        this.registerTab = document.getElementById('registerTab');
        this.loginForm = document.getElementById('loginForm');
        this.registerForm = document.getElementById('registerForm');
        this.resetForm = document.getElementById('resetForm');
        
        this.loginEmail = document.getElementById('loginEmail');
        this.loginPassword = document.getElementById('loginPassword');
        
        this.registerName = document.getElementById('registerName');
        this.registerEmail = document.getElementById('registerEmail');
        this.registerPassword = document.getElementById('registerPassword');
        this.registerConfirmPassword = document.getElementById('registerConfirmPassword');
        
        this.resetEmail = document.getElementById('resetEmail');
        
        this.loginBtn = document.getElementById('loginBtn');
        this.registerBtn = document.getElementById('registerBtn');
        this.testAuthBtn = document.getElementById('testAuthBtn');
        this.forgotPasswordBtn = document.getElementById('forgotPasswordBtn');
        this.backFromResetBtn = document.getElementById('backFromResetBtn');
        this.resetPasswordBtn = document.getElementById('resetPasswordBtn');
        
        this.profileAvatar = document.getElementById('profileAvatar');
        this.profileAvatarText = document.getElementById('profileAvatarText');
        this.profileName = document.getElementById('profileName');
        this.profileEmail = document.getElementById('profileEmail');
        this.settingsBtn = document.getElementById('settingsBtn');
        
        this.menuButton = document.getElementById('menuButton');
        this.userMenu = document.getElementById('userMenu');
        this.menuAvatar = document.getElementById('menuAvatar');
        this.menuName = document.getElementById('menuName');
        this.menuEmail = document.getElementById('menuEmail');
        this.menuSettings = document.getElementById('menuSettings');
        this.menuTheme = document.getElementById('menuTheme');
        this.menuLogout = document.getElementById('menuLogout');
        
        // Пункты меню
        this.menuCreateChannel = document.getElementById('menuCreateChannel');
        this.menuArchive = document.getElementById('menuArchive');
        this.menuFavorites = document.getElementById('menuFavorites');
        
        this.chatsList = document.getElementById('chatsList');
        this.searchInput = document.getElementById('searchInput');
        this.addChatBtn = document.getElementById('addChatBtn');
        
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
        
        // Кнопки для каналов
        this.manageChannelBtn = document.getElementById('manageChannelBtn');
        this.subscribeChannelBtn = document.getElementById('subscribeChannelBtn');
        this.unsubscribeChannelBtn = document.getElementById('unsubscribeChannelBtn');
        this.archiveChatBtn = document.getElementById('archiveChatBtn');
        
        this.attachBtn = document.getElementById('attachBtn');
        this.fileInput = document.getElementById('fileInput');
        
        this.emojiBtn = document.getElementById('emojiBtn');
        this.emojiPanel = document.getElementById('emojiPanel');
        
        // Модальные окна
        this.newChatModal = document.getElementById('newChatModal');
        this.settingsModal = document.getElementById('settingsModal');
        this.favoritesModal = document.getElementById('favoritesModal');
        this.editContactModal = document.getElementById('editContactModal');
        this.createChannelModal = document.getElementById('createChannelModal');
        this.manageChannelModal = document.getElementById('manageChannelModal'); // новое
        
        this.closeModalBtns = document.querySelectorAll('.close-modal');
        
        this.favoritesList = document.getElementById('favoritesList');
        
        this.editContactName = document.getElementById('editContactName');
        this.saveContactNameBtn = document.getElementById('saveContactNameBtn');
        
        this.settingsName = document.getElementById('settingsName');
        this.settingsUsername = document.getElementById('settingsUsername');
        this.settingsBio = document.getElementById('settingsBio');
        this.settingsColor = document.getElementById('settingsColor');
        this.saveSettingsBtn = document.getElementById('saveSettingsBtn');
        
        this.newChatEmail = document.getElementById('newChatEmail');
        this.newChatName = document.getElementById('newChatName');
        this.createChatBtn = document.getElementById('createChatBtn');
        
        // Поля создания канала
        this.channelName = document.getElementById('channelName');
        this.channelDescription = document.getElementById('channelDescription');
        this.channelAvatar = document.getElementById('channelAvatar');
        this.createChannelBtn = document.getElementById('createChannelBtn');
        
        // Поля управления каналом
        this.manageChannelName = document.getElementById('manageChannelName');
        this.manageChannelDescription = document.getElementById('manageChannelDescription');
        this.manageChannelAvatar = document.getElementById('manageChannelAvatar');
        this.addSubscriberInput = document.getElementById('addSubscriberInput');
        this.addSubscriberBtn = document.getElementById('addSubscriberBtn');
        this.subscribersList = document.getElementById('subscribersList');
        this.subscriberCount = document.getElementById('subscriberCount');
        this.saveChannelSettingsBtn = document.getElementById('saveChannelSettingsBtn');
        this.deleteChannelBtn = document.getElementById('deleteChannelBtn');
        
        this.notificationSound = document.getElementById('notificationSound');
        this.toast = document.getElementById('toast');
        
        this.archiveHeader = document.getElementById('archiveHeader');
        this.backFromArchiveBtn = document.getElementById('backFromArchiveBtn');
        this.archiveHeaderTitle = document.getElementById('archiveHeaderTitle');
        
        this.createUploadProgressElement();
    }
    
    // ---------- МЕТОДЫ ДЛЯ USERNAME ----------
    
    async generateUniqueUsername(baseName) {
        const translitMap = {
            'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'e','ж':'zh','з':'z','и':'i','й':'y',
            'к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f',
            'х':'h','ц':'c','ч':'ch','ш':'sh','щ':'sch','ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya'
        };
        const translit = (str) => {
            return str.toLowerCase().split('').map(c => translitMap[c] || c).join('').replace(/[^a-z0-9]/g, '');
        };
        let username = translit(baseName);
        if (!username || username.length < 3) username = 'user';

        let candidate = username;
        let counter = 1;
        while (true) {
            const doc = await db.collection('usernames').doc(candidate).get();
            if (!doc.exists) break;
            candidate = `${username}${counter}`;
            counter++;
        }
        return candidate;
    }

    async isUsernameAvailable(username) {
        const doc = await db.collection('usernames').doc(username).get();
        return !doc.exists;
    }

    async claimUsername(newUsername) {
        if (!this.currentUser) throw new Error('No user');
        if (this.currentUserData.username) {
            await db.collection('usernames').doc(this.currentUserData.username).delete();
        }
        await db.collection('usernames').doc(newUsername).set({ uid: this.currentUser.uid });
        await db.collection('users').doc(this.currentUser.uid).update({ username: newUsername });
        this.currentUserData.username = newUsername;
        this.updateUserDisplay();
    }

    // ---------- МЕТОДЫ ДЛЯ ЛОКАЛЬНЫХ ИМЁН ----------
    
    getDisplayNameForChat(chat, forUserId) {
        if (!chat || !chat.participants) return '';
        const otherId = chat.participants.find(id => id !== forUserId);
        if (chat.customNames && chat.customNames[otherId]) {
            return chat.customNames[otherId];
        }
        return chat.name || 'Безымянный';
    }

    getLocalContactName(userId) {
        const chat = this.chats.find(c => c.id === this.currentChatId);
        if (chat && chat.customNames && chat.customNames[userId]) {
            return chat.customNames[userId];
        }
        return '';
    }

    async saveContactName() {
        const newName = this.editContactName.value.trim();
        if (!newName || !this.currentChatId || !this.currentOtherUserId) {
            this.showToast('Введите имя', 'error');
            return;
        }

        try {
            const chatRef = db.collection('chats').doc(this.currentChatId);
            await chatRef.update({
                [`customNames.${this.currentOtherUserId}`]: newName
            });
            const chat = this.chats.find(c => c.id === this.currentChatId);
            if (chat) {
                if (!chat.customNames) chat.customNames = {};
                chat.customNames[this.currentOtherUserId] = newName;
            }
            this.updateChatHeader(chat);
            this.renderChats();
            this.closeAllModals();
            this.showToast('Имя сохранено', 'success');
        } catch (error) {
            console.error('Error saving contact name:', error);
            this.showToast('Ошибка', 'error');
        }
    }

    openEditContactModal() {
        if (!this.currentChatId || !this.currentOtherUserId) return;
        const currentName = this.getLocalContactName(this.currentOtherUserId);
        this.editContactName.value = currentName;
        this.showModal('editContactModal');
    }
    
    // ---------- МЕТОДЫ ДЛЯ КАНАЛОВ ----------
    
    async createChannel() {
        const name = this.channelName.value.trim();
        const description = this.channelDescription.value.trim();
        const avatarFile = this.channelAvatar.files[0];
        
        if (!name) {
            this.showToast('Введите название канала', 'error');
            return;
        }
        
        try {
            const channelData = {
                name: name,
                description: description,
                type: 'channel',
                ownerId: this.currentUser.uid,
                participants: [this.currentUser.uid],
                subscribers: [this.currentUser.uid],
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastMessageTime: firebase.firestore.FieldValue.serverTimestamp(),
                lastMessage: 'Канал создан',
                avatarColor: this.getRandomColor(name),
                unreadCount: 0
            };
            
            const channelRef = await db.collection('chats').add(channelData);
            const channelId = channelRef.id;
            
            if (avatarFile) {
                const storagePath = `channels/${channelId}/avatar.jpg`;
                const storageRef = storage.ref().child(storagePath);
                await storageRef.put(avatarFile);
                const avatarURL = await storageRef.getDownloadURL();
                await channelRef.update({ avatarURL });
            }
            
            this.closeAllModals();
            this.channelName.value = '';
            this.channelDescription.value = '';
            this.channelAvatar.value = '';
            this.showToast('Канал создан!', 'success');
            this.selectChat(channelId);
        } catch (error) {
            console.error('Error creating channel:', error);
            this.showToast('Ошибка при создании канала', 'error');
        }
    }
    
    async subscribeToChannel() {
        if (!this.currentChatId || !this.currentUser) return;
        try {
            const chatRef = db.collection('chats').doc(this.currentChatId);
            await chatRef.update({
                subscribers: firebase.firestore.FieldValue.arrayUnion(this.currentUser.uid),
                participants: firebase.firestore.FieldValue.arrayUnion(this.currentUser.uid)
            });
            this.showToast('Вы подписались на канал', 'success');
        } catch (error) {
            console.error('Error subscribing:', error);
            this.showToast('Ошибка подписки', 'error');
        }
    }
    
    async unsubscribeFromChannel() {
        if (!this.currentChatId || !this.currentUser) return;
        try {
            const chatRef = db.collection('chats').doc(this.currentChatId);
            await chatRef.update({
                subscribers: firebase.firestore.FieldValue.arrayRemove(this.currentUser.uid),
                participants: firebase.firestore.FieldValue.arrayRemove(this.currentUser.uid)
            });
            this.showToast('Вы отписались от канала', 'info');
        } catch (error) {
            console.error('Error unsubscribing:', error);
            this.showToast('Ошибка отписки', 'error');
        }
    }
    
    canSendMessage(chat) {
        if (!chat) return false;
        if (chat.type === 'private') return true;
        if (chat.type === 'channel') return chat.ownerId === this.currentUser.uid;
        return false;
    }
    
    // ---------- УПРАВЛЕНИЕ КАНАЛОМ ----------
    
    async openManageChannelModal() {
        if (!this.currentChatId) return;
        const chat = this.chats.find(c => c.id === this.currentChatId);
        if (!chat || chat.type !== 'channel') return;
        
        // Заполняем поля
        this.manageChannelName.value = chat.name || '';
        this.manageChannelDescription.value = chat.description || '';
        this.manageChannelAvatar.value = ''; // сброс
        await this.renderSubscribersList(chat.subscribers || []);
        
        this.showModal('manageChannelModal');
    }
    
    async renderSubscribersList(subscriberIds) {
        if (!this.subscribersList) return;
        
        this.subscriberCount.textContent = subscriberIds.length;
        
        if (subscriberIds.length === 0) {
            this.subscribersList.innerHTML = '<p class="empty-list">Нет подписчиков</p>';
            return;
        }
        
        // Загружаем данные пользователей
        const usersData = {};
        const promises = subscriberIds.map(async (uid) => {
            if (uid === this.currentUser.uid) {
                usersData[uid] = { displayName: this.currentUserData.displayName, username: this.currentUserData.username };
            } else {
                try {
                    const userDoc = await db.collection('users').doc(uid).get();
                    if (userDoc.exists) {
                        usersData[uid] = userDoc.data();
                    }
                } catch (e) {
                    console.error('Error loading user', uid, e);
                }
            }
        });
        await Promise.all(promises);
        
        let html = '';
        subscriberIds.forEach(uid => {
            const user = usersData[uid] || { displayName: 'Неизвестно', username: '' };
            const displayName = user.displayName || 'Пользователь';
            const username = user.username ? '@' + user.username : '';
            const isOwner = uid === this.currentUser.uid ? ' (владелец)' : '';
            
            html += `
                <div class="subscriber-item">
                    <div class="subscriber-info">
                        <span class="subscriber-name">${this.escapeHtml(displayName)}${isOwner}</span>
                        <span class="subscriber-username">${this.escapeHtml(username)}</span>
                    </div>
                    ${uid !== this.currentUser.uid ? `
                        <button class="remove-subscriber-btn" data-uid="${uid}">
                            <i class="fas fa-user-minus"></i>
                        </button>
                    ` : ''}
                </div>
            `;
        });
        
        this.subscribersList.innerHTML = html;
        
        // Добавляем обработчики на кнопки удаления
        this.subscribersList.querySelectorAll('.remove-subscriber-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const uid = btn.dataset.uid;
                this.removeSubscriber(uid);
            });
        });
    }
    
    async removeSubscriber(uid) {
        if (!this.currentChatId) return;
        try {
            const chatRef = db.collection('chats').doc(this.currentChatId);
            await chatRef.update({
                subscribers: firebase.firestore.FieldValue.arrayRemove(uid),
                participants: firebase.firestore.FieldValue.arrayRemove(uid)
            });
            this.showToast('Подписчик удалён', 'info');
            // Обновим список
            const chat = this.chats.find(c => c.id === this.currentChatId);
            if (chat) {
                chat.subscribers = (chat.subscribers || []).filter(id => id !== uid);
                chat.participants = (chat.participants || []).filter(id => id !== uid);
                await this.renderSubscribersList(chat.subscribers);
            }
        } catch (error) {
            console.error('Error removing subscriber:', error);
            this.showToast('Ошибка при удалении', 'error');
        }
    }
    
    async addSubscriber() {
        const input = this.addSubscriberInput.value.trim();
        if (!input) return;
        
        try {
            // Ищем пользователя по email или username
            const usersRef = db.collection('users');
            let query;
            if (input.startsWith('@')) {
                const username = input.substring(1);
                query = usersRef.where('username', '==', username).limit(1);
            } else {
                query = usersRef.where('email', '==', input).limit(1);
            }
            
            const snapshot = await query.get();
            if (snapshot.empty) {
                this.showToast('Пользователь не найден', 'error');
                return;
            }
            
            const user = snapshot.docs[0];
            const uid = user.id;
            
            // Проверяем, не подписан ли уже
            const chat = this.chats.find(c => c.id === this.currentChatId);
            if (chat.subscribers && chat.subscribers.includes(uid)) {
                this.showToast('Пользователь уже подписан', 'info');
                return;
            }
            
            // Добавляем
            const chatRef = db.collection('chats').doc(this.currentChatId);
            await chatRef.update({
                subscribers: firebase.firestore.FieldValue.arrayUnion(uid),
                participants: firebase.firestore.FieldValue.arrayUnion(uid)
            });
            
            this.showToast('Подписчик добавлен', 'success');
            this.addSubscriberInput.value = '';
            
            // Обновим локально
            if (!chat.subscribers) chat.subscribers = [];
            chat.subscribers.push(uid);
            if (!chat.participants) chat.participants = [];
            chat.participants.push(uid);
            await this.renderSubscribersList(chat.subscribers);
            
        } catch (error) {
            console.error('Error adding subscriber:', error);
            this.showToast('Ошибка при добавлении', 'error');
        }
    }
    
    async saveChannelSettings() {
        const newName = this.manageChannelName.value.trim();
        const newDescription = this.manageChannelDescription.value.trim();
        const avatarFile = this.manageChannelAvatar.files[0];
        
        if (!newName) {
            this.showToast('Название не может быть пустым', 'error');
            return;
        }
        
        try {
            const updateData = {
                name: newName,
                description: newDescription
            };
            
            if (avatarFile) {
                const storagePath = `channels/${this.currentChatId}/avatar.jpg`;
                const storageRef = storage.ref().child(storagePath);
                await storageRef.put(avatarFile);
                const avatarURL = await storageRef.getDownloadURL();
                updateData.avatarURL = avatarURL;
            }
            
            await db.collection('chats').doc(this.currentChatId).update(updateData);
            this.showToast('Настройки сохранены', 'success');
            this.closeAllModals();
            
            // Обновим локально
            const chat = this.chats.find(c => c.id === this.currentChatId);
            if (chat) {
                chat.name = newName;
                chat.description = newDescription;
                if (updateData.avatarURL) chat.avatarURL = updateData.avatarURL;
                this.updateChatHeader(chat);
                this.renderChats();
            }
        } catch (error) {
            console.error('Error saving channel settings:', error);
            this.showToast('Ошибка при сохранении', 'error');
        }
    }
    
    // ---------- ОСТАЛЬНЫЕ МЕТОДЫ ----------
    
    createUploadProgressElement() {
        if (!document.getElementById('uploadProgress')) {
            const progressHTML = `
                <div class="upload-progress" id="uploadProgress">
                    <div class="progress-header">
                        <span class="progress-filename">Загрузка...</span>
                        <button class="cancel-upload" id="cancelUploadBtn">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="progress-bar-container">
                        <div class="progress-bar" id="uploadProgressBar" style="width: 0%"></div>
                    </div>
                    <div class="progress-text" id="uploadProgressText">0%</div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', progressHTML);
            
            this.uploadProgress = document.getElementById('uploadProgress');
            this.uploadProgressBar = document.getElementById('uploadProgressBar');
            this.uploadProgressText = document.getElementById('uploadProgressText');
            this.uploadProgressFilename = document.querySelector('.progress-filename');
            this.cancelUploadBtn = document.getElementById('cancelUploadBtn');
            
            if (this.cancelUploadBtn) {
                this.cancelUploadBtn.addEventListener('click', () => this.cancelCurrentUpload());
            }
        }
    }
    
    renderAvatar(container, text, color, url) {
        if (url) {
            const img = document.createElement('img');
            img.src = url;
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'cover';
            img.onerror = () => {
                container.innerHTML = `<span>${this.escapeHtml(text)}</span>`;
                container.style.background = color;
            };
            container.innerHTML = '';
            container.appendChild(img);
            container.style.background = 'transparent';
        } else {
            container.innerHTML = `<span>${this.escapeHtml(text)}</span>`;
            container.style.background = color;
        }
    }
    
    initEventListeners() {
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
        
        this.loginBtn.addEventListener('click', () => this.login());
        this.loginPassword.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.login();
        });
        
        this.registerBtn.addEventListener('click', () => this.register());
        this.testAuthBtn.addEventListener('click', () => this.testAuth());
        
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
        
        this.menuCreateChannel.addEventListener('click', () => {
            this.userMenu.classList.remove('show');
            this.showModal('createChannelModal');
        });
        
        this.menuArchive.addEventListener('click', () => {
            this.userMenu.classList.remove('show');
            this.toggleArchive();
        });
        
        this.menuFavorites.addEventListener('click', () => {
            this.userMenu.classList.remove('show');
            this.showFavorites();
        });
        
        this.settingsBtn.addEventListener('click', () => this.openSettings());
        this.saveSettingsBtn.addEventListener('click', () => this.saveSettings());
        
        this.addChatBtn.addEventListener('click', () => this.showModal('newChatModal'));
        this.createChatBtn.addEventListener('click', () => this.createNewChat());
        
        this.searchInput.addEventListener('input', () => this.filterChats());
        
        this.sendMessageBtn.addEventListener('click', () => this.sendMessage());
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        this.messageInput.addEventListener('input', () => {
            this.handleTyping();
        });
        
        this.deleteChatBtn.addEventListener('click', () => this.deleteCurrentChat());
        this.archiveChatBtn.addEventListener('click', () => this.toggleArchiveChat());
        
        // Кнопки для каналов
        this.manageChannelBtn.addEventListener('click', () => this.openManageChannelModal());
        this.subscribeChannelBtn.addEventListener('click', () => this.subscribeToChannel());
        this.unsubscribeChannelBtn.addEventListener('click', () => this.unsubscribeFromChannel());
        
        this.backToChatsBtn.addEventListener('click', () => {
            document.querySelector('.sidebar').classList.remove('hidden');
        });
        
        if (this.backFromArchiveBtn) {
            this.backFromArchiveBtn.addEventListener('click', () => {
                this.exitArchive();
            });
        }
        
        this.chatName.addEventListener('click', () => {
            if (this.currentChatId && this.currentOtherUserId) {
                this.openEditContactModal();
            }
        });

        this.saveContactNameBtn.addEventListener('click', () => this.saveContactName());
        
        this.attachBtn.addEventListener('click', () => {
            this.fileInput.click();
        });
        
        this.fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.uploadFile(e.target.files[0]);
            }
        });
        
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
        
        this.closeModalBtns.forEach(btn => {
            btn.addEventListener('click', () => this.closeAllModals());
        });
        
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeAllModals();
            }
        });
        
        // Создание канала
        this.createChannelBtn.addEventListener('click', () => this.createChannel());
        
        // Управление каналом
        this.addSubscriberBtn.addEventListener('click', () => this.addSubscriber());
        this.saveChannelSettingsBtn.addEventListener('click', () => this.saveChannelSettings());
        this.deleteChannelBtn.addEventListener('click', () => this.deleteCurrentChat());
        
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
        
        const compression = localStorage.getItem('compression');
        if (compression !== null) {
            this.compressionEnabled = compression === 'true';
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
                this.loadArchivedChats();
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
        if (this.currentStatusListener) {
            this.currentStatusListener();
            this.currentStatusListener = null;
        }
        
        Object.values(this.userPresenceListeners).forEach(unsubscribe => {
            if (unsubscribe) unsubscribe();
        });
        this.userPresenceListeners = {};
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
                    username: userData.username || null,
                    bio: userData.bio || '',
                    avatarColor: userData.avatarColor || '#2AABEE',
                    avatarURL: userData.avatarURL || null,
                    email: this.currentUser.email
                };
            } else {
                const displayName = this.currentUser.email.split('@')[0];
                const username = await this.generateUniqueUsername(displayName);
                await db.collection('usernames').doc(username).set({ uid: this.currentUser.uid });
                
                await db.collection('users').doc(this.currentUser.uid).set({
                    email: this.currentUser.email,
                    displayName: displayName,
                    username: username,
                    bio: '',
                    avatarColor: '#2AABEE',
                    avatarURL: null,
                    createdAt: new Date().toISOString()
                });
                
                await this.currentUser.updateProfile({
                    displayName: displayName
                });
                
                this.currentUserData = {
                    displayName: displayName,
                    username: username,
                    bio: '',
                    avatarColor: '#2AABEE',
                    avatarURL: null,
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
        const avatarURL = this.currentUserData.avatarURL;
        const color = this.currentUserData.avatarColor || '#2AABEE';
        
        this.renderAvatar(this.profileAvatar, avatarText, color, avatarURL);
        this.renderAvatar(this.menuAvatar, avatarText, color, avatarURL);
        
        this.profileName.textContent = displayName;
        this.profileEmail.textContent = this.currentUserData.username 
            ? '@' + this.currentUserData.username 
            : this.currentUserData.email;
        
        this.menuName.textContent = displayName;
        this.menuEmail.textContent = this.currentUserData.username 
            ? '@' + this.currentUserData.username 
            : this.currentUserData.email;
    }
    
    // ========== АРХИВ ==========
    async loadArchivedChats() {
        if (!this.currentUser) return;
        try {
            const userDoc = await db.collection('users').doc(this.currentUser.uid).get();
            if (userDoc.exists && userDoc.data().archivedChats) {
                this.archivedChats = new Set(userDoc.data().archivedChats);
            } else {
                this.archivedChats = new Set();
            }
        } catch (error) {
            console.error('Error loading archived chats:', error);
        }
    }
    
    async saveArchivedChats() {
        if (!this.currentUser) return;
        try {
            await db.collection('users').doc(this.currentUser.uid).set({
                archivedChats: Array.from(this.archivedChats)
            }, { merge: true });
        } catch (error) {
            console.error('Error saving archived chats:', error);
        }
    }
    
    async toggleArchiveChat() {
        if (!this.currentChatId) return;
        if (this.archivedChats.has(this.currentChatId)) {
            this.archivedChats.delete(this.currentChatId);
            this.showToast('Чат разархивирован', 'success');
            this.archiveChatBtn.innerHTML = '<i class="fas fa-archive"></i>';
            this.archiveChatBtn.title = 'Архивировать';
        } else {
            this.archivedChats.add(this.currentChatId);
            this.showToast('Чат архивирован', 'success');
            this.archiveChatBtn.innerHTML = '<i class="fas fa-box-open"></i>';
            this.archiveChatBtn.title = 'Разархивировать';
        }
        await this.saveArchivedChats();
        this.renderChats();
    }
    
    toggleArchive() {
        if (this.showingArchive) this.exitArchive();
        else this.enterArchive();
    }
    
    enterArchive() {
        this.showingArchive = true;
        this.showingFavorites = false;
        if (this.archiveHeader) this.archiveHeader.style.display = 'flex';
        document.querySelector('.search-box').style.display = 'none';
        this.renderArchive();
    }
    
    exitArchive() {
        this.showingArchive = false;
        if (this.archiveHeader) this.archiveHeader.style.display = 'none';
        document.querySelector('.search-box').style.display = 'block';
        this.renderChats();
    }
    
    renderArchive() {
        this.chatsList.innerHTML = '';
        const archivedChatsList = this.chats.filter(chat => this.archivedChats.has(chat.id));
        if (archivedChatsList.length === 0) {
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'empty-archive';
            emptyDiv.innerHTML = `
                <i class="fas fa-archive"></i>
                <p>В архиве нет чатов</p>
                <small>Чтобы архивировать чат, откройте его и нажмите кнопку архивации</small>
            `;
            this.chatsList.appendChild(emptyDiv);
            return;
        }
        archivedChatsList.sort((a, b) => {
            const timeA = a.lastMessageTime ? a.lastMessageTime.toDate() : new Date(0);
            const timeB = b.lastMessageTime ? b.lastMessageTime.toDate() : new Date(0);
            return timeB - timeA;
        });
        archivedChatsList.forEach(chat => {
            const chatElement = this.createChatElement(chat, true);
            this.chatsList.appendChild(chatElement);
        });
    }
    
    // ========== ИЗБРАННОЕ ==========
    async showFavorites() {
        this.showingFavorites = true;
        await this.loadFavorites();
        this.showModal('favoritesModal');
    }
    
    async loadFavorites() {
        if (!this.currentUser) return;
        try {
            const snapshot = await db.collection('favorites')
                .where('userId', '==', this.currentUser.uid)
                .orderBy('addedAt', 'desc')
                .get();
            this.favorites = [];
            for (const doc of snapshot.docs) {
                const favorite = { id: doc.id, ...doc.data() };
                const chatDoc = await db.collection('chats').doc(favorite.chatId).get();
                if (chatDoc.exists) favorite.chatName = chatDoc.data().name;
                this.favorites.push(favorite);
            }
            this.renderFavorites();
        } catch (error) {
            console.error('Error loading favorites:', error);
            this.showToast('Ошибка загрузки избранного', 'error');
        }
    }
    
    renderFavorites() {
        if (!this.favoritesList) return;
        this.favoritesList.innerHTML = '';
        if (this.favorites.length === 0) {
            this.favoritesList.innerHTML = `
                <div class="empty-favorites">
                    <i class="fas fa-star"></i>
                    <p>Нет избранных сообщений</p>
                    <small>Нажмите на звездочку у сообщения, чтобы добавить его в избранное</small>
                </div>
            `;
            return;
        }
        this.favorites.forEach(fav => {
            const item = document.createElement('div');
            item.className = 'favorite-item';
            item.dataset.chatId = fav.chatId;
            item.dataset.messageId = fav.messageId;
            
            const avatarText = fav.chatName ? fav.chatName.charAt(0).toUpperCase() : '?';
            const time = fav.addedAt ? fav.addedAt.toDate().toLocaleString() : '';
            
            let messageContent = '';
            if (fav.messageType === 'image') {
                messageContent = '<i class="fas fa-image"></i> Фото';
            } else if (fav.messageType === 'file') {
                messageContent = '<i class="fas fa-file"></i> Файл';
            } else if (fav.messageType === 'video') {
                messageContent = '<i class="fas fa-video"></i> Видео';
            } else {
                messageContent = this.escapeHtml(fav.messageText || 'Сообщение');
            }
            
            item.innerHTML = `
                <div class="favorite-item-avatar">${this.escapeHtml(avatarText)}</div>
                <div class="favorite-item-content">
                    <div class="favorite-item-header">
                        <span class="favorite-item-chat">${this.escapeHtml(fav.chatName || 'Чат')}</span>
                        <span class="favorite-item-time">${this.escapeHtml(time)}</span>
                    </div>
                    <div class="favorite-item-message ${fav.messageType === 'file' || fav.messageType === 'image' || fav.messageType === 'video' ? 'file-message' : ''}">
                        ${messageContent}
                    </div>
                </div>
            `;
            
            item.addEventListener('click', () => {
                this.closeAllModals();
                this.selectChat(fav.chatId);
                setTimeout(() => {
                    this.scrollToMessage(fav.messageId);
                }, 500);
            });
            
            this.favoritesList.appendChild(item);
        });
    }
    
    async toggleFavorite(message) {
        if (!this.currentUser) return;
        try {
            const snapshot = await db.collection('favorites')
                .where('userId', '==', this.currentUser.uid)
                .where('messageId', '==', message.id)
                .get();
            if (!snapshot.empty) {
                await snapshot.docs[0].ref.delete();
                this.showToast('Удалено из избранного', 'info');
                return false;
            } else {
                await db.collection('favorites').add({
                    userId: this.currentUser.uid,
                    chatId: this.currentChatId,
                    messageId: message.id,
                    messageText: message.text || '',
                    messageType: message.type || 'text',
                    addedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                this.showToast('Добавлено в избранное', 'success');
                return true;
            }
        } catch (error) {
            console.error('Error toggling favorite:', error);
            this.showToast('Ошибка', 'error');
            return false;
        }
    }
    
    async toggleFavoriteMessage(messageId) {
        const message = this.messages[this.currentChatId]?.find(m => m.id === messageId);
        if (!message) return;
        const isFavorite = await this.toggleFavorite(message);
        const icon = document.querySelector(`[data-message-id="${messageId}"] .favorite-icon`);
        if (icon) {
            if (isFavorite) icon.className = 'fas fa-star favorite-icon active';
            else icon.className = 'far fa-star favorite-icon';
        }
    }
    
    scrollToMessage(messageId) {
        const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
        if (messageElement) {
            messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            messageElement.classList.add('highlight');
            setTimeout(() => messageElement.classList.remove('highlight'), 2000);
        }
    }
    
    subscribeToChats() {
        if (this.unsubscribeChats) this.unsubscribeChats();
        
        this.unsubscribeChats = db.collection('chats')
            .where('participants', 'array-contains', this.currentUser.uid)
            .onSnapshot((snapshot) => {
                Object.values(this.userPresenceListeners).forEach(unsubscribe => unsubscribe());
                this.userPresenceListeners = {};
                
                this.chats = [];
                snapshot.forEach(doc => {
                    const chat = { id: doc.id, ...doc.data() };
                    this.chats.push(chat);
                    
                    if (chat.type === 'private') {
                        const otherParticipantId = chat.participants.find(id => id !== this.currentUser.uid);
                        if (otherParticipantId && !this.userPresenceListeners[otherParticipantId]) {
                            this.userPresenceListeners[otherParticipantId] = db.collection('presence')
                                .doc(otherParticipantId)
                                .onSnapshot(() => {
                                    if (!this.showingArchive && !this.showingFavorites) this.renderChats();
                                });
                        }
                    }
                });
                
                this.chats.sort((a, b) => {
                    const timeA = a.lastMessageTime ? a.lastMessageTime.toDate() : new Date(0);
                    const timeB = b.lastMessageTime ? b.lastMessageTime.toDate() : new Date(0);
                    return timeB - timeA;
                });
                
                if (this.showingArchive) this.renderArchive();
                else this.renderChats();
                
                if (this.currentChatId) {
                    const currentChat = this.chats.find(c => c.id === this.currentChatId);
                    if (currentChat) {
                        if (currentChat.type === 'private') {
                            this.currentOtherUserId = currentChat.participants.find(id => id !== this.currentUser.uid);
                        } else {
                            this.currentOtherUserId = null;
                        }
                        this.updateChatHeader(currentChat);
                        if (this.archiveChatBtn) {
                            if (this.archivedChats.has(this.currentChatId)) {
                                this.archiveChatBtn.innerHTML = '<i class="fas fa-box-open"></i>';
                                this.archiveChatBtn.title = 'Разархивировать';
                            } else {
                                this.archiveChatBtn.innerHTML = '<i class="fas fa-archive"></i>';
                                this.archiveChatBtn.title = 'Архивировать';
                            }
                        }
                    } else {
                        this.currentChatId = null;
                        this.currentOtherUserId = null;
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
        if (this.unsubscribeMessages) this.unsubscribeMessages();
        
        this.unsubscribeMessages = db.collection('messages')
            .where('chatId', '==', chatId)
            .orderBy('timestamp')
            .onSnapshot((snapshot) => {
                const hadMessages = this.messages[chatId] && this.messages[chatId].length > 0;
                
                this.messages[chatId] = [];
                snapshot.forEach(doc => {
                    this.messages[chatId].push({ id: doc.id, ...doc.data() });
                });
                
                this.renderMessages(this.messages[chatId]);
                this.markMessagesAsRead(chatId);
                
                if (hadMessages && this.notificationsEnabled && document.hidden) {
                    this.playNotificationSound();
                }
            }, (error) => {
                console.error('Error subscribing to messages:', error);
                this.showToast('Ошибка загрузки сообщений', 'error');
            });
        
        db.collection('chats').doc(chatId).collection('typing')
            .doc(this.currentUser.uid)
            .onSnapshot((doc) => {
                if (doc.exists && doc.data().isTyping) this.showTypingIndicator();
                else this.hideTypingIndicator();
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
        snapshot.forEach(doc => batch.update(doc.ref, { read: true }));
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
        if (indicator) indicator.remove();
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
            if (error.code === 'auth/user-not-found') message = 'Пользователь не найден';
            else if (error.code === 'auth/wrong-password') message = 'Неверный пароль';
            else if (error.code === 'auth/invalid-email') message = 'Неверный формат email';
            else if (error.code === 'auth/invalid-login-credentials') message = 'Неверный email или пароль';
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
            const username = await this.generateUniqueUsername(name);
            await db.collection('usernames').doc(username).set({ uid: userCredential.user.uid });
            
            await userCredential.user.updateProfile({ displayName: name });
            
            await db.collection('users').doc(userCredential.user.uid).set({
                email: email,
                displayName: name,
                username: username,
                bio: '',
                avatarColor: this.getRandomColor(name),
                avatarURL: null,
                createdAt: new Date().toISOString()
            });
            
            this.showToast('Регистрация успешна!', 'success');
        } catch (error) {
            console.error('Registration error:', error);
            let message = 'Ошибка регистрации';
            if (error.code === 'auth/email-already-in-use') message = 'Email уже используется';
            else if (error.code === 'auth/invalid-email') message = 'Неверный формат email';
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
            const testEmail = `test_${Date.now()}@alexa.com`;
            const testPassword = '123456';
            const testName = 'Тестовый пользователь';
            
            const userCredential = await auth.createUserWithEmailAndPassword(testEmail, testPassword);
            const username = await this.generateUniqueUsername(testName);
            await db.collection('usernames').doc(username).set({ uid: userCredential.user.uid });
            
            await userCredential.user.updateProfile({ displayName: testName });
            await db.collection('users').doc(userCredential.user.uid).set({
                email: testEmail,
                displayName: testName,
                username: username,
                bio: 'Тестовый аккаунт',
                avatarColor: this.getRandomColor(testName),
                avatarURL: null,
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
            this.cleanupSubscriptions();
            await auth.signOut();
            this.currentUser = null;
            this.currentUserData = null;
            this.chats = [];
            this.currentChatId = null;
            this.currentOtherUserId = null;
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
            this.settingsUsername.value = this.currentUserData.username || '';
            this.settingsBio.value = this.currentUserData.bio || '';
            this.settingsColor.value = this.currentUserData.avatarColor || '#2AABEE';
            this.showModal('settingsModal');
        }
    }
    
    async saveSettings() {
        const newName = this.settingsName.value.trim();
        const newUsername = this.settingsUsername.value.trim().toLowerCase();
        const newBio = this.settingsBio.value.trim();
        const newColor = this.settingsColor.value;
        
        if (!newName) {
            this.showToast('Имя не может быть пустым', 'error');
            return;
        }
        
        if (newUsername) {
            if (!/^[a-z0-9_]{3,20}$/.test(newUsername)) {
                this.showToast('Username должен содержать только латиницу, цифры или _, от 3 до 20 символов', 'error');
                return;
            }
        } else {
            this.showToast('Username не может быть пустым', 'error');
            return;
        }
        
        try {
            if (newUsername !== this.currentUserData.username) {
                const available = await this.isUsernameAvailable(newUsername);
                if (!available) {
                    this.showToast('Этот username уже занят', 'error');
                    return;
                }
                await this.claimUsername(newUsername);
            }
            
            if (this.currentUser && this.currentUserData) {
                if (newName !== this.currentUserData.displayName) {
                    await this.currentUser.updateProfile({ displayName: newName });
                }
                
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
            !this.archivedChats.has(chat.id) && 
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
    
    async getUserStatus(userId) {
        try {
            const presenceDoc = await db.collection('presence').doc(userId).get();
            if (presenceDoc.exists) {
                const data = presenceDoc.data();
                if (data.online) return { text: 'в сети', color: '#2AABEE', online: true };
                else if (data.lastSeen) {
                    const lastSeen = data.lastSeen.toDate();
                    const now = new Date();
                    const diffMinutes = Math.floor((now - lastSeen) / 60000);
                    let text;
                    if (diffMinutes < 1) text = 'только что';
                    else if (diffMinutes < 60) text = `${diffMinutes} мин назад`;
                    else if (diffMinutes < 1440) text = `${Math.floor(diffMinutes / 60)} ч назад`;
                    else text = lastSeen.toLocaleDateString();
                    return { text, color: '#707579', online: false };
                }
            }
            return { text: '', color: '#707579', online: false };
        } catch (error) {
            console.error('Error getting user status:', error);
            return { text: '', color: '#707579', online: false };
        }
    }
    
    createChatElement(chat, isArchive = false) {
        const div = document.createElement('div');
        div.className = `chat-item ${this.currentChatId === chat.id ? 'active' : ''} ${isArchive ? 'archived' : ''}`;
        if (chat.unreadCount > 0 && chat.lastMessageSender !== this.currentUser?.uid && !isArchive) {
            div.classList.add('unread');
        }
        div.dataset.chatId = chat.id;
        
        const lastMessageTime = chat.lastMessageTime ? chat.lastMessageTime.toDate() : new Date();
        const timeString = this.formatTime(lastMessageTime);
        
        let displayName = chat.name;
        if (chat.type === 'private') {
            displayName = this.getDisplayNameForChat(chat, this.currentUser.uid);
        }
        
        const icon = chat.type === 'channel' ? '<i class="fas fa-bullhorn" style="margin-right: 5px;"></i>' : '';
        
        div.innerHTML = `
            <div class="chat-item-avatar" style="background: ${chat.avatarColor || this.getRandomColor(chat.name)}">${chat.name.charAt(0).toUpperCase()}</div>
            <div class="chat-item-info">
                <div class="chat-item-header">
                    <span class="chat-item-name">${icon}${this.escapeHtml(displayName)}</span>
                    <span class="chat-item-time">${timeString}</span>
                </div>
                <div class="chat-item-last-message">
                    ${chat.lastMessage ? this.escapeHtml(chat.lastMessage.substring(0, 30)) + (chat.lastMessage.length > 30 ? '...' : '') : 'Нет сообщений'}
                </div>
            </div>
        `;
        
        div.addEventListener('click', () => {
            if (isArchive) {
                this.selectChat(chat.id);
                this.exitArchive();
            } else {
                this.selectChat(chat.id);
            }
        });
        
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
            if (chat.type === 'private') {
                this.currentOtherUserId = chat.participants.find(id => id !== this.currentUser.uid);
            } else {
                this.currentOtherUserId = null;
            }
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
        
        if (chat.avatarURL) {
            this.renderAvatar(this.chatAvatar, avatarText, avatarColor, chat.avatarURL);
        } else {
            this.chatAvatar.textContent = avatarText;
            this.chatAvatar.style.backgroundColor = avatarColor;
        }
        
        let displayName = chat.name;
        if (chat.type === 'private') {
            displayName = this.getDisplayNameForChat(chat, this.currentUser.uid);
        }
        this.chatName.textContent = displayName;
        
        // Управление кнопками для каналов
        if (chat.type === 'channel') {
            const isSubscribed = chat.subscribers && chat.subscribers.includes(this.currentUser.uid);
            const isOwner = chat.ownerId === this.currentUser.uid;
            
            this.manageChannelBtn.style.display = isOwner ? 'inline-flex' : 'none';
            
            if (isOwner) {
                this.subscribeChannelBtn.style.display = 'none';
                this.unsubscribeChannelBtn.style.display = 'none';
            } else {
                if (isSubscribed) {
                    this.subscribeChannelBtn.style.display = 'none';
                    this.unsubscribeChannelBtn.style.display = 'inline-flex';
                } else {
                    this.subscribeChannelBtn.style.display = 'inline-flex';
                    this.unsubscribeChannelBtn.style.display = 'none';
                }
            }
            
            this.chatStatus.style.display = 'none';
            
            if (!this.canSendMessage(chat)) {
                this.messageInput.disabled = true;
                this.attachBtn.disabled = true;
                this.sendMessageBtn.disabled = true;
                this.messageInput.placeholder = 'Только чтение';
            } else {
                this.messageInput.disabled = false;
                this.attachBtn.disabled = false;
                this.sendMessageBtn.disabled = false;
                this.messageInput.placeholder = 'Написать сообщение...';
            }
        } else {
            this.manageChannelBtn.style.display = 'none';
            this.subscribeChannelBtn.style.display = 'none';
            this.unsubscribeChannelBtn.style.display = 'none';
            this.chatStatus.style.display = 'block';
            this.messageInput.disabled = false;
            this.attachBtn.disabled = false;
            this.sendMessageBtn.disabled = false;
            this.messageInput.placeholder = 'Написать сообщение...';
        }
        
        if (this.archiveChatBtn) {
            if (this.archivedChats.has(chat.id)) {
                this.archiveChatBtn.innerHTML = '<i class="fas fa-box-open"></i>';
                this.archiveChatBtn.title = 'Разархивировать';
            } else {
                this.archiveChatBtn.innerHTML = '<i class="fas fa-archive"></i>';
                this.archiveChatBtn.title = 'Архивировать';
            }
        }
        
        this.updateChatStatus(chat);
    }
    
    async updateChatStatus(chat) {
        if (chat.type !== 'private') return;
        
        const otherParticipantId = chat.participants.find(id => id !== this.currentUser.uid);
        if (!otherParticipantId) return;
        
        if (this.currentStatusListener) {
            this.currentStatusListener();
            this.currentStatusListener = null;
        }
        
        const presenceRef = db.collection('presence').doc(otherParticipantId);
        this.currentStatusListener = presenceRef.onSnapshot((doc) => {
            if (doc.exists) {
                const data = doc.data();
                if (data.online) {
                    this.chatStatus.textContent = 'в сети';
                    this.chatStatus.style.color = '#2AABEE';
                } else if (data.lastSeen) {
                    const lastSeen = data.lastSeen.toDate();
                    const now = new Date();
                    const diffMinutes = Math.floor((now - lastSeen) / 60000);
                    
                    if (diffMinutes < 1) this.chatStatus.textContent = 'был(а) только что';
                    else if (diffMinutes < 60) this.chatStatus.textContent = `был(а) ${diffMinutes} мин назад`;
                    else this.chatStatus.textContent = `был(а) в ${lastSeen.toLocaleTimeString()}`;
                    this.chatStatus.style.color = '#707579';
                }
            }
        });
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
                if (messageDate === today) dateText = 'Сегодня';
                else if (messageDate === yesterday) dateText = 'Вчера';
                else dateText = message.timestamp.toDate().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
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
        div.className = `message ${message.senderId === this.currentUser?.uid ? 'sent' : 'received'}`;
        div.dataset.messageId = message.id;
        
        let time = '';
        if (message.timestamp) {
            time = message.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        
        let content = '';
        if (message.type === 'image') {
            content = `
                <div class="message-content image" onclick="window.open('${message.fileURL}', '_blank')">
                    <img src="${message.fileURL}" alt="Image" style="max-width: 100%; max-height: 400px;">
                </div>
            `;
        } else if (message.type === 'video') {
            content = `
                <div class="message-content video">
                    <video controls style="max-width: 100%; max-height: 400px; border-radius: 12px;">
                        <source src="${message.fileURL}" type="${message.fileType}">
                    </video>
                </div>
            `;
        } else if (message.type === 'file') {
            content = `
                <div class="message-content file" onclick="window.open('${message.fileURL}')">
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
        if (message.senderId === this.currentUser?.uid) {
            if (message.read) statusIcon = '<i class="fas fa-check-double message-status read"></i>';
            else statusIcon = '<i class="fas fa-check message-status"></i>';
        }
        
        const favoriteIcon = '<i class="far fa-star favorite-icon" onclick="event.stopPropagation(); window.app.toggleFavoriteMessage(\'' + message.id + '\')"></i>';
        
        div.innerHTML = `
            ${content}
            <div class="message-info">
                <span class="message-time">${time}</span>
                ${statusIcon}
                ${favoriteIcon}
            </div>
        `;
        
        return div;
    }
    
    formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
        return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
    }
    
    // ========== ЗАГРУЗКА ФАЙЛОВ ==========
    async uploadFile(file) {
        if (!this.currentChatId) {
            this.showToast('Выберите чат', 'error');
            return;
        }
        
        const chat = this.chats.find(c => c.id === this.currentChatId);
        if (!this.canSendMessage(chat)) {
            this.showToast('Вы не можете отправлять сообщения в этот канал', 'error');
            return;
        }
        
        if (file.size > this.maxFileSize) {
            this.showToast(`Файл слишком большой. Максимальный размер: ${this.formatFileSize(this.maxFileSize)}`, 'error');
            return;
        }
        
        this.attachBtn.disabled = true;
        
        try {
            this.showUploadProgress(file.name);
            
            const isImage = file.type.startsWith('image/');
            const isVideo = file.type.startsWith('video/');
            
            let fileToUpload = file;
            if (isImage && this.compressionEnabled && file.size > 1024 * 1024) {
                fileToUpload = await this.compressImage(file);
            }
            
            const timestamp = Date.now();
            const randomString = Math.random().toString(36).substring(2, 15);
            const extension = file.name.split('.').pop();
            const fileName = `${timestamp}_${randomString}.${extension}`;
            const storagePath = `chats/${this.currentChatId}/${fileName}`;
            const storageRef = storage.ref().child(storagePath);
            
            const metadata = {
                contentType: file.type,
                customMetadata: {
                    originalName: file.name,
                    uploadedBy: this.currentUser.uid,
                    chatId: this.currentChatId
                }
            };
            
            const uploadTask = storageRef.put(fileToUpload, metadata);
            this.uploadTasks.set(storagePath, uploadTask);
            
            uploadTask.on('state_changed', 
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    this.updateUploadProgress(progress);
                },
                (error) => {
                    console.error('Upload error:', error);
                    this.hideUploadProgress();
                    this.uploadTasks.delete(storagePath);
                    this.attachBtn.disabled = false;
                    this.showToast('Ошибка загрузки: ' + error.message, 'error');
                },
                async () => {
                    try {
                        const fileURL = await storageRef.getDownloadURL();
                        const message = {
                            type: isImage ? 'image' : (isVideo ? 'video' : 'file'),
                            text: isImage ? '📷 Фото' : (isVideo ? '🎥 Видео' : '📎 Файл'),
                            fileURL: fileURL,
                            filePath: storagePath,
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
                        await db.collection('chats').doc(this.currentChatId).update({
                            lastMessage: message.text,
                            lastMessageTime: firebase.firestore.FieldValue.serverTimestamp(),
                            lastMessageSender: this.currentUser.uid
                        });
                        
                        this.hideUploadProgress();
                        this.uploadTasks.delete(storagePath);
                        this.attachBtn.disabled = false;
                        this.showToast('Файл загружен', 'success');
                    } catch (error) {
                        console.error('Error saving message:', error);
                        this.hideUploadProgress();
                        this.attachBtn.disabled = false;
                        this.showToast('Ошибка при сохранении', 'error');
                    }
                }
            );
            
        } catch (error) {
            console.error('Upload error:', error);
            this.hideUploadProgress();
            this.attachBtn.disabled = false;
            this.showToast('Ошибка загрузки: ' + error.message, 'error');
        }
        
        this.fileInput.value = '';
    }
    
    compressImage(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (e) => {
                const img = new Image();
                img.src = e.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    const MAX_WIDTH = 1920;
                    const MAX_HEIGHT = 1080;
                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    canvas.toBlob((blob) => {
                        if (blob) {
                            const compressedFile = new File([blob], file.name, {
                                type: file.type,
                                lastModified: Date.now()
                            });
                            resolve(compressedFile);
                        } else {
                            resolve(file);
                        }
                    }, file.type, 0.8);
                };
                img.onerror = reject;
            };
            reader.onerror = reject;
        });
    }
    
    showUploadProgress(filename) {
        if (this.uploadProgress) {
            this.uploadProgressFilename.textContent = `Загрузка: ${filename}`;
            this.uploadProgress.classList.add('show');
            this.currentUploadPath = filename;
        }
    }
    
    updateUploadProgress(percent) {
        if (this.uploadProgressBar && this.uploadProgressText) {
            const roundedPercent = Math.round(percent);
            this.uploadProgressBar.style.width = roundedPercent + '%';
            this.uploadProgressText.textContent = roundedPercent + '%';
        }
    }
    
    hideUploadProgress() {
        if (this.uploadProgress) {
            this.uploadProgress.classList.remove('show');
            this.uploadProgressBar.style.width = '0%';
            this.uploadProgressText.textContent = '0%';
        }
    }
    
    cancelCurrentUpload() {
        if (this.currentUploadPath && this.uploadTasks.has(this.currentUploadPath)) {
            const uploadTask = this.uploadTasks.get(this.currentUploadPath);
            uploadTask.cancel();
            this.uploadTasks.delete(this.currentUploadPath);
            this.hideUploadProgress();
            this.attachBtn.disabled = false;
            this.showToast('Загрузка отменена', 'info');
        }
    }
    
    async sendMessage() {
        const text = this.messageInput.value.trim();
        if (!text || !this.currentChatId) return;
        
        const chat = this.chats.find(c => c.id === this.currentChatId);
        if (!this.canSendMessage(chat)) {
            this.showToast('Вы не можете отправлять сообщения в этот канал', 'error');
            return;
        }
        
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
    
    async deleteCurrentChat() {
        if (!this.currentChatId) return;
        
        const chat = this.chats.find(c => c.id === this.currentChatId);
        if (chat && chat.type === 'channel' && chat.ownerId !== this.currentUser.uid) {
            this.showToast('Только владелец может удалить канал', 'error');
            return;
        }
        
        if (confirm('Удалить чат? Все сообщения будут удалены.')) {
            try {
                if (this.unsubscribeMessages) {
                    this.unsubscribeMessages();
                    this.unsubscribeMessages = null;
                }
                if (this.currentStatusListener) {
                    this.currentStatusListener();
                    this.currentStatusListener = null;
                }
                const messagesRef = db.collection('messages').where('chatId', '==', this.currentChatId);
                const snapshot = await messagesRef.get();
                const batch = db.batch();
                snapshot.forEach(doc => batch.delete(doc.ref));
                batch.delete(db.collection('chats').doc(this.currentChatId));
                await batch.commit();
                this.currentChatId = null;
                this.currentOtherUserId = null;
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
        const input = this.newChatEmail.value.trim();
        const name = this.newChatName.value.trim();
        
        if (!input || !name) {
            this.showToast('Заполните все поля', 'error');
            return;
        }
        
        if (input === this.currentUser.email || input === '@' + this.currentUserData.username) {
            this.showToast('Нельзя создать чат с самим собой', 'error');
            return;
        }
        
        try {
            const usersRef = db.collection('users');
            let query;
            if (input.startsWith('@')) {
                const username = input.substring(1);
                query = usersRef.where('username', '==', username).limit(1);
            } else {
                query = usersRef.where('email', '==', input).limit(1);
            }
            
            const snapshot = await query.get();
            
            if (snapshot.empty) {
                this.showToast('Пользователь не найден', 'error');
                return;
            }
            
            const otherUser = snapshot.docs[0];
            const otherUserData = otherUser.data();
            const otherUserName = otherUserData.displayName || otherUserData.email.split('@')[0];
            
            const chatsRef = db.collection('chats').where('participants', 'array-contains', this.currentUser.uid);
            const existingChats = await chatsRef.get();
            
            let chatExists = false;
            existingChats.forEach(doc => {
                const chat = doc.data();
                if (chat.participants && chat.participants.includes(otherUser.id) && chat.type === 'private') {
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
                unreadCount: 0,
                customNames: {
                    [this.currentUser.uid]: name,
                    [otherUser.id]: otherUserName
                }
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
        if (this.showingArchive) this.renderArchive();
        else this.renderChats();
    }
    
    showModal(modalId) {
        document.getElementById(modalId).classList.add('show');
    }
    
    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => modal.classList.remove('show'));
        this.showingFavorites = false;
    }
    
    scrollToBottom() {
        setTimeout(() => {
            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        }, 100);
    }
    
    showToast(message, type = 'info') {
        this.toast.textContent = message;
        this.toast.className = `toast show ${type}`;
        setTimeout(() => this.toast.classList.remove('show'), 3000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new AlexaApp();
});
