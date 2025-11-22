const express = require('express');
const app = express();
const mongoose = require('mongoose');
const path = require('path');
const cookieParser = require('cookie-parser');
app.use(cookieParser());


require('dotenv').config();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('view engine' ,'ejs');
app.set('views', path.join(__dirname, 'views'));


const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error(err));





const homeRoute = require('./routes/home')
app.use('/',homeRoute);











const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
