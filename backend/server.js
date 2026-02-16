const dotenv = require('dotenv');
dotenv.config();

const connectDB = require('./src/config/db');
const app = require('./src/app');

const port = process.env.PORT || 3000;

const start = async () => {
  try {
    await connectDB();
    app.listen(port, () => console.log(`Server running on port ${port}`));
  } catch (err) {
    console.error('Failed to start server', err);
    process.exit(1);
  }
};

start();
