module.exports = (app) => {
  app.use("/review", require("./review"));
  app.use("/subway", require("./subway"));
};
