const express = require('express');
const app = express();
const mysql = require('mysql');
const cors = require('cors');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);

const sessionStore = new MySQLStore({
    host: 'streammotion.database.windows.net',
    user: 'juanfranfdez',
    password: 'streammotionDB@',
    database: 'StreamMotionDB',
});
app.use(session({
    secret: 'mail',
    resave: true,
    saveUninitialized: true,
    store: sessionStore,
    cookie: {
        sameSite: false,
        secure: false,
        httpOnly: false,
        maxAge: 1000 * 60 *60,
    },
    credentials: true,
}));

app.use(cors({
    origin: 'https://stream-motion-client.vercel.app/',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    exposedHeaders: ['Authorization'],
  }));
app.use(express.json());

const db = mysql.createConnection({
    host: 'streammotion.database.windows.net',
    user: 'juanfranfdez',
    password: 'streammotionDB@',
    database: 'StreamMotionDB',
    port: "3306",
});

db.connect((err) => {
    if (err) {
        console.error('Fail in DataBase:', err);
    } else {
        console.log('DataBase Connected');
    }
});

app.post('/signup', (req,res) => {
    // Query para registrar tus datos en la base de datos
    const sql = "INSERT INTO users (`email`,`password`,`profIMG`) VALUES (?, ?, ?)";

    const { email, password, profIMG } = req.body;

    // Inserta nuevos usuarios en la base de datos
    db.query(sql, [email, password, profIMG], (err, data) => {
        if (err) {
            console.error("Error inserting into database:", err);
        }
        return res.json(data);
    })
})

app.post('/signin', (req,res) => {
    // Query para registrar tus datos en la base de datos
    const sql2 = "SELECT * FROM users WHERE email = ? AND password = ?";

    const { email, password} = req.body;

    if(email && password){
        db.query(sql2, [email, password], async (err, datas) => {
            if(err) {
                console.log(err);
                res.status(500).send('Error en la base de datos');
            } else if (datas.length > 0) {
                const sessionID = generateSessionID();
                req.session.sessionID = sessionID;
                req.session.userEmail = datas[0].email;
                res.cookie('sessionID', sessionID, { httpOnly: true });
                res.status(200).send({ userEmail: req.session.userEmail });
            } else {
                res.status(401).send('Error al Iniciar Sesión');
            } 
        })
    }
})

function generateSessionID() {
    const uuid = require('uuid');
    return uuid.v4();
}

app.get('/films', async (req, res) => {
    try {
        const sessionID = req.session.sessionID;
        if (!sessionID || sessionID !== req.session.sessionID) {
            return res.status(401).send('Unauthorized');
        }

        const userEmail = req.session.userEmail;
        const sql3 = "SELECT * FROM users WHERE email = ?";

        const data = await new Promise((resolve, reject) => {
            db.query(sql3, [userEmail], (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });

        res.status(200).json(data);
    } catch (error) {
        console.error("Error al obtener datos del usuario:", error);
        res.status(500).send('Error en el servidor');
    }
});

app.get('/edit', async (req, res) => {
    try {
        const sessionID = req.session.sessionID;
        if (!sessionID || sessionID !== req.session.sessionID) {
            return res.status(401).send('Unauthorized');
        }

        const userEmail = req.session.userEmail;
        const sql3 = "SELECT * FROM users WHERE email = ?";

        const data = await new Promise((resolve, reject) => {
            db.query(sql3, [userEmail], (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });

        res.status(200).json(data);
    } catch (error) {
        console.error("Error al obtener datos del usuario:", error);
        res.status(500).send('Error en el servidor');
    }
});

app.post('/edit', (req,res) => {
    if (!req.session.userEmail) {
        return res.status(401).send('Unathorized');
    }

    // Query para registrar tus datos en la base de datos
    const sql = "UPDATE users SET `email` = ?, `password` = ?, `profIMG` = ? WHERE `email` = ?";

    const { email, password, profIMG } = req.body;
    const userEmail = req.session.userEmail;

    // Inserta nuevos usuarios en la base de datos
    db.query(sql, [email, password, profIMG, userEmail], (err, data) => {
        if (err) {
            console.error("Error inserting into database:", err);
        }
        req.session.userEmail = email;
        return res.json(data);
    })
})

app.post('/delete', (req,res) => {
    console.log(req.session);
    if (!req.session.userEmail) {
        return res.status(401).send('Unathorized');
    }

    const sql = "DELETE FROM users WHERE `email` = ?";

    const userEmail = req.session.userEmail;

    db.query(sql, [userEmail], (err, data) => {
        if (err) {
            console.error("Error deleting into database:", err);
        }
        req.session.destroy();
        return res.json(data);
    })
})
  
// Ruta para cerrar sesión
app.post('/logout', (req, res) => {
    req.session.destroy();
    res.status(200).send('Sesión cerrada');
});

app.listen(3001, () => {
    console.log('Server On, Port 3001')
});