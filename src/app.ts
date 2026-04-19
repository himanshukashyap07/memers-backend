import express from "express";
import cors from 'cors'
import cookieParser from 'cookie-parser'
const app = express();

app.use(cors({
  origin: "*",
  credentials: true
}));

// app.use((req, res, next) => {
//   res.header("Access-Control-Allow-Origin", process.env.CORS_ORIGIN || "http://192.168.213.248:8081");
//   res.header("Access-Control-Allow-Credentials", "true");
//   res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
//   res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
//   next();
// });

// Parse JSON bodies
app.use(express.json({ limit: "16kb" }));
// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());

// Import routes
import userRouter from "./routes/user.route.js";
import postRouter from "./routes/post.route.js";
import friendRouter from "./routes/friends.route.js";
import likeRouter from "./routes/likes.route.js";
import commentRouter from "./routes/comments.route.js";

// Routes declaration
app.get("/",(req,res)=>{
  res.send("Welcome to Memers API");
});
app.use("/api/v1/user", userRouter);
app.use("/api/v1/post", postRouter);
app.use("/api/v1/friends", friendRouter);
app.use("/api/v1/likes", likeRouter);
app.use("/api/v1/comments", commentRouter);

export default app ;