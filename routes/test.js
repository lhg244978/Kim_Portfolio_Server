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
        console.log(response);
        if (response.data) {
          resolve(response.data);
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

const test = async () => {
  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  var sid = "";
  for (let i = 0; i <= 40; i++) {
    sid += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  // 유닉스 타임스탬프
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
  var productId = 6393352093;
  var page = 1;
  var option = {
    uri: `https://www.coupang.com/vm/products/${productId}/brand-sdp/reviews/list?page=${
      parseInt(page) + 1
    }&slotSize=10&reviewOnly=true`,
    headers: {
      "User-Agent": "PostmanRuntime/7.43.0",
      "Accept-Encoding": "gzip",
      Connection: "keep-alive",
      Accept: "*/*",
      "Access-control-allow-credentials": "true",
      "Content-Type": "application/json; charset=json",
      "Content-Encoding": "gzip",
      Cookie: `sid=${sid}; MARKETID=${cookie_num}; PCID=${cookie_num}`,
    },
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
  };
  var option_next = {
    uri: `https://www.coupang.com/vm/products/${productId}/brand-sdp/reviews/list?page=${
      parseInt(page) + 1
    }&slotSize=10&reviewOnly=true`,
    method: "get",
    responseType: "arraybuffer",
    headers: {
      "User-Agent": "PostmanRuntime/7.43.0",
      "Accept-Encoding": "gzip, deflate, br",
      Connection: "keep-alive",
      "Content-Type": "application/json; charset=json",
      Accept: "*/*",
      "Content-Encoding": "gzip",
      Cookie: `sid=${sid}; MARKETID=${cookie_num}; PCID=${cookie_num}`,
    },
  };

  var coupang_data = await axios_get(option);

  return coupang_data;
};

test();
