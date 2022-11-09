const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
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

const verifyJWT = (req, res, next) => {
  const authHeaders = req.headers.authorization;

  if (!authHeaders) {
    return res.status(401).send({ message: "Unauthorized access" });
  }

  const token = authHeaders.split(" ")[1];

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).send({ message: "Forbidden access" });
    }
    req.decoded = decoded;
    next();
  });
};

const run = async function () {
  try {
    const servicesCollection = client.db("servicesDB").collection("services");
    const reviewsCollection = client.db("servicesDB").collection("reviews");

    // Testing
    app.get("/", (req, res) => res.send("Hello from the server 👋"));

    // Sending JWT Token to the client
    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1d",
      });
      res.send({ token });
    });

    // get all services with or without limit
    app.get("/services", async (req, res) => {
      const query = {};
      const cursor = servicesCollection.find(query);

      let services = null;

      if (req.query.limit) {
        const element = +req.query.limit;
        services = await cursor
          .limit(element)
          .sort({ createdAt: -1 })
          .toArray();
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

    // create a service
    app.post("/services", async (req, res) => {
      const doc = req.body;
      const result = await servicesCollection.insertOne(doc);
      res.send(result);
    });

    // get all review or certain review by query
    app.get("/review", verifyJWT, async (req, res) => {
      const decoded = req.decoded;

      if (req.query.email && decoded.email !== req.query.email) {
        console.log("run");
        return res.status(403).send({ message: "Forbidden access" });
      }

      let query = null;

      if (req.query.email) {
        query = { email: req.query.email };
      } else if (req.query.serviceName) {
        query = { serviceName: req.query.serviceName };
      } else query = {};
      const cursor = reviewsCollection.find(query);
      const review = await cursor.sort({ createdAt: -1 }).toArray();
      res.send(review);
    });

    app.get("/reviewByServiceName", async (req, res) => {
      query = { serviceName: req.query.serviceName };
      const cursor = reviewsCollection.find(query);
      const review = await cursor.sort({ createdAt: -1 }).toArray();
      res.send(review);
    });

    // get review by id
    app.get("/review/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };

      const review = await reviewsCollection.findOne(query);
      res.send(review);
    });

    // create a review
    app.post("/review", async (req, res) => {
      const doc = req.body;
      const result = await reviewsCollection.insertOne(doc);
      res.send(result);
    });

    // update a review
    app.patch("/review/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };

      const updateDoc = {
        $set: {
          description: req.body.description,
          createdAt: req.body.createdAt,
          rating: req.body.rating,
          updatedAt: req.body.updatedAt,
        },
      };

      const result = await reviewsCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    // delete a review
    app.delete("/review/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };

      const result = await reviewsCollection.deleteOne(filter);
      res.send(result);
    });
  } finally {
    // NOTHING TO DO AT LEAST IN THIS PROJECT
  }
};

run().catch((err) => console.error(err));

app.listen(port, () => {
  console.log(`App is running on port ${port}`);
});
