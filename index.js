const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 4000;

app.use(express.json());
app.use(cors());

const uri =
  "mongodb+srv://vibePalace:akash123@cluster0.tyigyp7.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // await client.db("admin").command({ ping: 1 });
    const database = client.db("vibePalace");
    const rooms = database.collection("rooms");
    const bookings = database.collection("bookings");

    app.get("/rooms", async (req, res) => {
      const cursor = rooms.find();
      const result = await cursor.toArray();
      res.send(result);
    });
    app.get("/room/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const query = { _id: new ObjectId(id) };
      const result = await rooms.findOne(query)
      
      res.send(result);
    });



    app.post("/bookings", async(req, res)=>{
      const data = req.body
      const bookingsData ={
        ...data
      }
      const result= await bookings.insertOne(bookingsData)
      res.send(result)

    })



    app.patch("/bookRoom/:id", async(req, res)=>{
      const id = req.params.id
      const {availability} = req.body
      const query = {_id: new ObjectId(id)}
      const options ={
        upsert: true
      }
       
      const  updateRoom ={
        $set: {
          availability
        }
      }
      const result = await rooms.updateOne(query, updateRoom, options)
      res.send(result)

    })

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
