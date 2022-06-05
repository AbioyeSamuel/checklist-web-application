//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-sam:test123@cluster0.gk8tj.mongodb.net/todolistDB");

const itemsSchema = {
  name: String
};
const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your todo list."
});
const item2 = new Item({
  name: "Hit the + button to add a new item."
});
const item3 = new Item({
  name: "<-- Hit this to delete all item."
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items:[itemsSchema]
};

const List = mongoose.model("List", listSchema);


const today = new Date();
const options = {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric"
};
const day = today.toLocaleDateString("en-us", options);

app.get("/", function(req, res){
  res.sendFile(__dirname + "/welcome.html");
});
app.post("/", function(req, res){
  res.redirect("/todo");
});


app.get("/todo", function(req, res) {
  Item.find({}, function(err, foundItems) {

    if (foundItems.length < 0) {
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully inserted the items");
        }
      });
      res.redirect("/todo");
    } else {
      res.render("list", {listTitle: day, newListItems: foundItems});
    }
  });
});

app.post("/todo", function(req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if(listName===day){
    item.save();
    res.redirect("/todo");
  } else {
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/todo/" + listName);
    });
  }
});

app.post("/delete", function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName===day){
    Item.findByIdAndRemove(checkedItemId, function(err){
    if(!err) {
      console.log("Successfully removed/deleted item.");
      res.redirect("/todo");
    }
  });
} else {
  List.findOneAndUpdate({name: listName},{$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
    if(!err){
      res.redirect("/todo/" + listName);
    }
  });
}
});

app.get("/todo/:customListName", function(req, res){
  const customListName = _.capitalize(req.params.customListName);
  List.findOne({name:customListName}, function(err, foundList){
    if(!err){
      if(!foundList){
        //Create new List
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/todo/" + customListName);

      } else {
        //Show existing list
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
    }
  });
  });

app.get("/about", function(req, res) {
  res.render("about");
});

app.listen(process.env.PORT || 3000, function(req, res) {
  console.log("Server started on port 3000");
});
