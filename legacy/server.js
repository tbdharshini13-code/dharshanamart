const express = require("express");
const mysql = require("mysql2");
const path = require("path");
require("dotenv").config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname)));

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect((err) => {

    if (err) {
        console.log("Database connection failed:");
        console.log(err.message);
        return;
    }

    console.log("MySQL Database Connected Successfully!");
});

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(process.env.PORT, () => {
    console.log(`Dharshini Mart running at http://localhost:${process.env.PORT}`);
});