const express = require("express");
const router = express.Router();
const request = require("request");
const tough = require("tough-cookie");
const iconv = require("iconv-lite");
const axios = require("axios");

// 비동기처리 get axios
const axios_get = (options) => {
  return new Promise(async (resolve) => {
    axios
      .get(options.uri, options)
      .then((response) => {
        if (response.data) {
          var buffer = Buffer.from(response.data);

          // Buffer를 UTF-8로 디코딩
          var decodedString = buffer.toString("utf-8");

          // 디코딩된 문자열을 JSON으로 파싱
          var jsonData = JSON.parse(decodedString);
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
// 비동기처리 post request
const request_post = (options) => {
  return new Promise(async (resolve) => {
    request.post(options, async (err, response, body) => {
      if (err) throw err;
      resolve(body);
    });
  });
};

// 쿠팡 리뷰 RUN
const coupang_run = (productId, page) => {
  return new Promise(async (resolve, reject) => {
    if (productId) {
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

      var jar = request.jar();
      var cookie_string = `MARKETID=${cookie_num}; PCID=${cookie_num}`;
      var cookie = tough.Cookie.parse(cookie_string);
      jar.setCookie(cookie.toString(), "http://m.coupang.com"); // 특정 도메인에 쿠키 설정
      var option = {
        uri: `http://m.coupang.com/vm/products/${productId}/brand-sdp/reviews/list?page=${page}&slotSize=10&reviewOnly=true`,
        method: "get",
        responseType: "arraybuffer",
        headers: {
          "User-Agent": "PostmanRuntime/7.43.0",
          "Accept-Encoding": "gzip, deflate, br",
          Connection: "keep-alive",
          "Content-Type": "application/json; charset=json",
          Accept: "*/*",
          "Content-Encoding": "gzip",
          Cookie: `MARKETID=${cookie_num}; PCID=${cookie_num}`,
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      };
      var option_next = {
        uri: `http://m.coupang.com/vm/products/${productId}/brand-sdp/reviews/list?page=${
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
          Cookie: `MARKETID=${cookie_num}; PCID=${cookie_num}`,
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      };
      var coupang_data = await axios_get(option);
      var next_review = await axios_get(option_next);
      var next = false;
      // 리뷰존재확인
      var coupang_data_productId = coupang_data.productId;

      // nextReview
      var coupang_data_next_productId = next_review.productId;

      if (next_review && coupang_data_next_productId) {
        next = true;
      }
      if (coupang_data && coupang_data_productId) {
        var review_data = coupang_data.reviews;
        var data = [];

        if (review_data && review_data.length) {
          for (var idx in review_data) {
            var imgs = [];
            if (review_data[idx].attachments) {
              if (review_data[idx].attachments.length) {
                for (var idx2 in review_data[idx].attachments) {
                  if (
                    review_data[idx].attachments[idx2].attachmentType == "IMAGE"
                  ) {
                    imgs.push(
                      review_data[idx].attachments[idx2].imgSrcThumbnail
                    );
                  }
                }
              }
            }
            data.push({
              nickname: review_data[idx].displayName,
              title: review_data[idx].title,
              content: review_data[idx].content,
              reviewAt: review_data[idx].reviewAt,
              ratingAverage: review_data[idx].ratingAverage,
              itemName: review_data[idx].itemName,
              imgs: imgs,
            });
          }
          const request_data = {
            data: data,
            next: next,
          };
          resolve(request_data);
        } else {
          resolve([]);
        }
      } else {
        resolve([]);
      }
    } else {
      resolve({});
    }
  });
};

/* GET */
router.get("/", async (req, res) => {
  var url = req.query.url;

  // var url =
  //   "http://www.coupang.com/vp/products/7488062594?itemId=19575057319&vendorItemId=86682748504&sourceType=cmgoms&omsPageId=134943&omsPageUrl=134943&isAddedCart=";
  var page = req.query.page ? req.query.page : 1;
  var type = "";

  if (url.includes("coupang")) {
    type = "coupang";
  } else if (url.includes("naver")) {
  } else if (url.includes("11st")) {
  } else {
    type = "other";
  }

  if (type == "other") {
    res.status(400).json({ msg: "페이지를 찾을 수 없습니다." });
  } else {
    if (type == "coupang") {
      var productId = "";
      var parts = url.split("/");
      var productString_index = parts.indexOf("products");
      if (
        productString_index !== -1 ||
        parts[parseInt(productString_index) + 1]
      ) {
        productId = parts[parseInt(productString_index) + 1];

        // 쿼리스트링 제거
        if (productId.includes("?")) {
          productId = productId.split("?")[0];
        }
        var data = await coupang_run(productId, page);

        res.status(200).json(data);
      } else {
        res.status(400).json({ msg: "상품이 존재하지 않습니다." });
      }
    } else {
      res.status(400).json({ msg: "쿠팡만 가능합니다." });
    }
  }
});

module.exports = router;
