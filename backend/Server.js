const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 5000;

const cors = require('cors');
app.use(cors());

app.use(bodyParser.json()); // Middleware to parse JSON

// MySQL connection setup (updated for deployed credentials)
const db = mysql.createConnection({
    host: 'brain-brain-tumor.b.aivencloud.com',
    user: 'avnadmin',
    password: 'AVNS_d-Uep5MM87Bp8o8xq09',
    database: 'defaultdb',
    port: 14550, // Specify the correct port
    ssl: {
        rejectUnauthorized: false, // Use this if the SSL certificate is not explicitly trusted
    },
});

db.connect((err) => {
    if (err) {
        console.error('Could not connect to MySQL:', err);
        process.exit(1);
    }
    console.log('Connected to MySQL');
});

// Login route
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    console.log(`Login attempt received with username: ${username}`);

    db.query('SELECT * FROM users WHERE username = ?', [username], async (err, result) => {
        if (err) {
            console.error('Error fetching user:', err);
            return res.status(500).json({ message: 'Server error' });
        }

        if (result.length === 0) {
            console.log('User not found:', username);
            return res.status(400).json({ message: 'User not found' });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, result[0].password);
        if (!isMatch) {
            console.log('Invalid credentials for username:', username);
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        console.log('Login successful for username:', username);

        // Create a folder for the user if it doesn't exist
        const userFolderPath = path.join(__dirname, 'storage', username);

        if (!fs.existsSync(userFolderPath)) {
            fs.mkdirSync(userFolderPath, { recursive: true });
            console.log(`Folder created for user: ${userFolderPath}`);
        } else {
            console.log(`Folder already exists for user: ${userFolderPath}`);
        }

        res.status(200).json({ message: 'Login successful', user: result[0] });
    });
});

// Signup route
app.post('/signup', async (req, res) => {
    const { name, email, phone_number, username, password } = req.body;
    console.log(`Signup request received with data: `, req.body);

    // Check if user exists
    db.query('SELECT * FROM users WHERE username = ?', [username], async (err, result) => {
        if (err) {
            console.error('Error checking username:', err);
            return res.status(500).json({ message: 'Server error' });
        }

        if (result.length > 0) {
            console.log('Username already exists:', username);
            return res.status(400).json({ message: 'Username already exists' });
        }

        console.log('Username is available, proceeding with password hash...');

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        console.log('Password hashed successfully, proceeding with user insertion...');

        // Store user in DB
        db.query(
            'INSERT INTO users (name, email, phone_number, username, password) VALUES (?, ?, ?, ?, ?)',
            [name, email, phone_number, username, hashedPassword],
            (err, result) => {
                if (err) {
                    console.error('Error storing user in DB:', err);
                    return res.status(500).json({ message: 'Server error' });
                }
                console.log('User created successfully:', username);
                res.status(201).json({ message: 'User created successfully' });
            }
        );
    });
});

// Endpoint to create a project folder for a user
app.post('/create_project_folder', (req, res) => {
    const { username, projectName } = req.body;
    console.log(username);
    console.log(projectName);

    if (!username || !projectName) {
        return res.status(400).json({ message: 'Username and project name are required' });
    }

    const userFolderPath = path.join(__dirname, 'user_data', username);
    const projectFolderPath = path.join(userFolderPath, projectName);

    // Ensure user folder exists
    if (!fs.existsSync(userFolderPath)) {
        return res.status(404).json({ message: `User folder does not exist for ${username}` });
    }

    // Create project folder if it doesn't exist
    if (!fs.existsSync(projectFolderPath)) {
        fs.mkdirSync(projectFolderPath, { recursive: true });
        console.log(`Project folder created: ${projectFolderPath}`);
        return res.status(201).json({ message: 'Project folder created successfully' });
    } else {
        console.log(`Project folder already exists: ${projectFolderPath}`);
        return res.status(200).json({ message: 'Project folder already exists' });
    }
});

// Start server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
