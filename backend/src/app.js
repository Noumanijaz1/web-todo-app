const path = require('path');
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

const authRoutes = require('./routes/auth');
const todosRoutes = require('./routes/todos');
const usersRoutes = require('./routes/users');
const teamsRoutes = require('./routes/teams');
const projectsRoutes = require('./routes/projects');

app.use('/api/auth', authRoutes);
app.use('/api/todos', todosRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/teams', teamsRoutes);
app.use('/api/projects', projectsRoutes);

const { errorHandler } = require('./middleware/errorHandler');
app.use(errorHandler);

module.exports = app;
