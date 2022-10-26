const express = require("express");
const bodyParser = require("body-parser");
const _ = require("lodash");
const mongoose = require("mongoose");
const app = express();
// const $ = require("jquery");

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(express.static("public"));
mongoose.connect("mongodb+srv://admin-fathima:Mnbvc1234x@cluster0.tix9grr.mongodb.net/todoAppdb", function() {
  console.log("connected to mongodb");
});

const itemSchema = new mongoose.Schema({
  activity: {
    type: String,
    trim: true,
    required: true
  },
  date: {
    type: Date,
    default: Date.now()
  }
});
const ToDoItem = mongoose.model("ToDoItem", itemSchema);
const item1 = new ToDoItem({
  activity: "Hey there, Welcome!"
});
const item2 = new ToDoItem({
  activity: "What is your main focus today?"
});
const defaultItems = [item1, item2];

const customlstSchema = new mongoose.Schema({
  title: String,
  items: [itemSchema],
  date: {
    type: Date,
    default: Date.now()
  }
});
// itemSchema.path('date').index({expires:});
const CustomList = mongoose.model("CustomList", customlstSchema);


const date = new Date();
let options = {
  weekday: "long",
  day: "numeric",
  month: "long"
};
const today = date.toLocaleDateString("en-US", options);

app.get("/",function(req, res) {
  ToDoItem.find({}, function(err, itemsFound) {
    if (itemsFound.length === 0){
      ToDoItem.insertMany(defaultItems, function(err){
      if(err){
        console.log(err.message);
      } else{
        console.log("item inserted to db's todoitems collection");
      }
      res.redirect("/");
    });

  }else{
    res.render("index", {
      currentDay: today,
      listTitle: "todo",
      presentItems: itemsFound
    });
  }
  });
});

app.post("/", function(req, res) {
  const newActivity = req.body.newItem;
  const listName = req.body.list;
  const nextActivity = new ToDoItem({
    activity: newActivity
  });

  if (listName === "todo") {
    nextActivity.save();
    console.log("item saved to db");
    res.redirect("/");
  } else {
    CustomList.findOne({
      title: listName
    }, function(err, foundList) {
      foundList.items.push(nextActivity);
      foundList.save();
      res.redirect("/category/" + listName);
    });
  }
});

app.get("/category/:customListname", function(req, res) {
  const custLstname = _.capitalize(req.params.customListname);
  CustomList.findOne({title: custLstname}, function(err, result) {
    if (!err) {
      if (!result) {
        const defaultcustList = new CustomList({
          title: custLstname,
          items: defaultItems
        });
        defaultcustList.save();
        res.redirect("/category/" + custLstname);
      } else {
        res.render("index", {
          listTitle: result.title,
          currentDay: today,
          presentItems: result.items
        });
      }
    }
  });
});

app.get("/help", function(req, res) {

  res.render("help");
});




app.post("/delete", function(req, res) {
  const idofChecked = req.body.check;
  const lstTitle = req.body.custlistTitle;
  if (lstTitle === "todo") {
    ToDoItem.findByIdAndRemove(idofChecked, function(err) {
      if (!err) {
        console.log("successfully deleted checked item");
        res.redirect("/");
      }
    });
  } else {
    CustomList.findOneAndUpdate({
      title: lstTitle
    }, {
      $pull: {
        items: {
          _id: idofChecked
        }
      }
    }, function(err, foundList) {
      if (!err) {
        res.redirect("/category/" + lstTitle);
      }
    });
  }


});


app.listen(3000 || process.env.PORT, function() {
  console.log("server has started");
});


// const yesterday = currentDay.setDate(currentDay.getDate()-1);
//
// ToDoItem.deleteMany({date:yesterday}, function(err){
//   if(!err){
//     console.log("data deleted");
//   }
// });
