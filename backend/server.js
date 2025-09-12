const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Connect MongoDB
mongoose.connect("mongodb+srv://guptakhushu2106_db_user:%23Khushu2106@cluster0.sfmihfe.mongodb.net/feedbackDB?retryWrites=true&w=majority&appName=Cluster0",{})
  .then(() =>console.log("MongoDB Atlas connected..."))
  .catch(err => console.error("MongoDB connection error :",err));

// Feedback schema
const FeedbackSchema = new mongoose.Schema({
  tool:{type : String, require:true },      // tool name/id
  stars: {type : Number,require:true},      // 1–5 rating
  comment: String,    // user review
  createdAt: { type: Date, default: Date.now }
});

const Feedback = mongoose.model("Feedback", FeedbackSchema);

// POST feedback
app.post("/api/feedback", async (req, res) => {
  try {
    // console.log("Incoming feedback : ",req.body)
    const { tool, stars, comment } = req.body;
    if (!comment || comment.trim === ""){
        if (stars === 5){
          comment = "Excellent \uD83D\uDC4F \uD83D\uDC4F"
        }
        else if (stars === 4){
          comment = "Very good \uD83D\uD83D \uD83D\uD83D"
        }
        if (stars === 3){
          comment = "Good \uD83D\uDE42 "
        }
        if (stars === 5){
          comment = "Needs improvement \uD83E\uDD14 "
        }
        if (stars === 5){
          comment = "N0t too good \uD83D\uDE1E "
        }
    }
    const newFeedback = new Feedback({ tool, stars, comment });
    await newFeedback.save();
    res.status(201).json({newFeedback});
  } catch (err) {
    res.status(500).json({ error: "Failed to save feedback ",details : err.message});
  }
});

// GET all feedback for a tool
app.get("/feedback/:tool", async (req, res) => {
  try {
    let limit = parseInt(req.query.limit) || 7;
    const tool = req.params.tool;
    const feedbacks = await Feedback.find({ tool }).sort({ createdAt: -1 }).limit(limit);
    res.json(feedbacks);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Start server
app.listen(5000, () => console.log("Server running on http://localhost:5000"));