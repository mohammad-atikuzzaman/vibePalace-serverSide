const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const port = process.env.PORT || 4000;

app.use(cookieParser());
app.use(express.json());
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://vibe-palace.web.app",
      "https://vibe-palace.firebaseapp.com",
    ],
    credentials: true,
  })
);

const uri = `mongodb+srv://${process.env.DB_User}:${process.env.DB_Pass}@cluster0.tyigyp7.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

//custom middleware
const verifyToken = async (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).send({ message: "Unauthorized" });
  }

  jwt.verify(token, process.env.SECRET_KEY_TOKEN, (err, decoded) => {
    if (err) {
      // console.log(err);
      return res.status(401).send({ message: "Unauthorized" });
    }
    // console.log("decoded data from custom middleware",decoded);
    req.decoded = decoded;
    next();
  });
};

async function run() {
  try {
    //  jwt token
    app.post("/jwt", async (req, res) => {
      const user = req.body;

      const token = jwt.sign(user, process.env.SECRET_KEY_TOKEN, {
        expiresIn: "1d",
      });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ success: true });
    });

    app.post("/logout", async (req, res) => {
      const user = req.body;
      // console.log("logging out :", user);
      res
        .clearCookie("token", { maxAge: 0, sameSite: "none", secure: true })
        .send({ message: true });
    });

    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // await client.db("admin").command({ ping: 1 });
    const database = client.db("vibePalace");
    const rooms = database.collection("rooms");
    const bookings = database.collection("bookings");
    const reviews = database.collection("reviews");

    app.get("/rooms", async (req, res) => {
      const result = await rooms.find().toArray();
      res.send(result);
    });

    app.get("/roomsSort", async (req, res) => {
      const sortOption = { price_per_night: 1 };
      const cursor = rooms.find().sort(sortOption);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/reviews", async (req, res) => {
      const sortOption = { time: -1 };
      const cursor = reviews.find().sort(sortOption);
      const result = await cursor.toArray();
      res.send(result);
    });
    app.get("/room/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const query = { _id: new ObjectId(id) };
      const result = await rooms.findOne(query);

      res.send(result);
    });

    app.get("/myRooms/:email", verifyToken, async (req, res) => {
      const { email } = req.decoded;
      const myEmail = req.params.email;

      if (email !== myEmail) {
        return res.status(403).send({ message: "Forbidden request" });
      }

      const query = { email: myEmail };
      const result = await bookings.find(query).toArray();

      res.send(result);
    });

    app.get("/reviews/:id", async (req, res) => {
      const id = req.params.id;

      const query = { roomId: id };
      const result = await reviews.find(query).toArray();

      res.send(result);
    });

    app.post("/bookings", async (req, res) => {
      const data = req.body;
      const bookingsData = {
        ...data,
      };
      const result = await bookings.insertOne(bookingsData);
      res.send(result);
    });

    app.post("/reviews", async (req, res) => {
      const data = req.body;
      console.log(data);
      const review = {
        ...data,
      };
      const result = await reviews.insertOne(review);
      res.send(result);
    });

    app.patch("/bookRoom/:id", async (req, res) => {
      const id = req.params.id;
      const { availability } = req.body;
      const query = { _id: new ObjectId(id) };
      const options = {
        upsert: true,
      };
      const updateRoom = {
        $set: { availability },
      };
      const result = await rooms.updateOne(query, updateRoom, options);
      res.send(result);
    });

    app.patch("/updateDate/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const { date } = req.body;
      console.log(date);
      const query = { _id: id };
      const options = {
        upsert: true,
      };
      const updateRoom = {
        $set: { date },
      };
      const result = await bookings.updateOne(query, updateRoom, options);
      res.send(result);
    });

    app.delete("/deleteBookings/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: id };
      const result = await bookings.deleteOne(query);
      res.send(result);
    });

    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
