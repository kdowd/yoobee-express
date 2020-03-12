const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const myconn = require("./connection");
// every single collection will need a model ,,,,
//hmmmmm, **********************************************;

const app = express();
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));
// end init express

// init database stuff
//setup database connection
mongoose.connect(myconn.atlas, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const db = mongoose.connection;

db.on("connected", e => {
  console.log("+++ Mongoose connected ");
});

db.on("error", () => console.log("Database error"));
// end database stuff

// for now we have nothing on the top level
app.get("/", function(req, res) {
  res.json({ result: false });
});
//end top level

// start of routes
const router = express.Router();
app.use("/api", router);

// define CRUD api routes for :
// CREATE
router.post("/users", (req, res) => {
  var userModel = new User();

  var data = req.body;
  Object.assign(userModel, data);

  userModel.save().then(
    user => {
      res.json({ result: true });
      //OR
      // res.json(userModel);
    },
    () => {
      res.json({ result: false });
    }
  );
});

// READ
router.get("/users", (req, res) => {
  // .sort({ age: "descending" })
  User.find().then(
    usersFromDataBase => {
      res.json(usersFromDataBase);
    },
    () => {
      res.json({ result: false });
    }
  );
});

// find and return a single user based upon _id
router.get("/users/:id", (req, res) => {
  User.findOne({ _id: req.params.id }, function(err, objFromDB) {
    //exit now if any kind of error
    if (err) return res.json({ result: false });
    res.send(objFromDB);
  });
});

//UPDATE
router.put("/users/:id", (req, res) => {
  User.findOne({ _id: req.params.id }, function(err, objFromDB) {
    if (err)
      return res.json({
        result: false
      });
    var data = req.body;
    // lets see the react data
    console.log(" ++++>>> ", data);
    Object.assign(objFromDB, data);
    objFromDB.save().then(
      response => {
        res.json({
          result: true
        });
      },
      error => {
        res.json({
          result: false
        });
      }
    );
  });
});

// DELETE
router.delete("/users/:id", (req, res) => {
  // as a promise
  User.deleteOne({ _id: req.params.id }).then(
    () => {
      res.json({ result: true });
    },
    () => {
      res.json({ result: false });
    }
  );
});

// deal with any unhandled urls on the api endpoint - place at end
router.get("/*", (req, res) => {
  return res.json({ result: "not a valid endpoint" });
});

// ditto for app route
app.get("/*", (req, res) => {
  res.json({ result: "invalid endpoint, please choose another" });
});

// and finally,  lets listen
const port = 4000;
app.listen(process.env.PORT || port, () => {
  console.log(`Example app listening on port ${port}!`);
});
