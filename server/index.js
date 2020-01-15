const { 
    redisHost,
    redisPort,
    pgUser,
    pgHost,
    pgDatabase,
    pgPassword,
    pgPort
} = require("./keys");

// express app setup
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

// new express application
const app = express();

// middlewares
app.use(cors());
app.use(bodyParser.json());

// postgres client setup
const { Pool } = require("pg");
const pgClient = new Pool({
    user: pgUser,
    host: pgHost,
    database: pgDatabase,
    password: pgPassword,
    port: pgPort
});
pgClient.on("error", () => console.log("Lost PG connection..."));

pgClient
    .query("CREATE TABLE IF NOT EXISTS values(number INT)")
    .catch(err => console.log(err));