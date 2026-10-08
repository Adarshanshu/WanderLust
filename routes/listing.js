// const express = require("express");
// const router = express.Router();



// // this is index route
// router.get("/listings", async(req,res) =>{
//   const allListing= await Listing.find({});
//   res.render("listings/index.ejs",{allListing});
// });

// //new route

// router.get("/listings/new",(req,res) =>{
//     res.render("listings/new.ejs");
// });


// // show route
// router.get("/listings/:id",async(req,res) =>{
//     let {id} = req.params;
//     const listing =await Listing.findById(id).populate("reviews");
//     res.render("listings/show.ejs",{listing});
// });

// // Create Route
// router.post("/listings", async(req,res) =>{
//     let {title, description, price, location, country, image} = req.body.listing;
//     let newListing = new Listing({
//         title,
//         description,
//         price: parseInt(price),
//         location,
//         country,
//         image
//     });
//     await newListing.save();
//     res.redirect("/listings");
// });

// // edit route
// router.get("/listings/:id/edit", async(req,res) =>{
//     let {id} = req.params;
//     const listing = await Listing.findById(id);
//     res.render("listings/edit.ejs",{listing});
// });

// //update route
// router.put("/listings/:id", async(req,res) =>{
//     let {id} = req.params;
//     let {title, description, price, location, country, image} = req.body.listing;
//     await Listing.findByIdAndUpdate(id, {title, description, price: parseInt(price), location, country, image});
//     res.redirect(`/listings/${id}`);
// });

// //delete route
// router.delete("/listings/:id", async(req,res) =>{
//     let {id} = req.params;
//     await Listing.findByIdAndDelete(id);
//     res.redirect("/listings");
// });

// // reviews -> post route
// router.post("/listings/:id/reviews",async(req,res)=>{
//    let listing = await Listing.findById(req.params.id);
//    if (!listing) {
//        return res.status(404).send("Listing not found");
//    }
//    let newReview = new Review(req.body.review);

//    listing.reviews.push(newReview);
//    await newReview.save();
//    await listing.save();
//    res.redirect(`/listings/${listing._id}`);

// })

// // delete a review belonging to a listing
// router.delete("/listings/:id/reviews/:reviewId", async(req, res) => {
//     const { id, reviewId } = req.params;
//     const listing = await Listing.findById(id);
//     if (!listing) {
//         return res.status(404).send("Listing not found");
//     }

//     const belongsToListing = listing.reviews.some((review) => review.equals(reviewId));
//     if (!belongsToListing) {
//         return res.status(404).send("Review not found for this listing");
//     }

//     listing.reviews.pull(reviewId);
//     await listing.save();
//     await Review.findByIdAndDelete(reviewId);
//     res.redirect(`/listings/${id}`);
// });

// module.exports = router;


