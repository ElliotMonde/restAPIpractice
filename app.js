// jshint esversion:6

/* wikiAPI
 * @author : Elliot Phua | @ElliotMonde
 * @description : A RESTful API to Post, Get, Put/Patch , Delete articles of my projects
 */

// dependencies
const express = require("express");
const app = express();
const ejs = require("ejs");
const mongoose = require("mongoose");
const _ = require("lodash");
const e = require("express");
const db = mongoose.connect("mongodb://127.0.0.1:27017/WikiDB");// connect database
/* for deployment on Heroku App
let port = process.env.PORT; 
if (port == null || port == ""){
    return port = 3000;
}
*/
const port = 3000;// local deployment
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));// Parse URL-encoded bodies, IMPORTANT if using postman to post urlencoded
app.use(express.static(__dirname + "/public"));
app.listen(port, () => { console.log("Server started on port: " + port) });

const articleSchema = new mongoose.Schema({
    Title: {
        type: String,
        required: 1,
        default: "Nameless Article"
    },
    Description: {
        type: String,
        default: "A project by Elliot Phua | @ElliotMonde"
    }
});
const Article = mongoose.model("Article", articleSchema);// db model
///////////////////////////////// routing to all articles /////////////////////////////////

app.get("/", function (req, res) { // get response redirect
    res.redirect("/articles");
});
app.route("/articles").get(function (req, res) { // route chaining methods, same routing destination
    Article.find({}, function (err, docs) {
        res.render("article", { articles: docs });
    });
}).post(function (req, res) {
    const newArticle = new Article({
        Title: _.upperFirst(_.lowerCase(req.body.Title)),
        Description: req.body.Description
    });
    newArticle.save(function (err) {
        if (err) {
            console.log(err);
        } else {
            res.redirect("/articles");
        };
    });
}).delete(function (req, res) {
    Article.deleteMany({}, function (err) {
        if (err) {
            console.log(err);
        } else {
            console.log("Successfully deleted all documents in Article.");
            res.redirect("/articles");
        }
    })
});

///////////////////////////////// routing to specific article /////////////////////////////////

app.route("/articles/:id")
    .get(function (req, res) {
        const id = req.params.id;
        if (id != _.upperFirst(id).replace(/ /g, "_")) {
            return res.redirect("/articles/" + _.upperFirst(id).replace(/ /g, "_"));
        };
        // console.log("line 83 " + id);
        Article.findOne({ Title: id.replace(/_/g, " ") }, function (err, doc) {
            if (err) {
                console.log(err)
            } else {
                if (doc == null || doc == "") {
                    doc = {
                        Title: "404 Article not found",
                        Description: "The article you are trying to find does not exist."
                    }
                };
                let docArray = [doc];
                res.render("article", { articles: docArray });
            }
        })
    })
    .put(function (req, res) { // using replace can omit overwrite: true
        Article.replaceOne( // put request either upsert or overwrite or replace, cannot use updateOne or updateMany for overwrite, use find<>AndUpdate
            { Title: req.params.id },
            {
                Title: _.upperFirst(req.body.Title),
                Description: req.body.Description
            },
            { upsert: true }, function (err, doc) { // find One article with matching Title, if not found insert one, doc in callback is log of put
                if (err) {
                    console.log(err);
                } else {
                    console.log(`Successfully PUT ${req.body.Title}.\n${JSON.stringify(doc)}`);
                    res.redirect(`/articles/${req.body.Title}`);
                }
            });
    })
    .patch(function (req, res) {
        Article.updateOne( // find and update fields, overwrite : false
            { Title: req.params.id },
            {
                $set: req.body
            },
            function (err, doc) {
                if (err) {
                    console.log(err);
                } else {
                    res.send(`Successfully PATCH ${req.body.Title || req.params.id}.\nmodifiedCount : ${doc.modifiedCount}`);
                }
            }
        )
    })
    .delete(function (req, res) {
        Article.deleteOne(
            { Title: req.params.id },
            function (err) {
                if (err) {
                    console.log(err)
                } else {
                    res.send(`Successfully DELETE ${req.params.id}`);
                }
            }
        )
    })