const express = require("express");
const router = express.Router();
const { query } = require("../mods/dbconnection");
const { JSDOM } = require("jsdom"); // string ==> document; 전체 html에서 필요한 일부분을 자르기 위해 사용
const cheerio = require("cheerio"); // HTML/XML을 파싱하고 쉽게 조작
const request = require("request");
const moment = require("moment"); //  날짜 라이브러리

router.get("/", async (req, res) => {
  var region = req.query.region ? req.query.region : null;
  var excepton = false;
  var msg = "";

  if (!region) {
    excepton = true;
    msg = "지역을 선택해주세요.";
  }
  if (!excepton) {
    var today_weader = await query(
      "SELECT * FROM tb_weader_today WHERE region = ?;",
      [region]
    );
    var week_weader = await query(
      "SELECT * FROM tb_weader_week WHERE region = ? ORDER BY date ASC;",
      [region]
    );

    res.json({ today_weader, week_weader });
  } else {
    res.status(400).json({ msg });
  }
});

module.exports = router;
