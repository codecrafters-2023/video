// const mongoose = require('mongoose');

// const connectDB = async () => {
//   try {
//     await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/omegle', {
//       useNewUrlParser: true,
//       useUnifiedTopology: true
//     });
//     console.log('MongoDB connected');
//   } catch (err) {
//     console.error('Database connection error:', err.message);
//     process.exit(1);
//   }
// };

// module.exports = connectDB;