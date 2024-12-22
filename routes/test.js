const express = require("express");
const router = express.Router();
const request = require("request");
const tough = require("tough-cookie");
const iconv = require("iconv-lite");
const axios = require("axios");
const https = require("https");

// 비동기처리 get axios
const axios_get = (options) => {
  return new Promise(async (resolve) => {
    axios
      .get(options.uri, options)
      .then((response) => {
        if (response.data) {
          var jsonData = { msg: "good" };
          resolve(jsonData);
        } else {
          resolve();
        }
      })
      .catch((err) => {
        console.error(err);
        resolve({});
      });
  });
};

const run = async () => {
  var option = {
    uri: `https://www.naver.com`,
    method: "get",
    responseType: "arraybuffer",
  };
  var data = await axios_get(option);
  console.log(data);

  return data;
};
run();
