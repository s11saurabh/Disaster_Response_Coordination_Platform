const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const http = require('http')
const socketIo = require('socket.io')
require('dotenv').config()

const routes = require('./routes')
const { initializeSocket } = require('./services/websocket')
const logger = require('./utils/logger')
const { readLimiter, generalLimiter } = require('./middleware/rateLimiter')

const app = express()
const server = http.createServer(app)
const io = socketIo(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production'
      ? 'https://your-frontend-url.vercel.app'
      : 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
})

app.use(helmet())
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? 'https://your-frontend-url.vercel.app'
    : 'http://localhost:3000',
  credentials: true
}))

app.use((req, res, next) => {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    return readLimiter(req, res, next)
  }
  return generalLimiter(req, res, next)
})

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

initializeSocket(io)

app.use((req, res, next) => {
  req.io = io
  next()
})

app.use('/api', routes)

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() })
})

app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err)
  res.status(500).json({ error: 'Internal server error' })
})

app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

const PORT = process.env.PORT || 5000
server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`)
})

module.exports = { app, server, io }
