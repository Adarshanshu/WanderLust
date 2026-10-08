if(process.env.NODE_ENV!="production"){
    require('dotenv').config();
}

const express = require('express');
const app = express();
const mongoose = require('mongoose');
const Listing = require("./models/listing.js");
const path = require("path");
const multer = require("multer");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const Review = require("./models/review.js");
const session = require("express-session")
const MongoStore = require('connect-mongo').default;

const passport = require("passport");
const LocalStrategy = require("passport-local");
const user = require("./models/user.js");
const {isLoggedIn, flash, saveRedirectUrl, isListingOwner, isReviewOwner} = require("./middleware.js")

const listingCategoryFromText = (listing) => {
    const text = `${listing.title || ""} ${listing.description || ""}`.toLowerCase();
    if (/hotel|lodge|resort/.test(text)) return "hotels";
    if (/beach|beachfront|coast|ocean|seaside/.test(text)) return "beach";
    if (/mountain|ski|alps/.test(text)) return "mountain";
    if (/cabin|chalet|treehouse|camp/.test(text)) return "cabins";
    if (/lake|lakefront/.test(text)) return "lake";
    if (/apartment|loft|penthouse|condo/.test(text)) return "apartments";
    if (/villa/.test(text)) return "villas";
    return "homes";
};

const { storage } = require("./cloudConfig.js");
const upload = multer({
    storage,
    fileFilter: (req, file, callback) => {
        const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
        if (!allowedTypes.includes(file.mimetype)) {
            return callback(new Error("Upload a JPG, PNG, WEBP, or GIF image."));
        }
        callback(null, true);
    },
    limits: { fileSize: 5 * 1024 * 1024 }
});
const uploadListingImage = (req, res, next) => {
    upload.single("imageFile")(req, res, (err) => {
        if (err) {
            req.flash("error", err.code === "LIMIT_FILE_SIZE"
                ? "Image must be 5 MB or smaller."
                : err.message);
            return res.redirect("/listings/new");
        }
        next();
    });
};


app.use(methodOverride("_method"));

const dbUrl = process.env.ATLASDB_URL;
if (!dbUrl) {
    throw new Error("ATLASDB_URL is required to connect to MongoDB.");
}

const isProduction = process.env.NODE_ENV === "production";
const sessionSecret = process.env.SESSION_SECRET || (isProduction ? "" : "local-development-session-secret");
if (!sessionSecret) {
    throw new Error("SESSION_SECRET is required in production.");
}

const dbConnectionPromise = mongoose.connect(dbUrl);

app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"));
app.use(express.urlencoded({extended:true}));
app.engine('ejs',ejsMate);
app.use(express.static(path.join(__dirname, '/public')));




if (isProduction) {
    app.set("trust proxy", 1);
}

const sessionOption ={
    name: "wanderlust.sid",
    secret: sessionSecret,
    resave : false,
    saveUninitialized:false,
    store: MongoStore.create({
        clientPromise: dbConnectionPromise.then(() => mongoose.connection.getClient()),
        collectionName: "sessions",
        ttl: 7 * 24 * 60 * 60,
    }),
    cookie:{
        maxAge : 7*24*60*60*1000,
        httpOnly: true,
        sameSite: "lax",
        secure: isProduction,
    }
};


// app.get("/",(req,res) =>{
//     res.send("hii i am root or main landing page");
// });

app.use(session(sessionOption))
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(user.authenticate()));

passport.serializeUser(user.serializeUser());
passport.deserializeUser(user.deserializeUser());

app.use((req,res,next)=>{
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currentUser = req.user;
    next();
})

// demo user for passport session
app.get("/demouser",async(req,res)=>{
    let fakeUser = new user({
        email: "student@gmail.com",
        username: "adarsh-m",

    });
    let registeredUser = await user.register(fakeUser,"admin@1234"); //password="admin@1234"
    res.send(registeredUser)
})


// this is index route
app.get("/listings", async(req,res) =>{
  const searchQuery = typeof req.query.q === "string" ? req.query.q.trim() : "";
  const categories = ["hotels", "homes", "villas", "beach", "mountain", "cabins", "lake", "apartments"];
  const searchCategory = categories.includes(req.query.category) ? req.query.category : "all";
  let allListing = await Listing.find({}).populate("owner");
  if (searchQuery || searchCategory !== "all") {
      const normalizedQuery = searchQuery.toLowerCase();
      allListing = allListing.filter((listing) => {
          const category = listing.category || listingCategoryFromText(listing);
          const searchableText = `${listing.title || ""} ${listing.description || ""} ${listing.location || ""} ${listing.country || ""}`.toLowerCase();
          return (searchCategory === "all" || category === searchCategory)
              && (!normalizedQuery || searchableText.includes(normalizedQuery));
      });
  }
  res.render("listings/index.ejs",{allListing, listingCategoryFromText, searchQuery, searchCategory});
});

