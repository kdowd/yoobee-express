const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const fileUpload = require("express-fileupload");
const myconn = require("./connection");

// every single collection will need a model
const User = require("./models/users-model");

// init express, bodyparser now built in to express...
const app = express();
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(fileUpload());
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

// my functions
function updateAfterFileUpload(req, res, objFromDB, fileName) {
  // form data from frontend is stored in the req.body
  var data = req.body;
  Object.assign(objFromDB, data);
  // if fileName param is null use default.jpg
  objFromDB.profile_image = fileName || "default.jpg";

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
}
// end  my functions

// define CRUD api routes for :
// CREATE

// for normal form , no images
router.post("/users", (req, res) => {
  var userModel = new User();

  var data = req.body;
  Object.assign(userModel, data);

  userModel.save().then(
    user => {
      res.json({ result: true });
    },
    () => {
      res.json({ result: false });
    }
  );
});

// for form , with one image max
router.post("/users/form-with-image", (req, res) => {
  var userModel = new User();

  if (req.files) {
    var files = Object.values(req.files);
    var uploadedFileObject = files[0];
    var uploadedFileName = uploadedFileObject.name;
    var nowTime = Date.now();
    var newFileName = `${nowTime}_${uploadedFileName}`;

    uploadedFileObject.mv(`public/${newFileName}`).then(
      params => {
        updateAfterFileUpload(req, res, userModel, newFileName);
      },
      params => {
        updateAfterFileUpload(req, res, userModel);
      }
    );
  } else {
    updateAfterFileUpload(req, res, userModel);
  }
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
// update for users with no form image
router.put("/users/:id", (req, res) => {
  User.findOne({ _id: req.params.id }, function(err, objFromDB) {
    if (err)
      return res.json({
        result: false
      });
    var data = req.body;
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

// update for users with form image
router.put("/users/with-form-image/:id", (req, res) => {
  User.findOne({ _id: req.params.id }, function(err, objFromDB) {
    if (err)
      return res.json({
        result: false
      });

    if (req.files) {
      var files = Object.values(req.files);
      var uploadedFileObject = files[0];
      var uploadedFileName = uploadedFileObject.name;
      var nowTime = Date.now();
      var newFileName = `${nowTime}_${uploadedFileName}`;

      uploadedFileObject.mv(`public/${newFileName}`).then(
        params => {
          updateAfterFileUpload(req, res, objFromDB, newFileName);
        },
        params => {
          updateAfterFileUpload(req, res, objFromDB);
        }
      );
    } else {
      updateAfterFileUpload(req, res, objFromDB);
    }

    /////////
  });
});

// add single image to express - return filename, does not write to mongodb
router.put("/users/upload", (req, res) => {
  if (req.files) {
    var files = Object.values(req.files);
    var uploadedFileObject = files[0];
    var uploadedFileName = uploadedFileObject.name;
    var nowTime = Date.now();
    var newFileName = `${nowTime}_${uploadedFileName}`;

    uploadedFileObject.mv(`public/${newFileName}`, function() {
      // update app
      res.json({ filename: newFileName, result: true });
    });
  } else {
    res.json({ result: false });
  }
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
