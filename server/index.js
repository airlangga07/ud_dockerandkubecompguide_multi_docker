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
const redis = require("redis");

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

// redis config
const redisClient = redis.createClient({
    host: redisHost,
    port: redisPort,
    retry_strategy: () => 1000
});
const redisPublisher = redisClient.duplicate();

// express route handlers
app.get("/", (req, res) => {
    res.send("Hi!");
});

app.get("/values/all", async (req, res) => {
    const values = await pgClient.query("SELECT * FROM values");
    res.send(values.rows);
});

app.get("/values/current", async (req, res) => {
    redisClient.hgetall("values", (err, values) => {
        res.send(values);
    });
});

app.post("/values", async (req, res) => {
    const index = req.body.index;

    if (parseInt(index) > 40) {
        return res.status(422).send("Index too high");
    }

    // post to redis
    redisClient.hset("values", index, "Nothing yet!");
    redisPublisher.publish("insert", index);

    // post to postgres
    pgClient.query("INSERT INTO values(number) VALUES($1)", [index]);

    // send back the response
    res.send({ working: true });
});

app.listen(5000, () => {
    console.log("App is listening on porrt 5000");
});