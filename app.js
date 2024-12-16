const express = require("express");
const path = require("path");
const favicon = require("serve-favicon");
const logger = require("morgan");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
// cors 설정을 위해 npm i cors로 설치

const cors = require("cors");
const routes = require("./routes/index");
const users = require("./routes/user");
const config = require("./config/config.json");

const app = express();

// 모두허용
app.use(cors());

// 특정 도메인 허용
// let corsOptions = {
//     origin: 'http://localhost:3000',
//     credentials: true
// }

// app.use(cors(corsOptions));

const env = process.env.NODE_ENV || "development";
app.locals.ENV = env;
app.locals.ENV_DEVELOPMENT = env == "development";

// view engine setup

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// app.use(favicon(__dirname + '/public/img/favicon.ico'));
app.use(logger("dev"));
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

require("./routes")(app);

/// catch 404 and forward to error handler
app.use((req, res, next) => {
  const err = new Error("Not Found");
  err.status = 404;
  next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get("env") === "development") {
  app.use((err, req, res, next) => {
    res.status(err.status || 500);
    res.render("error", {
      message: err.message,
      error: err,
      title: "error",
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.render("error", {
    message: err.message,
    error: {},
    title: "error",
  });
});

module.exports = app;