//new route

app.get("/listings/new", isLoggedIn,(req,res) =>{
    res.render("listings/new.ejs");
});


// show route
app.get("/listings/:id",async(req,res) =>{
    let {id} = req.params;
    const listing =await Listing.findById(id)
        .populate("owner")
        .populate({ path: "reviews", populate: { path: "owner" } });
    res.render("listings/show.ejs",{listing});
});

// Create Route
app.post("/listings", isLoggedIn, uploadListingImage, async(req,res) =>{
    let {title, description, price, location, country, imageUrl, category} = req.body;
    const image = req.file
        ? { filename: req.file.filename, url: req.file.path }
        : { url: imageUrl };
    let newListing = new Listing({
        title,
        description,
        price: parseInt(price),
        location,
        country,
        category: category || listingCategoryFromText({ title, description }),
        image,
        owner: req.user._id
    });
    await newListing.save();
    req.flash("success","new Listing Saved")
    res.redirect("/listings");
});

// edit route
app.get("/listings/:id/edit",isLoggedIn, isListingOwner, async(req,res) =>{
    const listing = res.locals.listing;
    res.render("listings/edit.ejs",{
        listing,
        listingCategory: listing.category || listingCategoryFromText(listing),
    });
});

//update route
app.put("/listings/:id",isLoggedIn, isListingOwner, async(req,res) =>{
    let {id} = req.params;
    let {title, description, price, location, country, category, image} = req.body.listing;
    await Listing.findByIdAndUpdate(id, {title, description, price: parseInt(price), location, country, category, image});
    req.flash("success", "Listing updated successfully.");
    res.redirect(`/listings/${id}`);
});

//delete route
app.delete("/listings/:id", isLoggedIn, isListingOwner,async(req,res) =>{
    let {id} = req.params;
    await Listing.findByIdAndDelete(id);
    req.flash("success", "Listing deleted successfully.");
    res.redirect("/listings");
});

// reviews -> post route
app.post("/listings/:id/reviews", isLoggedIn, async(req,res)=>{
   let listing = await Listing.findById(req.params.id);
   if (!listing) {
       return res.status(404).send("Listing not found");
   }
   let newReview = new Review({ ...req.body.review, owner: req.user._id });

   listing.reviews.push(newReview);
   await newReview.save();
   await listing.save();
   req.flash("success", "Review added successfully.");
   res.redirect(`/listings/${listing._id}`);

})

// delete a review belonging to a listing
app.delete("/listings/:id/reviews/:reviewId", isLoggedIn, isReviewOwner, async(req, res) => {
    const { id, reviewId } = req.params;
    const listing = res.locals.listing;

    listing.reviews.pull(reviewId);
    await listing.save();
    await Review.findByIdAndDelete(reviewId);
    req.flash("success", "Review deleted successfully.");
    res.redirect(`/listings/${id}`);
});

app.get("/signup",(req,res)=>{
    res.render("users/signup.ejs");
});

app.post("/signup", async (req, res, next) => {
    try {
        const { username, email, password } = req.body;
        const newUser = new user({ username, email });
        const registeredUser = await user.register(newUser, password);
        req.login(registeredUser, (err) => {
            if (err) return next(err);
            req.flash("success", "Welcome to WanderLust!");
            res.redirect("/listings");
        });
    } catch (err) {
        req.flash("error", err.message);
        res.redirect("/signup");
    }
});

app.get("/login", (req, res) => {
    res.render("users/login.ejs");
});

app.post("/login",saveRedirectUrl, passport.authenticate("local", {
    failureFlash: true,
    failureRedirect: "/login",
}), (req, res) => {
    req.flash("success", "Welcome back!");
    let redirectUrl = res.locals.redirectUrl || "/listings"
    res.redirect(redirectUrl);
});

app.post("/logout", (req, res, next) => {
    req.logout((err) => {
        if (err) return next(err);
        req.flash("success",  "You have been logged out.");
        res.redirect("/listings");
    });
});

const port = process.env.PORT || 8080;
dbConnectionPromise
    .then(() => {
        console.log("connected to database");
        app.listen(port, () => {
            console.log(`server is running on port ${port}`);
        });
    })
    .catch((error) => {
        console.error("Failed to start server because MongoDB is unavailable:", error);
        process.exitCode = 1;
    });





// app.get("/testListing", async(req,res) =>{
//     let sampleListing = new Listing({
//         title : "my new villa",
//         description : "by the beach",
//         price : 6000,
//         location : "goa",
//         country : "India",
//     });
//      await sampleListing.save();
//      console.log("sample was saved..");
//      res.send("successfull testing");
// });

