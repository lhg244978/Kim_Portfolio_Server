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
          console.log(response);

          var jsonData = { msg: "good" };
          resolve();
        } else {
          resolve();
        }
      })
      .catch((err) => {
        resolve({});
      });
  });
};

const request_post = (options) => {
  return new Promise(async (resolve) => {
    request.get(options, async (err, response, body) => {
      if (err) throw err;

      const buffer = Buffer.from(body, "utf-8"); // Base64 디코딩

      var data = buffer.toString("Base64");
      // Base64 디코딩
      const buffer_data = Buffer.from(data, "base64");
      console.log();

      resolve(body);
    });
  });
};

const run = async () => {
  var currentTimestamp = Date.now();
  var randomNumber = 0;
  if (currentTimestamp % 2 == 0) {
    randomNumber = BigInt(Math.floor(Math.random() * 9e22) + 1e22);
    randomNumber = randomNumber.toString();
  } else {
    randomNumber = BigInt(Math.floor(Math.random() * 9e21) + 1e21);
    randomNumber = randomNumber.toString();
  }
  var cookie_num = randomNumber;
  var jar = request.jar();
  var cookie_string = `MARKETID=${cookie_num}; PCID=${cookie_num}`;
  var cookie = tough.Cookie.parse(cookie_string);
  jar.setCookie(cookie.toString(), "https://m.coupang.com"); // 특정 도메인에 쿠키 설정
  var option = {
    uri: `https://www.coupang.com/vm/products/6393352093/brand-sdp/reviews/list?page=1&slotSize=200&reviewOnly=true&_=1734504688904`,
    method: "get",
    responseType: "arraybuffer",
    headers: {
      "User-Agent": "PostmanRuntime/7.43.0",
      "Accept-Encoding": "gzip, deflate, br",
      Connection: "keep-alive",
      "Content-Type": "application/json;charset=UTF-8",
      Accept: "*/*",
      jar,
      "Content-Encoding": "gzip",
      Cookie: `MARKETID=${cookie_num}; PCID=${cookie_num}`,
    },
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
  };
  var data = await axios_get(option);

  return data;
};
run();
