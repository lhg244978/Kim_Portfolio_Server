const express = require("express");
const router = express.Router();
const { query } = require("../mods/dbconnection");
const { JSDOM } = require("jsdom"); // string ==> document; 전체 html에서 필요한 일부분을 자르기 위해 사용
const cheerio = require("cheerio"); // HTML/XML을 파싱하고 쉽게 조작
const request = require("request");
const moment = require("moment"); //  날짜 라이브러리

const statusImg = {
  morning: {
    맑음: "serenity.svg",
    흐림: "cloud.svg",
    구름: "sun_clouds.svg",
    눈: "snow.svg",
    비: "rain.svg",
    안개: "fog.svg",
    황사: "dust.svg",
  },
  afternoon: {
    맑음: "serenity2.svg",
    흐림: "cloud.svg",
    구름: "sun_clouds2.svg",
    눈: "snow.svg",
    비: "rain.svg",
    안개: "fog.svg",
    황사: "dust.svg",
  },
};

router.get("/", async (req, res) => {
  var region = req.query.region ? req.query.region : null;
  var excepton = false;
  var msg = "";

  if (!region) {
    excepton = true;
    msg = "지역을 선택해주세요.";
  }
  if (!excepton) {
    var today_weather = await query(
      "SELECT * FROM tb_weather_today WHERE region = ?;",
      [region]
    );
    var current_time = parseInt(moment().add(9, "hours").format("HH"));

    var current_day =
      current_time >= 18 || current_time <= 5 ? "afternoon" : "morning";

    for (var idx in today_weather) {
      if (today_weather[idx].status.indexOf("눈") != -1) {
        today_weather[idx].img = statusImg[current_day]["눈"];
      } else if (today_weather[idx].status.indexOf("비") != -1) {
        today_weather[idx].img = statusImg[current_day]["비"];
      } else if (today_weather[idx].status.indexOf("흐림") != -1) {
        today_weather[idx].img = statusImg[current_day]["흐림"];
      } else if (today_weather[idx].status.indexOf("안개") != -1) {
        today_weather[idx].img = statusImg[current_day]["안개"];
      } else if (today_weather[idx].status.indexOf("황사") != -1) {
        today_weather[idx].img = statusImg[current_day]["황사"];
      } else if (today_weather[idx].status.indexOf("구름") != -1) {
        today_weather[idx].img = statusImg[current_day]["구름"];
      } else if (today_weather[idx].status.indexOf("맑음") != -1) {
        today_weather[idx].img = statusImg[current_day]["맑음"];
      } else {
        today_weather[idx].img = statusImg[current_day]["맑음"];
      }
    }

    var week_weather = await query(
      "SELECT * FROM tb_weather_week WHERE region = ? ORDER BY date ASC;",
      [region]
    );

    for (var idx in week_weather) {
      if (week_weather[idx].morning_condition) {
        var current_type = "morning";
        if (week_weather[idx].morning_condition.indexOf("눈") != -1) {
          week_weather[idx].morning_img = statusImg[current_type]["눈"];
        } else if (week_weather[idx].morning_condition.indexOf("비") != -1) {
          week_weather[idx].morning_img = statusImg[current_type]["비"];
        } else if (week_weather[idx].morning_condition.indexOf("흐림") != -1) {
          week_weather[idx].morning_img = statusImg[current_type]["흐림"];
        } else if (week_weather[idx].morning_condition.indexOf("안개") != -1) {
          week_weather[idx].morning_img = statusImg[current_type]["안개"];
        } else if (week_weather[idx].morning_condition.indexOf("황사") != -1) {
          week_weather[idx].morning_img = statusImg[current_type]["황사"];
        } else if (week_weather[idx].morning_condition.indexOf("구름") != -1) {
          week_weather[idx].morning_img = statusImg[current_type]["구름"];
        } else if (week_weather[idx].morning_condition.indexOf("맑음") != -1) {
          week_weather[idx].morning_img = statusImg[current_type]["맑음"];
        } else {
          week_weather[idx].morning_img = statusImg[current_type]["맑음"];
        }
      } else {
        week_weather[idx].morning_img = statusImg[current_type]["맑음"];
      }
      if (week_weather[idx].afternoon_condition) {
        var current_type2 = "afternoon";
        if (week_weather[idx].afternoon_condition.indexOf("눈") != -1) {
          week_weather[idx].afternoon_img = statusImg[current_type2]["눈"];
        } else if (week_weather[idx].afternoon_condition.indexOf("비") != -1) {
          week_weather[idx].afternoon_img = statusImg[current_type2]["비"];
        } else if (
          week_weather[idx].afternoon_condition.indexOf("흐림") != -1
        ) {
          week_weather[idx].afternoon_img = statusImg[current_type2]["흐림"];
        } else if (
          week_weather[idx].afternoon_condition.indexOf("안개") != -1
        ) {
          week_weather[idx].afternoon_img = statusImg[current_type2]["안개"];
        } else if (
          week_weather[idx].afternoon_condition.indexOf("황사") != -1
        ) {
          week_weather[idx].afternoon_img = statusImg[current_type2]["황사"];
        } else if (
          week_weather[idx].afternoon_condition.indexOf("구름") != -1
        ) {
          week_weather[idx].afternoon_img = statusImg[current_type2]["구름"];
        } else if (
          week_weather[idx].afternoon_condition.indexOf("맑음") != -1
        ) {
          week_weather[idx].afternoon_img = statusImg[current_type2]["맑음"];
        } else {
          week_weather[idx].afternoon_img = statusImg[current_type2]["맑음"];
        }
      } else {
        week_weather[idx].afternoon_img = statusImg[current_type2]["맑음"];
      }
    }

    res.json({
      today_weather: today_weather.length == 1 ? today_weather[0] : null,
      week_weather,
    });
  } else {
    res.status(400).json({ msg });
  }
});

module.exports = router;
