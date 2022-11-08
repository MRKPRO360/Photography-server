const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER_NAME}:${process.env.DB_PASSWORD}@cluster2.bl45nhj.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

const run = async function () {
  try {
    const servicesCollection = client.db("servicesDB").collection("services");
    // Testing
    app.get("/", (req, res) => res.send("Hello from the server 👋"));

    // get all services with or without limit
    app.get("/services", async (req, res) => {
      const query = {};
      const cursor = servicesCollection.find(query);

      let services = null;

      if (req.query.limit) {
        const element = +req.query.limit;
        services = await cursor.limit(element).toArray();
      } else {
        services = await cursor.toArray();
      }
      res.send(services);
    });

    // get individual service
    app.get("/services/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };

      const service = await servicesCollection.findOne(query);
      res.send(service);
    });
  } finally {
    // NOTHING TO DO AT LEAST IN THIS PROJECT
  }
};

run().catch((err) => console.error(err));

app.listen(port, () => {
  console.log(`App is running on port ${port}`);
});
