// DuoStreak Client Application for Yavuz & Nisa
(function() {
  'use strict';

  // State
  let socket = null;
  let currentUser = 'user1'; // 'user1' (Yavuz) or 'user2' (Nisa)
  let usersData = {};
  let streakData = {
    currentStreak: 285,
    isGreyedOut: true,
    freezesRemaining: 20
  };
  let wallpaperSettings = {
    type: 'oled',
    url: '',
    blur: 0,
    opacity: 100,
    brightness: 100
  };
  let messages = [];
  let memories = [];
  let replyingTo = null;
  let isTyping = false;
  let typingTimeout = null;
  let selectedPreset = 'oled';
  let activeSnapMessage = null;
  let snapProgressInterval = null;

  // Voice recording state
  let mediaRecorder = null;
  let audioChunks = [];
  let recordingStartTime = null;
  let recordingTimerInterval = null;

  // DOM Elements
  const el = {
    // Header & Partner
    partnerName: document.getElementById('partner-name'),
    partnerAvatar: document.getElementById('partner-avatar'),
    partnerStatusDot: document.getElementById('partner-status-dot'),
    partnerStatusText: document.getElementById('partner-status-text'),
    partnerTypingBadge: document.getElementById('partner-typing-badge'),
    
    // Streak Header
    headerStreakCount: document.getElementById('header-streak-count'),
    headerStreakTimer: document.getElementById('header-streak-timer'),
    streakPillBtn: document.getElementById('streak-pill-btn'),
    headerFlameEmoji: document.getElementById('header-flame-emoji'),
    
    // Banner
    bannerUser1Avatar: document.getElementById('banner-user1-avatar'),
    bannerUser1Name: document.getElementById('banner-user1-name'),
    bannerUser1Check: document.getElementById('banner-user1-check'),
    bannerUser2Avatar: document.getElementById('banner-user2-avatar'),
    bannerUser2Name: document.getElementById('banner-user2-name'),
    bannerUser2Check: document.getElementById('banner-user2-check'),
    bannerSubInfo: document.getElementById('banner-sub-info'),

    // Chat list & input
    chatContainer: document.getElementById('chat-container'),
    messagesList: document.getElementById('messages-list'),
    scrollBottomBtn: document.getElementById('scroll-bottom-btn'),
    messageInput: document.getElementById('message-input'),
    btnSend: document.getElementById('btn-send'),
    btnAttach: document.getElementById('btn-attach'),
    attachPopover: document.getElementById('attach-popover'),
    btnAttachNormalPhoto: document.getElementById('btn-attach-normal-photo'),
    btnAttachSnapPhoto: document.getElementById('btn-attach-snap-photo'),
    fileInputImage: document.getElementById('file-input-image'),
    fileInputSnap: document.getElementById('file-input-snap'),
    fileInputWallpaper: document.getElementById('file-input-wallpaper'),
    fileInputAvatar: document.getElementById('file-input-avatar'),
    btnEmojiToggle: document.getElementById('btn-emoji-toggle'),
    emojiPickerPanel: document.getElementById('emoji-picker-panel'),

    // Reply Bar
    replyPreviewBar: document.getElementById('reply-preview-bar'),
    replyToUser: document.getElementById('reply-to-user'),
    replyToText: document.getElementById('reply-to-text'),
    replyCancelBtn: document.getElementById('reply-cancel-btn'),

    // Voice Recorder
    btnVoiceRecord: document.getElementById('btn-voice-record'),
    voiceRecordingBar: document.getElementById('voice-recording-bar'),
    voiceRecordingTime: document.getElementById('voice-recording-time'),
    btnVoiceCancel: document.getElementById('btn-voice-cancel'),
    btnVoiceSend: document.getElementById('btn-voice-send'),

    // Wallpaper
    wallpaperLayer: document.getElementById('wallpaper-layer'),
    wallpaperOverlay: document.getElementById('wallpaper-overlay'),
    btnWallpaperModal: document.getElementById('btn-wallpaper-modal'),
    modalWallpaper: document.getElementById('modal-wallpaper'),
    btnCloseWallpaperModal: document.getElementById('btn-close-wallpaper-modal'),
    btnTriggerWallpaperUpload: document.getElementById('btn-trigger-wallpaper-upload'),
    blurSlider: document.getElementById('wallpaper-blur-slider'),
    opacitySlider: document.getElementById('wallpaper-opacity-slider'),
    brightnessSlider: document.getElementById('wallpaper-brightness-slider'),
    blurValLabel: document.getElementById('blur-val-label'),
    opacityValLabel: document.getElementById('opacity-val-label'),
    brightnessValLabel: document.getElementById('brightness-val-label'),
    btnResetWallpaper: document.getElementById('btn-reset-wallpaper'),
    btnSaveWallpaper: document.getElementById('btn-save-wallpaper'),

    // Streak Modal
    modalStreak: document.getElementById('modal-streak'),
    btnCloseStreakModal: document.getElementById('btn-close-streak-modal'),
    modalStreakHero: document.getElementById('modal-streak-hero'),
    modalHeroFlame: document.getElementById('modal-hero-flame'),
    modalStreakVal: document.getElementById('modal-streak-val'),
    modalStreakStatusLbl: document.getElementById('modal-streak-status-lbl'),
    modalStreakTimerTag: document.getElementById('modal-streak-timer-tag'),
    statBestStreak: document.getElementById('stat-best-streak'),
    statFreezes: document.getElementById('stat-freezes'),
    statTotalMessages: document.getElementById('stat-total-messages'),
    btnActivateRevive: document.getElementById('btn-activate-revive'),
    badgesGrid: document.getElementById('badges-grid'),

    // Memory Vault Modal
    btnMemoryVault: document.getElementById('btn-memory-vault'),
    modalMemory: document.getElementById('modal-memory'),
    btnCloseMemoryModal: document.getElementById('btn-close-memory-modal'),
    memoriesList: document.getElementById('memories-list'),

    // Settings Modal
    btnSettings: document.getElementById('btn-settings'),
    modalSettings: document.getElementById('modal-settings'),
    btnCloseSettingsModal: document.getElementById('btn-close-settings-modal'),
    settingsAvatarPreview: document.getElementById('settings-avatar-preview'),
    btnChangeAvatarPhoto: document.getElementById('btn-change-avatar-photo'),
    settingsInputName: document.getElementById('settings-input-name'),
    settingsPickYavuz: document.getElementById('settings-pick-yavuz'),
    settingsPickNisa: document.getElementById('settings-pick-nisa'),
    btnLockSite: document.getElementById('btn-lock-site'),
    btnSaveSettings: document.getElementById('btn-save-settings'),

    // Privacy & Lightbox & Celebration
    btnPrivacyLock: document.getElementById('btn-privacy-lock'),
    lightboxOverlay: document.getElementById('lightbox-overlay'),
    lightboxImage: document.getElementById('lightbox-image'),
    btnCloseLightbox: document.getElementById('btn-close-lightbox'),
    snapViewerOverlay: document.getElementById('snap-viewer-overlay'),
    snapProgressFill: document.getElementById('snap-progress-fill'),
    snapSenderName: document.getElementById('snap-sender-name'),
    snapTimerCount: document.getElementById('snap-timer-count'),
    snapImageDisplay: document.getElementById('snap-image-display'),
    streakCelebrationOverlay: document.getElementById('streak-celebration-overlay'),
    celebrationStreakNumber: document.getElementById('celebration-streak-number'),
    btnCloseCelebration: document.getElementById('btn-close-celebration'),

    // Password Lock Screen Modal
    modalPasswordAuth: document.getElementById('modal-password-auth'),
    sitePasswordInput: document.getElementById('site-password-input'),
    btnSubmitPassword: document.getElementById('btn-submit-password'),
    passwordErrorText: document.getElementById('password-error-text'),
    deviceIdentitySetup: document.getElementById('device-identity-setup'),
    btnPickYavuz: document.getElementById('btn-pick-yavuz'),
    btnPickNisa: document.getElementById('btn-pick-nisa')
  };

  // Initialize Application
  async function initApp() {
    setupSocket();
    await fetchInitialData();
    setupEventListeners();
    checkPasswordAuth();
  }

  // Socket Connection Setup
  function setupSocket() {
    socket = io();

    socket.on('connect', () => {
      if (currentUser) {
        socket.emit('user_join', currentUser);
      }
    });

    socket.on('presence_update', ({ users }) => {
      usersData = users;
      updateHeaderAndBanner();
    });

    socket.on('typing_status', ({ userId, isTyping }) => {
      if (userId !== currentUser && el.partnerTypingBadge) {
        el.partnerTypingBadge.style.display = isTyping ? 'inline-flex' : 'none';
        if (isTyping) {
          el.partnerStatusText.textContent = 'yazıyor...';
        } else {
          updatePartnerStatusText();
        }
      }
    });

    socket.on('new_message', ({ message }) => {
      messages.push(message);
      renderSingleMessage(message);
      scrollToBottom();

      if (message.senderId !== currentUser) {
        window.soundFX.playReceiveSound();
        socket.emit('message_read', { messageId: message.id, userId: currentUser });
      }
    });

    socket.on('streak_updated', ({ streak, levelUp, leveledStreak, action }) => {
      streakData = streak;
      updateStreakUI();

      if (levelUp) {
        window.soundFX.playStreakLevelUp();
        triggerStreakCelebration(leveledStreak);
      } else if (action === 'streak_revived') {
        window.soundFX.playStreakLevelUp();
        triggerStreakCelebration(streak.currentStreak);
        alert('❤️‍🩹 Harika! Seriniz canlandırıldı ve koruma altına alındı.');
      }
    });

    socket.on('reaction_updated', ({ messageId, reactions }) => {
      const msg = messages.find(m => m.id === messageId);
      if (msg) {
        msg.reactions = reactions;
        updateMessageReactionsDOM(messageId, reactions);
      }
    });

    socket.on('message_read_receipt', ({ messageId, readBy }) => {
      const msg = messages.find(m => m.id === messageId);
      if (msg) {
        msg.readBy = readBy;
        updateMessageReadTicksDOM(messageId, readBy);
      }
    });

    socket.on('snap_status_updated', ({ messageId, snapViewedBy }) => {
      const msg = messages.find(m => m.id === messageId);
      if (msg) {
        msg.snapViewedBy = snapViewedBy;
        updateSnapBubbleDOM(messageId, snapViewedBy);
      }
    });

    socket.on('wallpaper_updated', ({ userId, wallpapers }) => {
      if (!userId || userId === currentUser) {
        const wp = (userId && wallpapers[userId]) ? wallpapers[userId] : wallpapers.current;
        applyWallpaper(wp);
      }
    });

    socket.on('memory_updated', ({ messageId, isSaved, memories: updatedMemories }) => {
      memories = updatedMemories;
      const msg = messages.find(m => m.id === messageId);
      if (msg) msg.isSaved = isSaved;
      updateMessageStarDOM(messageId, isSaved);
      renderMemoriesList();
    });

    socket.on('user_updated', ({ userId, user }) => {
      usersData[userId] = user;
      updateHeaderAndBanner();
    });
  }

  // Fetch Initial Data
  async function fetchInitialData() {
    try {
      const res = await fetch('/api/init');
      const data = await res.json();
      usersData = data.users;
      streakData = data.streak;
      wallpaperSettings = data.wallpapers.current || wallpaperSettings;
      memories = data.memories || [];

      applyWallpaper(wallpaperSettings);
      updateStreakUI();

      // Fetch messages
      const msgRes = await fetch('/api/messages?limit=150');
      const msgData = await msgRes.json();
      messages = msgData.messages || [];
      renderAllMessages();

      window.streakEngine.startCountdownTimer(onTimerTick);
    } catch (err) {
      console.error('Init error:', err);
    }
  }

  // Password & Device Identity Logic
  function checkPasswordAuth() {
    const isAuthed = sessionStorage.getItem('duostreak_authed') === 'true';
    const storedUser = localStorage.getItem('duostreak_device_user');

    if (isAuthed) {
      if (storedUser) {
        currentUser = storedUser;
        el.modalPasswordAuth.style.display = 'none';
        socket.emit('user_join', currentUser);
        updateHeaderAndBanner();
      } else {
        showDeviceIdentitySetup();
      }
    } else {
      el.modalPasswordAuth.style.display = 'flex';
      el.sitePasswordInput.focus();
    }
  }

  async function handlePasswordSubmit() {
    const password = el.sitePasswordInput.value.trim();
    if (!password) return;

    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      const data = await res.json();
      if (data.success) {
        sessionStorage.setItem('duostreak_authed', 'true');
        el.passwordErrorText.style.display = 'none';

        const storedUser = localStorage.getItem('duostreak_device_user');
        if (storedUser) {
          currentUser = storedUser;
          el.modalPasswordAuth.style.display = 'none';
          socket.emit('user_join', currentUser);
          updateHeaderAndBanner();
        } else {
          showDeviceIdentitySetup();
        }
      } else {
        el.passwordErrorText.style.display = 'block';
        el.sitePasswordInput.value = '';
        el.sitePasswordInput.focus();
      }
    } catch (err) {
      console.error(err);
      el.passwordErrorText.style.display = 'block';
    }
  }

  function showDeviceIdentitySetup() {
    document.querySelector('.password-form-box').style.display = 'none';
    el.deviceIdentitySetup.style.display = 'flex';
  }

  function setDeviceUser(userId) {
    currentUser = userId;
    localStorage.setItem('duostreak_device_user', userId);
    el.modalPasswordAuth.style.display = 'none';
    socket.emit('user_join', currentUser);
    updateHeaderAndBanner();
    renderAllMessages();
  }

  function getPartnerId() {
    return currentUser === 'user1' ? 'user2' : 'user1';
  }

  // UI Updates
  function updateHeaderAndBanner() {
    const partnerId = getPartnerId();
    const partner = usersData[partnerId] || (partnerId === 'user2' ? { name: 'Nisa', avatar: '🌸' } : { name: 'Yavuz', avatar: '🐺' });
    const me = usersData[currentUser] || (currentUser === 'user1' ? { name: 'Yavuz', avatar: '🐺' } : { name: 'Nisa', avatar: '🌸' });

    // Partner header
    el.partnerName.textContent = partner.name;
    if (partner.customAvatarUrl) {
      el.partnerAvatar.textContent = '';
      el.partnerAvatar.style.backgroundImage = `url(${partner.customAvatarUrl})`;
    } else {
      el.partnerAvatar.style.backgroundImage = 'none';
      el.partnerAvatar.textContent = partner.avatar || (partnerId === 'user2' ? '🌸' : '🐺');
    }

    el.partnerStatusDot.className = `status-indicator ${partner.status === 'online' ? 'online' : ''}`;
    updatePartnerStatusText();

    // Banner statuses
    const u1 = usersData['user1'] || { name: 'Yavuz', avatar: '🐺' };
    const u2 = usersData['user2'] || { name: 'Nisa', avatar: '🌸' };

    el.bannerUser1Name.textContent = u1.name;
    el.bannerUser1Avatar.textContent = u1.avatar;
    el.bannerUser2Name.textContent = u2.name;
    el.bannerUser2Avatar.textContent = u2.avatar;

    const u1Done = streakData.user1MessagedToday;
    const u2Done = streakData.user2MessagedToday;

    el.bannerUser1Check.textContent = u1Done ? '✅' : '⏳';
    el.bannerUser1Check.className = `banner-check ${u1Done ? 'done' : ''}`;
    el.bannerUser2Check.textContent = u2Done ? '✅' : '⏳';
    el.bannerUser2Check.className = `banner-check ${u2Done ? 'done' : ''}`;

    if (u1Done && u2Done) {
      el.bannerSubInfo.textContent = '🎉 Harikasınız! Bugünkü kesintisiz aşk seriniz tamamlandı ve arttı!';
    } else if (u1Done || u2Done) {
      const pendingName = !u1Done ? u1.name : u2.name;
      el.bannerSubInfo.textContent = `⏳ ${pendingName} mesaj gönderdiğinde seri rengine kavuşacak ve artacak!`;
    } else {
      el.bannerSubInfo.textContent = 'Seri her gece 00:00\'da griye döner; ikiniz de yazdığınızda canlanıp artar!';
    }

    // Update settings device pickers
    if (currentUser === 'user1') {
      el.settingsPickYavuz.classList.add('active');
      el.settingsPickNisa.classList.remove('active');
    } else {
      el.settingsPickNisa.classList.add('active');
      el.settingsPickYavuz.classList.remove('active');
    }
  }

  function updatePartnerStatusText() {
    const partnerId = getPartnerId();
    const partner = usersData[partnerId];
    if (!partner) return;
    el.partnerStatusText.textContent = partner.status === 'online' ? 'Çevrimiçi 🟢' : 'Çevrimdışı';
  }

  function updateStreakUI() {
    const current = streakData.currentStreak || 285;
    el.headerStreakCount.textContent = current;
    el.modalStreakVal.textContent = current;
    el.statBestStreak.textContent = streakData.bestStreak || current;
    el.statFreezes.textContent = streakData.freezesRemaining ?? 20;
    el.statTotalMessages.textContent = messages.length;

    // Visual State on Header Streak Pill
    el.streakPillBtn.className = 'streak-pill';

    if (streakData.isExtinguished) {
      el.streakPillBtn.classList.add('streak-extinguished');
      el.headerFlameEmoji.textContent = '🌑';
      el.modalHeroFlame.textContent = '🌑';
      el.modalStreakStatusLbl.textContent = 'SERİ SÖNDÜ (CANLANDIRILABİLİR)';
    } else if (streakData.isGreyedOut || !streakData.streakCompletedToday) {
      // 00:00 gri hali
      el.streakPillBtn.classList.add('streak-greyed');
      el.headerFlameEmoji.textContent = '🩶';
      el.modalHeroFlame.textContent = '🩶';
      el.modalStreakStatusLbl.textContent = 'BUGÜNÜN SERİSİ BEKLENİYOR (GRİ)';
    } else {
      // Canlı & Renkli
      el.streakPillBtn.classList.add('streak-active');
      el.headerFlameEmoji.textContent = '🔥';
      el.modalHeroFlame.textContent = '🔥';
      el.modalStreakStatusLbl.textContent = 'GÜNLÜK KESİNTİSİZ AŞK SERİSİ';
    }

    // Render badges
    window.streakEngine.renderBadgesGrid(el.badgesGrid, current);
  }

  function onTimerTick({ formatted, isUrgent }) {
    el.headerStreakTimer.textContent = formatted;
    el.modalStreakTimerTag.textContent = `⏳ Gece 00:00'a Kalan: ${formatted}`;

    if (isUrgent && (!streakData.user1MessagedToday || !streakData.user2MessagedToday)) {
      el.headerStreakTimer.classList.add('urgent');
    } else {
      el.headerStreakTimer.classList.remove('urgent');
    }
  }

  // Wallpaper Application Logic
  function applyWallpaper(wp) {
    if (!wp) return;
    wallpaperSettings = { ...wallpaperSettings, ...wp };
    const { type, url, blur, opacity, brightness } = wallpaperSettings;

    el.wallpaperLayer.className = 'wallpaper-layer';

    if (type === 'custom' && url) {
      el.wallpaperLayer.style.backgroundImage = `url(${url})`;
      el.wallpaperLayer.style.backgroundColor = '#000';
    } else if (type === 'preset') {
      el.wallpaperLayer.style.backgroundImage = 'none';
      el.wallpaperLayer.classList.add(`bg-${selectedPreset}`);
    } else {
      el.wallpaperLayer.style.backgroundImage = 'none';
      el.wallpaperLayer.classList.add('bg-oled');
    }

    el.wallpaperLayer.style.filter = `blur(${blur || 0}px) brightness(${brightness || 100}%)`;
    el.wallpaperLayer.style.opacity = (opacity || 100) / 100;

    el.blurSlider.value = blur || 0;
    el.blurValLabel.textContent = `${blur || 0}px`;
    el.opacitySlider.value = opacity || 100;
    el.opacityValLabel.textContent = `${opacity || 100}%`;
    el.brightnessSlider.value = brightness || 100;
    el.brightnessValLabel.textContent = `${brightness || 100}%`;
  }

  // ==========================================================================
  // MESSAGE RENDERING
  // ==========================================================================

  function renderAllMessages() {
    el.messagesList.innerHTML = '';
    let lastDate = null;

    messages.forEach(msg => {
      const msgDate = new Date(msg.timestamp).toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long'
      });

      if (msgDate !== lastDate) {
        const divider = document.createElement('div');
        divider.className = 'date-divider';
        divider.innerHTML = `<span>${msgDate}</span>`;
        el.messagesList.appendChild(divider);
        lastDate = msgDate;
      }

      renderSingleMessage(msg);
    });

    scrollToBottom();
  }

  function renderSingleMessage(msg) {
    const isOutgoing = msg.senderId === currentUser;
    const sender = usersData[msg.senderId] || (msg.senderId === 'user1' ? { name: 'Yavuz', avatar: '🐺' } : { name: 'Nisa', avatar: '🌸' });

    const row = document.createElement('div');
    row.className = `message-row ${isOutgoing ? 'outgoing' : 'incoming'}`;
    row.id = `msg-row-${msg.id}`;

    const avatarDiv = document.createElement('div');
    avatarDiv.className = 'message-avatar';
    if (sender.customAvatarUrl) {
      avatarDiv.style.backgroundImage = `url(${sender.customAvatarUrl})`;
    } else {
      avatarDiv.textContent = sender.avatar || '❤️';
    }

    const bubbleWrapper = document.createElement('div');
    bubbleWrapper.className = 'message-bubble-wrapper';

    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';

    // Double tap for heart reaction
    let lastTap = 0;
    bubble.addEventListener('touchend', (e) => {
      const currentTime = new Date().getTime();
      const tapLength = currentTime - lastTap;
      if (tapLength < 300 && tapLength > 0) {
        e.preventDefault();
        toggleReaction(msg.id, '❤️');
      }
      lastTap = currentTime;
    });
    bubble.addEventListener('dblclick', () => {
      toggleReaction(msg.id, '❤️');
    });

    // Reply box
    if (msg.replyTo) {
      const replyBox = document.createElement('div');
      replyBox.className = 'reply-reference-box';
      replyBox.innerHTML = `
        <span class="reply-reference-sender">${escapeHtml(msg.replyTo.senderName)}</span>
        <span class="reply-reference-snippet">${escapeHtml(msg.replyTo.text || 'Medya')}</span>
      `;
      bubble.appendChild(replyBox);
    }

    // Message type
    if (msg.type === 'snap') {
      const snapCard = createSnapBubble(msg, isOutgoing);
      bubble.appendChild(snapCard);
    } else if (msg.type === 'image' && msg.mediaUrl) {
      const imgWrap = document.createElement('div');
      imgWrap.className = 'message-image-wrap';
      imgWrap.innerHTML = `<img src="${msg.mediaUrl}" alt="Görsel" loading="lazy">`;
      imgWrap.addEventListener('click', () => openLightbox(msg.mediaUrl));
      bubble.appendChild(imgWrap);
      if (msg.text) {
        const textP = document.createElement('p');
        textP.style.marginTop = '6px';
        textP.innerHTML = formatMarkdown(msg.text);
        bubble.appendChild(textP);
      }
    } else if (msg.type === 'voice' && msg.mediaUrl) {
      const voicePlayer = createVoicePlayer(msg);
      bubble.appendChild(voicePlayer);
    } else {
      const textP = document.createElement('p');
      textP.innerHTML = formatMarkdown(msg.text);
      bubble.appendChild(textP);
    }

    bubbleWrapper.appendChild(bubble);

    // Reactions
    const reactionsDiv = document.createElement('div');
    reactionsDiv.className = 'reactions-list';
    reactionsDiv.id = `reactions-${msg.id}`;
    renderReactionsList(reactionsDiv, msg.reactions, msg.id);
    bubbleWrapper.appendChild(reactionsDiv);

    // Meta
    const metaRow = document.createElement('div');
    metaRow.className = 'message-meta-row';
    const timeStr = new Date(msg.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    
    let isRead = msg.readBy && msg.readBy.length > 1;
    let ticksHtml = isOutgoing ? `<span class="read-ticks ${isRead ? 'read' : ''}" id="ticks-${msg.id}">✓✓</span>` : '';
    let starHtml = msg.isSaved ? `<span style="color: var(--love-rose);">★</span>` : '';

    metaRow.innerHTML = `
      <span class="msg-time">${timeStr}</span>
      <span class="msg-star" id="star-${msg.id}">${starHtml}</span>
      ${ticksHtml}
    `;
    bubbleWrapper.appendChild(metaRow);

    // Actions on Hover
    const hoverActions = document.createElement('div');
    hoverActions.className = 'message-actions-hover';
    hoverActions.innerHTML = `
      <button class="action-mini-btn btn-quick-react" data-emoji="❤️">❤️</button>
      <button class="action-mini-btn btn-quick-react" data-emoji="🔥">🔥</button>
      <button class="action-mini-btn btn-quick-react" data-emoji="🥰">🥰</button>
      <button class="action-mini-btn btn-msg-reply" title="Yanıtla">💬</button>
      <button class="action-mini-btn btn-msg-star" title="Yıldızla / Anılara Ekle">⭐</button>
    `;

    hoverActions.querySelectorAll('.btn-quick-react').forEach(b => {
      b.addEventListener('click', () => toggleReaction(msg.id, b.dataset.emoji));
    });
    hoverActions.querySelector('.btn-msg-reply').addEventListener('click', () => setReplyTo(msg));
    hoverActions.querySelector('.btn-msg-star').addEventListener('click', () => toggleMemory(msg.id));

    bubbleWrapper.appendChild(hoverActions);

    row.appendChild(avatarDiv);
    row.appendChild(bubbleWrapper);
    el.messagesList.appendChild(row);
  }

  // Snap bubble
  function createSnapBubble(msg, isOutgoing) {
    const card = document.createElement('div');
    const isViewed = msg.snapViewedBy && msg.snapViewedBy.length > 0;
    card.className = `snap-bubble-card ${isViewed ? 'viewed' : ''}`;
    card.id = `snap-card-${msg.id}`;

    card.innerHTML = `
      <span class="snap-icon-flame">${isViewed ? '👁️' : '🔥'}</span>
      <div class="snap-bubble-details">
        <strong>${isViewed ? 'Görüntülendi' : 'Tek Seferlik Snap'}</strong>
        <small>${isViewed ? 'Süre doldu' : 'Dokun ve basılı tutarak aç'}</small>
      </div>
    `;

    if (!isViewed) {
      const handleHoldStart = (e) => {
        e.preventDefault();
        openSnapViewer(msg);
      };
      const handleHoldEnd = (e) => {
        e.preventDefault();
        closeSnapViewer(msg);
      };

      card.addEventListener('mousedown', handleHoldStart);
      card.addEventListener('mouseup', handleHoldEnd);
      card.addEventListener('mouseleave', handleHoldEnd);
      card.addEventListener('touchstart', handleHoldStart, { passive: false });
      card.addEventListener('touchend', handleHoldEnd);
    }

    return card;
  }

  function openSnapViewer(msg) {
    activeSnapMessage = msg;
    const sender = usersData[msg.senderId] || { name: 'Sevgilin' };
    el.snapSenderName.textContent = sender.name;
    el.snapImageDisplay.src = msg.mediaUrl;
    el.snapImageDisplay.classList.add('revealed');
    el.snapViewerOverlay.style.display = 'flex';
    el.snapProgressFill.style.width = '100%';

    let secondsLeft = 5;
    el.snapTimerCount.textContent = `${secondsLeft}s`;
    el.snapProgressFill.style.transition = 'width 5s linear';
    setTimeout(() => { el.snapProgressFill.style.width = '0%'; }, 50);

    snapProgressInterval = setInterval(() => {
      secondsLeft -= 1;
      el.snapTimerCount.textContent = `${secondsLeft}s`;
      if (secondsLeft <= 0) closeSnapViewer(msg, true);
    }, 1000);
  }

  function closeSnapViewer(msg, forceComplete = false) {
    clearInterval(snapProgressInterval);
    el.snapViewerOverlay.style.display = 'none';
    el.snapImageDisplay.classList.remove('revealed');
    el.snapProgressFill.style.transition = 'none';

    if (activeSnapMessage && !activeSnapMessage.snapViewedBy?.includes(currentUser)) {
      socket.emit('snap_opened', { messageId: activeSnapMessage.id, userId: currentUser });
    }
    activeSnapMessage = null;
  }

  // Voice Player
  function createVoicePlayer(msg) {
    const player = document.createElement('div');
    player.className = 'voice-msg-player';

    const audio = new Audio(msg.mediaUrl);
    let isPlaying = false;

    player.innerHTML = `
      <button class="voice-play-btn">▶</button>
      <div class="voice-wave-bars">
        <div class="bar" style="height: 8px;"></div>
        <div class="bar" style="height: 16px;"></div>
        <div class="bar" style="height: 10px;"></div>
        <div class="bar" style="height: 20px;"></div>
        <div class="bar" style="height: 14px;"></div>
        <div class="bar" style="height: 6px;"></div>
      </div>
      <span class="voice-duration">0:00</span>
    `;

    const playBtn = player.querySelector('.voice-play-btn');
    const waveBars = player.querySelector('.voice-wave-bars');
    const durationSpan = player.querySelector('.voice-duration');

    audio.addEventListener('loadedmetadata', () => {
      const dur = Math.round(audio.duration);
      durationSpan.textContent = `0:${String(dur).padStart(2, '0')}`;
    });

    playBtn.addEventListener('click', () => {
      if (isPlaying) {
        audio.pause();
      } else {
        audio.play();
      }
    });

    audio.addEventListener('play', () => {
      isPlaying = true;
      playBtn.textContent = '⏸';
      waveBars.classList.add('playing');
    });

    audio.addEventListener('pause', () => {
      isPlaying = false;
      playBtn.textContent = '▶';
      waveBars.classList.remove('playing');
    });

    audio.addEventListener('ended', () => {
      isPlaying = false;
      playBtn.textContent = '▶';
      waveBars.classList.remove('playing');
    });

    audio.addEventListener('timeupdate', () => {
      const cur = Math.round(audio.currentTime);
      durationSpan.textContent = `0:${String(cur).padStart(2, '0')}`;
    });

    return player;
  }

  // Reactions
  function renderReactionsList(container, reactions, messageId) {
    container.innerHTML = '';
    if (!reactions) return;

    Object.entries(reactions).forEach(([emoji, userIds]) => {
      if (userIds && userIds.length > 0) {
        const badge = document.createElement('span');
        const isActive = userIds.includes(currentUser);
        badge.className = `reaction-badge ${isActive ? 'active' : ''}`;
        badge.innerHTML = `${emoji} <small>${userIds.length}</small>`;
        badge.addEventListener('click', () => toggleReaction(messageId, emoji));
        container.appendChild(badge);
      }
    });
  }

  function updateMessageReactionsDOM(messageId, reactions) {
    const container = document.getElementById(`reactions-${messageId}`);
    if (container) renderReactionsList(container, reactions, messageId);
  }

  function updateMessageReadTicksDOM(messageId, readBy) {
    const ticks = document.getElementById(`ticks-${messageId}`);
    if (ticks && readBy && readBy.length > 1) ticks.classList.add('read');
  }

  function updateMessageStarDOM(messageId, isSaved) {
    const star = document.getElementById(`star-${messageId}`);
    if (star) star.innerHTML = isSaved ? `<span style="color: var(--love-rose);">★</span>` : '';
  }

  function updateSnapBubbleDOM(messageId, snapViewedBy) {
    const card = document.getElementById(`snap-card-${messageId}`);
    if (card && snapViewedBy && snapViewedBy.length > 0) {
      card.className = 'snap-bubble-card viewed';
      card.innerHTML = `
        <span class="snap-icon-flame">👁️</span>
        <div class="snap-bubble-details">
          <strong>Görüntülendi</strong>
          <small>Süre doldu</small>
        </div>
      `;
    }
  }

  // ==========================================================================
  // SEND MESSAGE & ACTIONS
  // ==========================================================================

  function sendMessage() {
    const text = el.messageInput.value.trim();
    if (!text && !replyingTo) return;

    const payload = {
      senderId: currentUser,
      text: text,
      type: 'text',
      replyTo: replyingTo ? {
        id: replyingTo.id,
        senderName: usersData[replyingTo.senderId]?.name || 'Sevgilin',
        text: replyingTo.text,
        type: replyingTo.type
      } : null
    };

    socket.emit('send_message', payload);
    window.soundFX.playSendSound();

    el.messageInput.value = '';
    el.messageInput.style.height = 'auto';
    clearReplyTo();
    emitTyping(false);
  }

  function setReplyTo(msg) {
    replyingTo = msg;
    const sender = usersData[msg.senderId] || { name: 'Sevgilin' };
    el.replyToUser.textContent = sender.name;
    el.replyToText.textContent = msg.text || (msg.type === 'image' ? '📷 Fotoğraf' : '🎙️ Sesli Mesaj');
    el.replyPreviewBar.style.display = 'flex';
    el.messageInput.focus();
  }

  function clearReplyTo() {
    replyingTo = null;
    el.replyPreviewBar.style.display = 'none';
  }

  function toggleReaction(messageId, emoji) {
    socket.emit('message_reaction', { messageId, emoji, userId: currentUser });
  }

  async function toggleMemory(messageId) {
    try {
      await fetch('/api/memory/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId })
      });
    } catch (err) {
      console.error(err);
    }
  }

  function emitTyping(typing) {
    if (isTyping !== typing) {
      isTyping = typing;
      socket.emit('user_typing', { userId: currentUser, isTyping: typing });
    }
  }

  // Uploads
  async function handleImageUpload(file, isSnap = false) {
    if (!file) return;
    const formData = new FormData();
    formData.append('media', file);

    try {
      const res = await fetch('/api/upload/image', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) {
        socket.emit('send_message', {
          senderId: currentUser,
          text: '',
          type: isSnap ? 'snap' : 'image',
          mediaUrl: data.url,
          isSnap: isSnap
        });
        window.soundFX.playSendSound();
      }
    } catch (err) {
      alert('Fotoğraf yüklenemedi.');
    }
  }

  async function handleWallpaperUpload(file) {
    if (!file) return;
    const formData = new FormData();
    formData.append('wallpaper', file);

    try {
      const res = await fetch('/api/upload/wallpaper', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) {
        wallpaperSettings.type = 'custom';
        wallpaperSettings.url = data.url;
        applyWallpaper(wallpaperSettings);
        alert('🖼️ Duvar kağıdınız galerinizden başarıyla yüklendi!');
      }
    } catch (err) {
      alert('Duvar kağıdı yüklenemedi.');
    }
  }

  async function handleAvatarUpload(file) {
    if (!file) return;
    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const res = await fetch('/api/upload/avatar', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) {
        el.settingsAvatarPreview.textContent = '';
        el.settingsAvatarPreview.style.backgroundImage = `url(${data.url})`;
        el.settingsAvatarPreview.dataset.customUrl = data.url;
      }
    } catch (err) {
      console.error(err);
    }
  }

  // Voice
  async function startVoiceRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);
      audioChunks = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      recordingStartTime = Date.now();
      window.soundFX.playRecordStart();

      el.voiceRecordingBar.style.display = 'flex';
      recordingTimerInterval = setInterval(updateRecordingTimer, 500);
    } catch (err) {
      alert('Mikrofon erişimi sağlanamadı.');
    }
  }

  function updateRecordingTimer() {
    const elapsed = Math.floor((Date.now() - recordingStartTime) / 1000);
    const mins = Math.floor(elapsed / 60);
    const secs = elapsed % 60;
    el.voiceRecordingTime.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  function cancelVoiceRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop();
    clearInterval(recordingTimerInterval);
    el.voiceRecordingBar.style.display = 'none';
  }

  async function sendVoiceRecording() {
    if (!mediaRecorder || mediaRecorder.state === 'inactive') return;

    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      const formData = new FormData();
      formData.append('voice', audioBlob, 'voice-note.webm');

      try {
        const res = await fetch('/api/upload/voice', { method: 'POST', body: formData });
        const data = await res.json();
        if (data.success) {
          socket.emit('send_message', {
            senderId: currentUser,
            text: '',
            type: 'voice',
            mediaUrl: data.url
          });
          window.soundFX.playSendSound();
        }
      } catch (err) {
        console.error(err);
      }
    };

    mediaRecorder.stop();
    clearInterval(recordingTimerInterval);
    el.voiceRecordingBar.style.display = 'none';
  }

  // ==========================================================================
  // EVENT LISTENERS & SETUP
  // ==========================================================================

  function setupEventListeners() {
    // Password auth
    el.btnSubmitPassword.addEventListener('click', handlePasswordSubmit);
    el.sitePasswordInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handlePasswordSubmit();
    });

    el.btnPickYavuz.addEventListener('click', () => setDeviceUser('user1'));
    el.btnPickNisa.addEventListener('click', () => setDeviceUser('user2'));

    // Message input
    el.messageInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });

    el.messageInput.addEventListener('input', () => {
      el.messageInput.style.height = 'auto';
      el.messageInput.style.height = Math.min(el.messageInput.scrollHeight, 120) + 'px';
      emitTyping(true);
      clearTimeout(typingTimeout);
      typingTimeout = setTimeout(() => emitTyping(false), 2000);
    });

    el.btnSend.addEventListener('click', sendMessage);
    el.replyCancelBtn.addEventListener('click', clearReplyTo);

    // Attachments
    el.btnAttach.addEventListener('click', (e) => {
      e.stopPropagation();
      el.attachPopover.style.display = el.attachPopover.style.display === 'none' ? 'flex' : 'none';
    });
    document.addEventListener('click', () => {
      el.attachPopover.style.display = 'none';
      el.emojiPickerPanel.style.display = 'none';
    });

    el.btnAttachNormalPhoto.addEventListener('click', () => el.fileInputImage.click());
    el.btnAttachSnapPhoto.addEventListener('click', () => el.fileInputSnap.click());

    el.fileInputImage.addEventListener('change', (e) => {
      if (e.target.files[0]) handleImageUpload(e.target.files[0], false);
      e.target.value = '';
    });
    el.fileInputSnap.addEventListener('change', (e) => {
      if (e.target.files[0]) handleImageUpload(e.target.files[0], true);
      e.target.value = '';
    });

    // Emoji panel
    el.btnEmojiToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      el.emojiPickerPanel.style.display = el.emojiPickerPanel.style.display === 'none' ? 'block' : 'none';
    });
    el.emojiPickerPanel.querySelectorAll('span').forEach(emojiSpan => {
      emojiSpan.addEventListener('click', () => {
        el.messageInput.value += emojiSpan.textContent;
        el.messageInput.focus();
      });
    });

    // Voice
    el.btnVoiceRecord.addEventListener('click', startVoiceRecording);
    el.btnVoiceCancel.addEventListener('click', cancelVoiceRecording);
    el.btnVoiceSend.addEventListener('click', sendVoiceRecording);

    // Wallpaper
    el.btnWallpaperModal.addEventListener('click', () => el.modalWallpaper.style.display = 'flex');
    el.btnCloseWallpaperModal.addEventListener('click', () => el.modalWallpaper.style.display = 'none');
    el.btnTriggerWallpaperUpload.addEventListener('click', () => el.fileInputWallpaper.click());
    el.fileInputWallpaper.addEventListener('change', (e) => {
      if (e.target.files[0]) handleWallpaperUpload(e.target.files[0]);
      e.target.value = '';
    });

    document.querySelectorAll('.preset-item').forEach(item => {
      item.addEventListener('click', () => {
        document.querySelectorAll('.preset-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        selectedPreset = item.dataset.preset;
        wallpaperSettings.type = selectedPreset === 'oled' ? 'oled' : 'preset';
        wallpaperSettings.url = '';
        applyWallpaper(wallpaperSettings);
      });
    });

    el.blurSlider.addEventListener('input', (e) => {
      wallpaperSettings.blur = parseInt(e.target.value);
      el.blurValLabel.textContent = `${wallpaperSettings.blur}px`;
      applyWallpaper(wallpaperSettings);
    });
    el.opacitySlider.addEventListener('input', (e) => {
      wallpaperSettings.opacity = parseInt(e.target.value);
      el.opacityValLabel.textContent = `${wallpaperSettings.opacity}%`;
      applyWallpaper(wallpaperSettings);
    });
    el.brightnessSlider.addEventListener('input', (e) => {
      wallpaperSettings.brightness = parseInt(e.target.value);
      el.brightnessValLabel.textContent = `${wallpaperSettings.brightness}%`;
      applyWallpaper(wallpaperSettings);
    });

    el.btnResetWallpaper.addEventListener('click', () => {
      wallpaperSettings = { type: 'oled', url: '', blur: 0, opacity: 100, brightness: 100 };
      selectedPreset = 'oled';
      applyWallpaper(wallpaperSettings);
    });

    el.btnSaveWallpaper.addEventListener('click', async () => {
      try {
        await fetch('/api/wallpaper', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: currentUser, wallpaper: wallpaperSettings })
        });
        el.modalWallpaper.style.display = 'none';
      } catch (err) {
        console.error(err);
      }
    });

    // Streak Hub & Revive (20 hak)
    el.streakPillBtn.addEventListener('click', () => {
      updateStreakUI();
      el.modalStreak.style.display = 'flex';
    });
    el.btnCloseStreakModal.addEventListener('click', () => el.modalStreak.style.display = 'none');

    el.btnActivateRevive.addEventListener('click', async () => {
      if (confirm('Canlandırma hakkınızı kullanarak seriyi yeniden alevlendirmek istiyor musunuz? (20 haktan biri kullanılır)')) {
        try {
          const res = await fetch('/api/streak/revive', { method: 'POST' });
          const data = await res.json();
          if (!res.ok) alert(data.error || 'Canlandırma başarısız');
        } catch (err) {
          console.error(err);
        }
      }
    });

    // Memory Vault
    el.btnMemoryVault.addEventListener('click', () => {
      renderMemoriesList();
      el.modalMemory.style.display = 'flex';
    });
    el.btnCloseMemoryModal.addEventListener('click', () => el.modalMemory.style.display = 'none');

    // Privacy Mode
    el.btnPrivacyLock.addEventListener('click', () => {
      document.body.classList.toggle('privacy-active');
    });

    // Settings
    el.btnSettings.addEventListener('click', () => {
      const me = usersData[currentUser] || {};
      el.settingsInputName.value = me.name || '';
      el.settingsAvatarPreview.textContent = me.avatar || (currentUser === 'user1' ? '🐺' : '🌸');
      if (me.customAvatarUrl) {
        el.settingsAvatarPreview.textContent = '';
        el.settingsAvatarPreview.style.backgroundImage = `url(${me.customAvatarUrl})`;
      }
      el.modalSettings.style.display = 'flex';
    });
    el.btnCloseSettingsModal.addEventListener('click', () => el.modalSettings.style.display = 'none');

    el.settingsPickYavuz.addEventListener('click', () => {
      setDeviceUser('user1');
      el.modalSettings.style.display = 'none';
    });
    el.settingsPickNisa.addEventListener('click', () => {
      setDeviceUser('user2');
      el.modalSettings.style.display = 'none';
    });

    el.btnChangeAvatarPhoto.addEventListener('click', () => el.fileInputAvatar.click());
    el.fileInputAvatar.addEventListener('change', (e) => {
      if (e.target.files[0]) handleAvatarUpload(e.target.files[0]);
      e.target.value = '';
    });

    el.btnLockSite.addEventListener('click', () => {
      sessionStorage.removeItem('duostreak_authed');
      el.modalSettings.style.display = 'none';
      document.querySelector('.password-form-box').style.display = 'flex';
      el.deviceIdentitySetup.style.display = 'none';
      el.sitePasswordInput.value = '';
      el.modalPasswordAuth.style.display = 'flex';
    });

    el.btnSaveSettings.addEventListener('click', async () => {
      const name = el.settingsInputName.value.trim();
      const customAvatarUrl = el.settingsAvatarPreview.dataset.customUrl || null;

      try {
        await fetch('/api/user/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: currentUser,
            name,
            customAvatarUrl
          })
        });
        el.modalSettings.style.display = 'none';
      } catch (err) {
        console.error(err);
      }
    });

    el.btnCloseLightbox.addEventListener('click', () => el.lightboxOverlay.style.display = 'none');
    el.btnCloseCelebration.addEventListener('click', () => el.streakCelebrationOverlay.style.display = 'none');
  }

  function renderMemoriesList() {
    el.memoriesList.innerHTML = '';
    if (memories.length === 0) {
      el.memoriesList.innerHTML = '<p style="color: var(--text-muted); font-size: 12px; text-align: center; padding: 20px;">Henüz yıldızlanmış bir anı veya aşk notu yok.</p>';
      return;
    }

    memories.forEach(mem => {
      const item = document.createElement('div');
      item.className = 'memory-item';
      const timeStr = new Date(mem.timestamp).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
      item.innerHTML = `
        <div class="memory-header-row">
          <span>★ ${escapeHtml(mem.senderName)}</span>
          <span style="color: var(--text-muted);">${timeStr}</span>
        </div>
        <div class="memory-text">${escapeHtml(mem.text || '📷 Medya')}</div>
      `;
      el.memoriesList.appendChild(item);
    });
  }

  function triggerStreakCelebration(streakNumber) {
    el.celebrationStreakNumber.textContent = streakNumber;
    el.streakCelebrationOverlay.style.display = 'flex';
    window.streakEngine.launchCelebrationParticles('celebration-canvas');
  }

  function openLightbox(imgUrl) {
    el.lightboxImage.src = imgUrl;
    el.lightboxOverlay.style.display = 'flex';
  }

  function scrollToBottom() {
    setTimeout(() => {
      el.chatContainer.scrollTop = el.chatContainer.scrollHeight;
    }, 50);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, m => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[m]));
  }

  function formatMarkdown(text) {
    if (!text) return '';
    let escaped = escapeHtml(text);
    escaped = escaped.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    escaped = escaped.replace(/\*(.*?)\*/g, '<em>$1</em>');
    escaped = escaped.replace(/\n/g, '<br>');
    return escaped;
  }

  document.addEventListener('DOMContentLoaded', initApp);
})();
