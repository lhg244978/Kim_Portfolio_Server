const { query } = require("../mods/dbconnection");
const { JSDOM } = require("jsdom"); // string ==> document; 전체 html에서 필요한 일부분을 자르기 위해 사용
const cheerio = require("cheerio"); // HTML/XML을 파싱하고 쉽게 조작
const request = require("request");
const moment = require("moment"); //  날짜 라이브러리
var run = false;

var regions = [
  "인천",
  "서울",
  "춘천",
  "강릉",
  "수원",
  "청주",
  "울릉도",
  "독도",
  "안동",
  "포항",
  "전주",
  "대전",
  "대구",
  "목포",
  "광주",
  "여수",
  "부산",
  "울산",
  "제주",
];

const request_get = (options) => {
  return new Promise(async (resolve) => {
    request.get(options, async (err, response, body) => {
      // if (err) throw err;
      if (response.statusCode == 200) {
        resolve(body);
      } else {
        resolve(null);
      }
    });
  });
};

// 크롤링
const crawling = (data, region) => {
  return new Promise(async (resolve) => {
    console.log(region + "RUN");

    const dom = new JSDOM(data);
    const document = dom.window.document;

    const todayElements = document.querySelectorAll("._today"); // 모든 요소 선택
    const weekElements = document.querySelectorAll(".week_item"); // 모든 요소 선택
    await query("DELETE FROM tb_weather_today WHERE region = ?", [region]);
    await query("DELETE FROM tb_weather_week WHERE region = ?", [region]);
    // 현재
    await todayElements.forEach(async (element, index) => {
      // 필요부분만 작업
      var $ = cheerio.load(element.outerHTML);

      const windDirection = [];
      $("dl.summary_list .sort dt.term").each(function () {
        const direction = $(this).text().trim();
        if (direction) {
          windDirection.push(direction); // 바람 방향 텍스트를 배열에 저장
        }
      });
      // 클래스 이름 고정
      var todayWeatherData = {
        region,
        temperature: parseFloat(
          $("div.temperature_text strong")
            .text()
            .match(/-?\d+(\.\d+)?/)
        ),
        feeling_temperature: parseFloat(
          $('dl.summary_list .sort dt:contains("체감")')
            .next()
            .text()
            .replace("°", "")
            .trim()
        ),
        humidity: parseInt(
          $('dl.summary_list .sort dt:contains("습도")')
            .next()
            .text()
            .replace("%", "")
            .trim(),
          10
        ),
        wind_direction: windDirection.length == 1 ? windDirection[0] : "-", // 모든 바람 방향 배열로 저장
        wind_speed: parseFloat(
          $("dl.summary_list .sort dd.desc")
            .first()
            .text()
            .replace("m/s", "")
            .trim()
        ),
        yesterdayDifference: $("p.summary .temperature.down").text().trim()
          ? $("p.summary .temperature.down").text().trim()
          : $("p.summary .temperature.up").text().trim(),
        uptdate: moment().format("YYYY-MM-DD HH:mm:ss"),
      };

      await query("INSERT INTO tb_weather_today SET ?", [todayWeatherData]);
    });

    // 일주일
    await weekElements.forEach(async (element, index) => {
      // 필요부분만 작업
      var $ = cheerio.load(element.outerHTML); // JSON 객체 생성
      var weatherData = {
        region,
        day: $("span.date_inner strong.day").text().trim(),
        date: $("span.date_inner span.date").text().trim(),
        morning_rainfall: $("span.weather_inner .weather_left .rainfall")
          .first()
          .text()
          .trim(),
        morning_condition: $("span.weather_inner i.wt_icon span.blind")
          .first()
          .text()
          .trim(),
        afternoon_rainfall: $("span.weather_inner .weather_left .rainfall")
          .last()
          .text()
          .trim(), // '10%'
        afternoon_condition: $("span.weather_inner i.wt_icon span.blind")
          .last()
          .text()
          .trim(), // '맑음'
        temperature_lowest:
          $("span.temperature_inner .lowest")
            .text()
            .replace(/[^\-0-9]/g, "")
            .trim() || null, // -2
        temperature_highest:
          $("span.temperature_inner .highest")
            .text()
            .replace(/[^\-0-9]/g, "")
            .trim() || null, // 3
        uptdate: moment().format("YYYY-MM-DD HH:mm:ss"),
      };
      await query("INSERT INTO tb_weather_week SET ?", [weatherData]);
    });
    resolve();
  });
};

const update_weather = async () => {
  if (!run) {
    run = true;
    console.log("RUNTIME :" + moment().format("YYYY-MM-DD HH:mm:ss"));

    for (var idx in regions) {
      var region = regions[idx];
      var option = {
        uri: `https://search.naver.com/search.naver?sm=tab_sug.top&where=nexearch&ssc=tab.nx.all&query=${encodeURIComponent(
          region
        )}+${encodeURIComponent("날씨")}`,
      };
      var data = await request_get(option);
      await crawling(data, region);
    }
    console.log("ENDTIME :" + moment().format("YYYY-MM-DD HH:mm:ss"));
    run = false;
  }
};

update_weather();
setInterval(() => {
  update_weather();
}, 3600000);
