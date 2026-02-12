const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 3000;

// Enable CORS for frontend
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173", // Default to Vite's default port
  credentials: true
}));


app.use(express.json());
app.get("/api/todos", (req, res) => {
  const todos = [
    { id: 1, title: "Todo 1", completed: false },
    { id: 2, title: "Todo 2", completed: false },
    { id: 3, title: "Todo 3", completed: false },
  ];
  res.json(todos);
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
