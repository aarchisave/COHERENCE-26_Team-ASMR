require('dotenv').config();
const express      = require('express');
const http         = require('http');
const { Server }   = require('socket.io');
const mongoose     = require('mongoose');
const cors         = require('cors');
const simulator    = require('./services/simulator');

const budgetRoutes    = require('./routes/budget');
const analyticsRoutes = require('./routes/analytics');
const ingestionRoutes = require('./routes/ingestion');
const aiRoutes        = require('./routes/ai');

const app    = express();
const server = http.createServer(app);
const PORT   = process.env.PORT || 5000;

// ── Socket.io ────────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:5173', 
  'http://localhost:5174', 
  'http://localhost:5175', 
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:5175',
  'http://127.0.0.1:3000',
  'https://coherence-26-team-asmr.vercel.app',
  process.env.CORS_ORIGIN
].filter(Boolean);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
  }
});

io.on('connection', socket => {
  console.log(`🔌 Client connected: ${socket.id}`);
  socket.emit('connected', { message: 'Live data stream active', time: new Date().toISOString() });
  socket.on('disconnect', () => console.log(`🔌 Client disconnected: ${socket.id}`));
});

// Inject io into simulator so it can broadcast
simulator.setIO(io);

app.use((req, res, next) => {
  console.log(`📡 [${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: '10mb' }));

// Global error handler for Production
app.use((err, req, res, next) => {
  console.error('[Error Handler]', err.stack);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

// ── Routes ───────────────────────────────────────────────────
app.use('/api/budget',     budgetRoutes);
app.use('/api/analytics',  analyticsRoutes);
app.use('/api/ingestion',  ingestionRoutes);
app.use('/api/ai',         aiRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// ── MongoDB + Start ──────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    server.listen(PORT, () => {
      console.log(`🚀 BudgetFlow IQ server running on http://localhost:${PORT}`);
      simulator.start();         // Start live simulation after DB is ready
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });
