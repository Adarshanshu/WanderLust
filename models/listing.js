const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Review = require("./review.js")

const listingSchema = new Schema({
  title: {
    type:String,
    required : true,
  },
  description: String,
  image: {
  filename: {
    type: String,
    default: "listingimage",
  },
  url: {
    type: String,
    default: "https://images.unsplash.com/photo-1552733407-5d5c46c3bb3b?auto=format&fit=crop&w=800&q=60",
    set: (v) =>
      v === ""
        ? "https://images.unsplash.com/photo-1552733407-5d5c46c3bb3b?auto=format&fit=crop&w=800&q=60"
        : v,
  },
},

  price : Number,
  location : String,
  country : String, 
  category: {
    type: String,
    enum: ["hotels", "homes", "villas", "beach", "mountain", "cabins", "lake", "apartments"],
  },
  reviews: [
    {
      type: Schema.Types.ObjectId,
      ref:"Review",
    },
  ] ,
  owner :{
    type :Schema.Types.ObjectId,
    ref:"user"
  }
});

listingSchema.post("findOneAndDelete",async(listing)=>{
 if(listing){
  await Review.deleteMany({_id:{$in: listing.reviews}});
 }
})

const Listing = mongoose.model("Listing",listingSchema);
module.exports = Listing;
