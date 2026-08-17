import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
  maxHttpBufferSize: 1e8 // 100 MB
});

const PORT = process.env.PORT || 3000;
const SITE_PASSWORD = "10.12.2025";

// Ensure directories exist
const dataDir = path.join(__dirname, 'data');
const uploadsDir = path.join(__dirname, 'uploads');
const wallpapersDir = path.join(uploadsDir, 'wallpapers');
const avatarsDir = path.join(uploadsDir, 'avatars');
const mediaDir = path.join(uploadsDir, 'media');
const voiceDir = path.join(uploadsDir, 'voice');

[dataDir, uploadsDir, wallpapersDir, avatarsDir, mediaDir, voiceDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure Multer Storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'wallpaper') {
      cb(null, wallpapersDir);
    } else if (file.fieldname === 'avatar') {
      cb(null, avatarsDir);
    } else if (file.fieldname === 'voice') {
      cb(null, voiceDir);
    } else {
      cb(null, mediaDir);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || (file.mimetype.includes('audio') ? '.webm' : '.jpg');
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }
});

// JSON Database Manager
const dbPath = path.join(dataDir, 'database.json');

function getTodayDateString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getStartOfDayTimestamp() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

const defaultDatabase = {
  users: {
    user1: {
      id: 'user1',
      name: 'Yavuz',
      avatar: '🐺',
      customAvatarUrl: null,
      status: 'offline',
      lastSeen: Date.now(),
      color: '#ff5722'
    },
    user2: {
      id: 'user2',
      name: 'Nisa',
      avatar: '🌸',
      customAvatarUrl: null,
      status: 'offline',
      lastSeen: Date.now(),
      color: '#ff66aa'
    }
  },
  streak: {
    currentStreak: 285,
    bestStreak: 285,
    startDate: '2025-12-10',
    currentCycleDate: getTodayDateString(),
    user1MessagedToday: false,
    user2MessagedToday: false,
    streakCompletedToday: false,
    isGreyedOut: true, // Saat 00:00'da gri başlar, iki taraf yazınca renklenir
    isExtinguished: false, // Mesaj atılmazsa söner
    freezesRemaining: 20, // 1 ayda 20 canlandırma hakkı
    maxFreezesPerMonth: 20,
    streakHistory: [],
    cycleStartTime: getStartOfDayTimestamp()
  },
  wallpapers: {
    current: {
      type: 'oled',
      url: '',
      blur: 0,
      opacity: 100,
      brightness: 100
    },
    user1: { type: 'oled', url: '', blur: 0, opacity: 100, brightness: 100 },
    user2: { type: 'oled', url: '', blur: 0, opacity: 100, brightness: 100 }
  },
  messages: [],
  memories: [],
  dailyPrompts: [
    "Bugün benimle ilgili aklına gelen ilk güzel an neydi?",
    "Birlikte gitmeyi en çok hayal ettiğin yer neresi?",
    "İlk tanıştığımız gün hakkında hiç unutamadığın bir detay?",
    "Şu an yanımda olsaydın ilk ne yapmak isterdin?",
    "Bugün seni en çok ne mutlu etti sevgilim?",
    "Birlikte yapacağımız bir sonraki en özel plan ne olsun?",
    "Benim en sevdiğin huyum/hareketim ne?",
    "Bizi anlatan en güzel şarkı sence hangisi?",
    "Gelecekteki yuvamızda kesinlikle olmasını istediğin tek şey?",
    "Bugünü 10 üzerinden puanlasaydın kaç verirdin ve neden?"
  ],
  activePromptIndex: 0
};

