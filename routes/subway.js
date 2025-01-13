const express = require("express");
const router = express.Router();
const request = require("request");
const { query } = require("../mods/dbconnection");
const seoulApiKey = require("../config/config.json").seoulApiKey;
const subway_json = require("../data/subway_json.json");
const axios = require("axios");

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
//get

router.get("/line", async (req, res) => {
  var list = await query("SELECT line FROM tb_line;");

  res.status(200).json(list);
});

router.get("/group", async (req, res) => {
  var line = req.query.line ? req.query.line : "";
  if (line) {
    var list = await query("SELECT * FROM tb_groups WHERE line = ?;", [line]);
    res.status(200).json(list);
  } else {
    res.status(400).json({ msg: "호선을 선택해주세요." });
  }
});

router.get("/station", async (req, res) => {
  var line = req.query.line ? req.query.line : "";
  var group = req.query.group ? req.query.group : "";
  var excepton = false;

  if (!line) {
    excepton = true;
  }
  if (!group) {
    excepton = true;
  }

  if (!excepton) {
    var list = await query(
      "SELECT * FROM tb_station WHERE line = ? AND JSON_CONTAINS(`groups`, '[\"" +
        group +
        "\"]') ORDER BY sortno;",
      [line]
    );

    res.status(200).json(list);
  } else {
    res.status(400).json({ msg: "호선 및 그룹을 선택해주세요." });
  }
});
// POST
router.post("/info", async (req, res) => {
  var line = req.body.line ? req.body.line : "";
  var detailData = req.body.detailData ? req.body.detailData : [];
  var updnLine = req.body.updnLine ? req.body.updnLine : 0;
  var excepton = false;
  var msg = "";

  if (!line) {
    excepton = true;
    msg = "호선이 없습니다.";
  }
  if (!detailData.length) {
    excepton = true;
    msg = "정차역 데이터가 없습니다.";
  }
  if (!excepton) {
    var option = {
      uri: `http://swopenapi.seoul.go.kr/api/subway/${seoulApiKey}/json/realtimePosition/0/150/${encodeURIComponent(
        line
      )}`,
    };
    var traininfo = await axios_get(option);
    // 데이터 용량초과시
    // var traininfo = subway_json;

    var realtimePosition = [];
    // 500 에러시 errorMessage가 생기지 않기 때문에 통일
    if (traininfo.errorMessage) {
      traininfo.status = traininfo.errorMessage.status;
      traininfo.message = traininfo.errorMessage.message;
    }
    if (traininfo.status == 200) {
      if (traininfo.realtimePositionList) {
        if (traininfo.realtimePositionList.length) {
          // 중복 데이터 점검
          var uniqueTrainData = [];
          var trainNos = new Set();

          realtimePosition = traininfo.realtimePositionList;
          realtimePosition.forEach((train) => {
            if (!trainNos.has(train.trainNo)) {
              uniqueTrainData.push(train);
              trainNos.add(train.trainNo);
            }
          });
          // 중복 데이터 점검
          for (var idx in detailData) {
            // 호선 하나에 가질 수 있는 데이터 초기화
            detailData[idx].updata = null;
            detailData[idx].uplinedata = null;
            detailData[idx].downdata = null;
            detailData[idx].donwlinedata = null;
            // 호선 하나에 가질 수 있는 데이터 초기화
          }
          for (var idx in detailData) {
            for (var idx2 in uniqueTrainData) {
              uniqueTrainData[idx2].tooltipValue = false;
              if (detailData[idx].code == uniqueTrainData[idx2].statnId) {
                // updnLine == 0 상행 updnLine == 1 하행 분류 후 실시간 데이터 삽입
                if (uniqueTrainData[idx2].updnLine == updnLine) {
                  if (uniqueTrainData[idx2].updnLine == 0) {
                    if (uniqueTrainData[idx2].trainSttus == 0) {
                      if (!detailData[idx].donwlinedata) {
                        detailData[idx].donwlinedata = uniqueTrainData[idx2];
                      }
                    } else {
                      if (!detailData[idx].downdata) {
                        detailData[idx].downdata = uniqueTrainData[idx2];
                      }
                    }
                  } else {
                    if (uniqueTrainData[idx2].trainSttus == 0) {
                      if (
                        detailData[idx - 1] &&
                        !detailData[idx - 1].uplinedata
                      ) {
                        detailData[idx - 1].uplinedata = uniqueTrainData[idx2];
                      }
                    } else {
                      if (!detailData[idx].updata) {
                        detailData[idx].updata = uniqueTrainData[idx2];
                      }
                    }
                  }
                }
              }
            }
          }
          res.status(200).json(detailData);
        } else {
          res.status(200).json(detailData);
        }
      } else {
        res.status(200).json(detailData);
      }
    } else {
      res.status(400).json({ msg: traininfo.message });
    }
  } else {
    res.status(400).json({ msg });
  }
});

module.exports = router;
