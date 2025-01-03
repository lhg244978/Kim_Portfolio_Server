const express = require("express");
const router = express.Router();
const request = require("request");
const axios = require("axios");
const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");

// 비동기처리 get axios
const axios_get = (options) => {
  return new Promise(async (resolve) => {
    axios
      .get(options.uri, options)
      .then((response) => {
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

// 비동기 처리 엑셀

// 비동기처리 xlsx
const createXlsx = (jsondata, filename) => {
  return new Promise(async (resolve, reject) => {
    try {
      var workbook = XLSX.utils.book_new();

      var worksheet = XLSX.utils.json_to_sheet(jsondata);

      XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

      var filePath = path.join(__dirname, filename);
      // 워크북을 메모리에 생성
      var fileBuffer = XLSX.write(workbook, {
        type: "buffer",
        bookType: "xlsx",
      });

      resolve(fileBuffer);
    } catch (error) {
      console.log(error);
      resolve(null);
    }
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
      // 랜덤 40글자
      const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
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

      var option = {
        uri: `https://www.coupang.com/vm/products/${productId}/brand-sdp/reviews/list?page=${
          parseInt(page) + 1
        }&slotSize=10&reviewOnly=true`,
        headers: {
          "User-Agent": "PostmanRuntime/7.43.0",
          "Accept-Encoding": "gzip",
          Connection: "keep-alive",
          Accept: "*/*",
          Cookie: `sid=${sid}; MARKETID=${cookie_num}; PCID=${cookie_num}`,
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      };
      var option_next = {
        uri: `https://www.coupang.com/vm/products/${productId}/brand-sdp/reviews/list?page=${
          parseInt(page) + 1
        }&slotSize=10&reviewOnly=true`,
        headers: {
          "User-Agent": "PostmanRuntime/7.43.0",
          "Accept-Encoding": "gzip",
          Connection: "keep-alive",
          Accept: "*/*",
          Cookie: `sid=${sid}; MARKETID=${cookie_num}; PCID=${cookie_num}`,
        },
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
  //   "https://www.coupang.com/vp/products/7488062594?itemId=19575057319&vendorItemId=86682748504&sourceType=cmgoms&omsPageId=134943&omsPageUrl=134943&isAddedCart=";
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

/* GET */
router.post("/xlsx", async (req, res) => {
  var jsondata = req.body.jsondata;
  var filename = req.body.filename ? req.body.filename + ".xlsx" : "xlsx.xlsx";
  if (jsondata.length) {
    for (var idx in jsondata) {
      if (jsondata[idx].imgs.length) {
        jsondata[idx].imgs = JSON.stringify(jsondata[idx].imgs);
      } else {
        jsondata[idx].imgs = "";
      }
    }
    var fileBuffer = await createXlsx(jsondata, filename);

    if (fileBuffer) {
      // 응답 헤더 설정
      // Buffer를 Base64로 변환
      var base64Data = fileBuffer.toString("base64");

      // 파일 데이터 전송
      res.status(200).json(base64Data);
    } else {
      res.status(400).json({ msg: "올바르지 않은 실행입니다." });
    }
  } else {
    res.status(400).json({ msg: "리뷰가 없습니다." });
  }
});

module.exports = router;