function loadDB() {
  try {
    if (!fs.existsSync(dbPath)) {
      saveDB(defaultDatabase);
      return JSON.parse(JSON.stringify(defaultDatabase));
    }
    const data = fs.readFileSync(dbPath, 'utf8');
    const parsed = JSON.parse(data);
    const merged = { ...defaultDatabase, ...parsed };
    // Ensure users are Yavuz & Nisa and streak starts at 285 if fresh
    merged.users.user1.name = merged.users.user1.name || 'Yavuz';
    merged.users.user2.name = merged.users.user2.name || 'Nisa';
    if (!merged.streak.currentStreak || merged.streak.currentStreak < 285) {
      merged.streak.currentStreak = 285;
      merged.streak.bestStreak = Math.max(285, merged.streak.bestStreak || 285);
    }
    if (merged.streak.freezesRemaining === undefined) {
      merged.streak.freezesRemaining = 20;
    }
    return merged;
  } catch (err) {
    console.error('Database load error:', err);
    return JSON.parse(JSON.stringify(defaultDatabase));
  }
}

function saveDB(data) {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Database save error:', err);
  }
}

let db = loadDB();

// Streak Maintenance Routine (Saat 00:00 Kontrolü)
function checkAndRefreshStreakCycle() {
  const today = getTodayDateString();
  if (db.streak.currentCycleDate !== today) {
    const wasCompletedYesterday = db.streak.streakCompletedToday;

    if (!wasCompletedYesterday) {
      // Dün mesajlaşılmadı -> Seri söner!
      db.streak.isExtinguished = true;
      console.log(`⚠️ Seri söndü! Canlandırma hakkı (20 hak) kullanılabilir.`);
    }

    // Yeni gün başlangıcı (00:00) -> Seri gri hale gelir!
    db.streak.currentCycleDate = today;
    db.streak.user1MessagedToday = false;
    db.streak.user2MessagedToday = false;
    db.streak.streakCompletedToday = false;
    db.streak.isGreyedOut = true;
    db.streak.cycleStartTime = getStartOfDayTimestamp();

    // Rotate daily prompt
    db.activePromptIndex = (db.activePromptIndex + 1) % db.dailyPrompts.length;

    saveDB(db);
    io.emit('streak_updated', { streak: db.streak });
  }
}

setInterval(checkAndRefreshStreakCycle, 30000);
checkAndRefreshStreakCycle();

// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(uploadsDir));

// API Routes
app.post('/api/auth/verify', (req, res) => {
  const { password } = req.body;
  if (password === SITE_PASSWORD) {
    res.json({ success: true, message: 'Giriş başarılı' });
  } else {
    res.status(401).json({ success: false, error: 'Hatalı şifre' });
  }
});

app.get('/api/init', (req, res) => {
  checkAndRefreshStreakCycle();
  res.json({
    users: db.users,
    streak: db.streak,
    wallpapers: db.wallpapers,
    memories: db.memories,
    activePrompt: db.dailyPrompts[db.activePromptIndex],
    serverTime: Date.now()
  });
});

app.get('/api/messages', (req, res) => {
  const limit = parseInt(req.query.limit) || 150;
  const messages = db.messages.slice(-limit);
  res.json({ messages, total: db.messages.length });
});

app.post('/api/user/update', (req, res) => {
  const { userId, name, avatar, customAvatarUrl } = req.body;
  if (!db.users[userId]) {
    return res.status(400).json({ error: 'Geçersiz kullanıcı' });
  }

  if (name !== undefined) db.users[userId].name = name.trim();
  if (avatar !== undefined) db.users[userId].avatar = avatar;
  if (customAvatarUrl !== undefined) db.users[userId].customAvatarUrl = customAvatarUrl;

  saveDB(db);
  io.emit('user_updated', { userId, user: db.users[userId] });
  res.json({ success: true, user: db.users[userId] });
});

app.post('/api/upload/image', upload.single('media'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Dosya yüklenemedi' });
  const fileUrl = `/uploads/media/${req.file.filename}`;
  res.json({ success: true, url: fileUrl, filename: req.file.filename });
});

app.post('/api/upload/voice', upload.single('voice'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Ses kaydedilemedi' });
  const fileUrl = `/uploads/voice/${req.file.filename}`;
  res.json({ success: true, url: fileUrl, filename: req.file.filename });
});

