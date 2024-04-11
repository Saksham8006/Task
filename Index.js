const express = require('express');
const app = express();
const User = require('./models/User');
const mongoose = require('mongoose');
const port = 3000;
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken')

require('dotenv').config();
const cors = require('cors');

app.use(bodyParser.json());
app.use(cors());

// Set Sendinblue API Key
const sendinblue = require("sib-api-v3-sdk");
const client = sendinblue.ApiClient.instance;
client.authentications['api-key'].apiKey = process.env.API_KEY;

// MongoDB connection
const mongoURI = 'mongodb://localhost:27017/Task';

mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("MongoDB Connected Successfully");
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error.message);
  });

// Send email endpoint
app.post("/send-email", async (req, res) => {
  const { email, subject, message } = req.body;

  if (!email || !subject || !message) {
    return res.status(400).json({ error: "Email, subject, and message are required" });
  }

  const emailPayload = {
    sender: { email: process.env.EMAIL, name: 'Saksham Sharma' },
    to: [{ email }],
    subject,
    htmlContent: message,
  };

  try {
    const emailApi = new sendinblue.TransactionalEmailsApi();
    const response = await emailApi.sendTransacEmail(emailPayload);
    console.log('Email sent successfully:', response);
    res.json({ success: true, message: 'Approval email sent successfully.' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(error.response ? error.response.status : 500).json({ error: 'Error sending approval email.' });
  }
});

// Register endpoint
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email is already taken' });
    }

    const newUser = new User({
      name,
      email,
      password
    });

    await newUser.save();

    res.status(201).json({ message: 'User registered successfully', user: newUser });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


app.post('/login', async (req, res) => {

  const { email, password } = req.body

  try {
    const user = await User.findOne({ email: email, password: password })

    if (user) {
      const token = jwt.sign(
        {
          name: user.name,
          email: user.email,
        },
        'secret123'
      )

      return res.status(201).json({ status: 'ok', user: token })

    }
    else {
      return res.status(401).json({ status: 'error', user: false, remarks: "Email or Password is not valid" })

    }

  }
  catch (error) {
    console.log(error.message)
    res.status(500).json({ error: "Server error" })

  }

})

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
