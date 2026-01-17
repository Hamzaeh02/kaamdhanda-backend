const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./utils/connectDB');
const path = require('path');

dotenv.config();
connectDB();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
// Body parser for form-data (if you send form data)
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => res.send('✅ Server is running'));

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/jobs', require('./routes/job.routes'));
app.use('/api/tasks', require('./routes/task.routes'));
app.use('/api/saveJobs', require('./routes/saveJob.routes'));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