app.post('/api/upload/wallpaper', upload.single('wallpaper'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Duvar kağıdı yüklenemedi' });
  const fileUrl = `/uploads/wallpapers/${req.file.filename}`;
  res.json({ success: true, url: fileUrl });
});

app.post('/api/upload/avatar', upload.single('avatar'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Avatar yüklenemedi' });
  const fileUrl = `/uploads/avatars/${req.file.filename}`;
  res.json({ success: true, url: fileUrl });
});

app.post('/api/wallpaper', (req, res) => {
  const { userId, wallpaper } = req.body;
  if (userId && db.wallpapers[userId]) {
    db.wallpapers[userId] = { ...db.wallpapers[userId], ...wallpaper };
  } else {
    db.wallpapers.current = { ...db.wallpapers.current, ...wallpaper };
  }
  saveDB(db);
  io.emit('wallpaper_updated', { userId, wallpapers: db.wallpapers });
  res.json({ success: true, wallpapers: db.wallpapers });
});

// Seriyi Yeniden Canlandırma (20 Hak)
app.post('/api/streak/revive', (req, res) => {
  if (db.streak.freezesRemaining > 0) {
    db.streak.freezesRemaining -= 1;
    db.streak.isExtinguished = false;
    db.streak.isGreyedOut = false;
    db.streak.streakCompletedToday = true;
    db.streak.user1MessagedToday = true;
    db.streak.user2MessagedToday = true;
    saveDB(db);
    io.emit('streak_updated', {
      streak: db.streak,
      action: 'streak_revived',
      message: 'Seri başarıyla canlandırıldı! 🔥'
    });
    res.json({ success: true, streak: db.streak });
  } else {
    res.status(400).json({ error: 'Bu ay için canlandırma hakkınız kalmadı.' });
  }
});

app.post('/api/memory/toggle', (req, res) => {
  const { messageId } = req.body;
  const msgIndex = db.messages.findIndex(m => m.id === messageId);
  if (msgIndex === -1) return res.status(404).json({ error: 'Mesaj bulunamadı' });

  const msg = db.messages[msgIndex];
  msg.isSaved = !msg.isSaved;

  if (msg.isSaved) {
    if (!db.memories.some(m => m.id === msg.id)) {
      db.memories.unshift({
        id: msg.id,
        senderId: msg.senderId,
        senderName: db.users[msg.senderId]?.name || 'Bilinmeyen',
        text: msg.text,
        type: msg.type,
        mediaUrl: msg.mediaUrl,
        timestamp: msg.timestamp,
        savedAt: Date.now()
      });
    }
  } else {
    db.memories = db.memories.filter(m => m.id !== msg.id);
  }

  saveDB(db);
  io.emit('memory_updated', { messageId, isSaved: msg.isSaved, memories: db.memories });
  res.json({ success: true, isSaved: msg.isSaved, memories: db.memories });
});

// Socket.io Real-time Handling
const onlineUsers = new Map();

