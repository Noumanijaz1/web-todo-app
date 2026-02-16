const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());

const authRoutes = require('./routes/auth');
const todosRoutes = require('./routes/todos');
const usersRoutes = require('./routes/users');

app.use('/api/auth', authRoutes);
app.use('/api/todos', todosRoutes);
app.use('/api/users', usersRoutes);

const { errorHandler } = require('./middleware/errorHandler');
app.use(errorHandler);

module.exports = app;
