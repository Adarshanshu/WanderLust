const { format } = require("util");

module.exports.isLoggedIn = (req,res,next)=>{
     if(!req.isAuthenticated()){
      req.session.redirectUrl = req.originalUrl;
        req.flash("error","You must be logged in to create New Listngs");
      return res.redirect("/login");
    }
    next();
}

module.exports.saveRedirectUrl = (req,res,next)=>{
  if(req.session.redirectUrl){
    res.locals.redirectUrl = req.session.redirectUrl;
  }
  next();
}

module.exports.flash = () => (req, res, next) => {
  if (req.flash) return next();

  req.flash = function(type, message) {
    if (!this.session) throw new Error("req.flash() requires sessions");
    const messages = this.session.flash = this.session.flash || {};

    if (type && arguments.length > 1) {
      const value = arguments.length > 2
        ? format.apply(null, Array.prototype.slice.call(arguments, 1))
        : message;
      if (Array.isArray(value)) {
        (messages[type] = messages[type] || []).push(...value);
        return messages[type].length;
      }
      return (messages[type] = messages[type] || []).push(value);
    }

    if (type) {
      const queued = messages[type] || [];
      delete messages[type];
      return queued;
    }

    this.session.flash = {};
    return messages;
  };

  next();
};

module.exports.isListingOwner = async (req, res, next) => {
  try {
    const Listing = require("./models/listing.js");
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      return res.status(404).send("Listing not found");
    }
    if (!listing.owner || !listing.owner.equals(req.user._id)) {
      req.flash("error", "You are not the owner of this listing.");
      return res.redirect(`/listings/${listing._id}`);
    }
    res.locals.listing = listing;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports.isReviewOwner = async (req, res, next) => {
  try {
    const Listing = require("./models/listing.js");
    const Review = require("./models/review.js");
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).send("Listing not found");

    const belongsToListing = listing.reviews.some((reviewId) => reviewId.equals(req.params.reviewId));
    if (!belongsToListing) return res.status(404).send("Review not found for this listing");

    const review = await Review.findById(req.params.reviewId);
    if (!review) return res.status(404).send("Review not found");
    if (!review.owner || !review.owner.equals(req.user._id)) {
      req.flash("error", "You are not the owner of this review.");
      return res.redirect(`/listings/${listing._id}`);
    }

    res.locals.listing = listing;
    res.locals.review = review;
    next();
  } catch (err) {
    next(err);
  }
};