io.on('connection', (socket) => {
  socket.on('user_join', (userId) => {
    if (db.users[userId]) {
      onlineUsers.set(socket.id, userId);
      db.users[userId].status = 'online';
      db.users[userId].lastSeen = Date.now();
      saveDB(db);
      io.emit('presence_update', { users: db.users });
    }
  });

  socket.on('user_typing', ({ userId, isTyping }) => {
    socket.broadcast.emit('typing_status', { userId, isTyping });
  });

  socket.on('send_message', (messageData) => {
    checkAndRefreshStreakCycle();

    const { senderId, text, type = 'text', mediaUrl, isSnap = false, replyTo = null } = messageData;
    if (!db.users[senderId]) return;

    const newMessage = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      senderId,
      text: text ? text.trim() : '',
      type,
      mediaUrl: mediaUrl || null,
      isSnap: !!isSnap,
      snapViewedBy: [],
      replyTo: replyTo || null,
      reactions: {},
      isSaved: false,
      timestamp: Date.now(),
      readBy: [senderId]
    };

    db.messages.push(newMessage);

    // Streak Logic Update
    let streakLevelUp = false;
    if (senderId === 'user1') {
      db.streak.user1MessagedToday = true;
    } else if (senderId === 'user2') {
      db.streak.user2MessagedToday = true;
    }

    // Eğer seri sönmüşse mesaj atılsa da revive yapılmalıdır veya ikisi de yazınca canlanabilir
    if (db.streak.isExtinguished) {
      // Mesaj atıldı
    }

    // Her iki sevgili de mesaj attığında:
    if (db.streak.user1MessagedToday && db.streak.user2MessagedToday && !db.streak.streakCompletedToday) {
      db.streak.streakCompletedToday = true;
      db.streak.isGreyedOut = false; // Gri durumdan renkli canlı aleve döner!
      db.streak.isExtinguished = false;
      db.streak.currentStreak += 1;
      db.streak.bestStreak = Math.max(db.streak.bestStreak, db.streak.currentStreak);
      streakLevelUp = true;

      db.streak.streakHistory.push({
        date: db.streak.currentCycleDate,
        streak: db.streak.currentStreak,
        timestamp: Date.now()
      });
    }

    saveDB(db);

    io.emit('new_message', { message: newMessage });
    io.emit('streak_updated', {
      streak: db.streak,
      levelUp: streakLevelUp,
      leveledStreak: db.streak.currentStreak
    });
  });

  socket.on('message_reaction', ({ messageId, emoji, userId }) => {
    const msg = db.messages.find(m => m.id === messageId);
    if (!msg) return;
    if (!msg.reactions) msg.reactions = {};
    if (!msg.reactions[emoji]) msg.reactions[emoji] = [];

    const idx = msg.reactions[emoji].indexOf(userId);
    if (idx > -1) {
      msg.reactions[emoji].splice(idx, 1);
      if (msg.reactions[emoji].length === 0) delete msg.reactions[emoji];
    } else {
      msg.reactions[emoji].push(userId);
    }

    saveDB(db);
    io.emit('reaction_updated', { messageId, reactions: msg.reactions });
  });

  socket.on('message_read', ({ messageId, userId }) => {
    const msg = db.messages.find(m => m.id === messageId);
    if (!msg) return;
    if (!msg.readBy) msg.readBy = [];
    if (!msg.readBy.includes(userId)) {
      msg.readBy.push(userId);
      saveDB(db);
      io.emit('message_read_receipt', { messageId, readBy: msg.readBy });
    }
  });

  socket.on('snap_opened', ({ messageId, userId }) => {
    const msg = db.messages.find(m => m.id === messageId);
    if (!msg || !msg.isSnap) return;
    if (!msg.snapViewedBy) msg.snapViewedBy = [];
    if (!msg.snapViewedBy.includes(userId)) {
      msg.snapViewedBy.push(userId);
      saveDB(db);
      io.emit('snap_status_updated', { messageId, snapViewedBy: msg.snapViewedBy });
    }
  });

  socket.on('disconnect', () => {
    const userId = onlineUsers.get(socket.id);
    if (userId) {
      onlineUsers.delete(socket.id);
      const isStillOnline = Array.from(onlineUsers.values()).includes(userId);
      if (!isStillOnline && db.users[userId]) {
        db.users[userId].status = 'offline';
        db.users[userId].lastSeen = Date.now();
        saveDB(db);
        io.emit('presence_update', { users: db.users });
      }
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(`❤️ YAVUZ & NİSA ÖZEL SOHBET SUNUCUSU BAŞLATILDI`);
  console.log(`🔑 Giriş Şifresi: ${SITE_PASSWORD}`);
  console.log(`🔥 Başlangıç Serisi: 285`);
  console.log(`🖤 Yerel Adres: http://localhost:${PORT}`);
  console.log(`====================================================`);
});
