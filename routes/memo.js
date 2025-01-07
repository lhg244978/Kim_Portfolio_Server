const express = require("express");
const router = express.Router();
const { query } = require("../mods/dbconnection");

router.get("/list", async (req, res) => {
  var searchText = req.query.searchText ? req.query.searchText : "";
  if (searchText == "") {
    var list = await query(
      "SELECT title, REPLACE(context, '\n', '<br />') AS context, regdate, reply  FROM tb_memo ORDER BY regdate DESC;"
    );
  } else {
    var list = await query(
      "SELECT title, REPLACE(context, '\n', '<br />') AS context, regdate, reply FROM tb_memo WHERE title LIKE ? OR context LIKE ? ORDER BY regdate DESC;",
      ["%" + searchText + "%", "%" + searchText + "%"]
    );
  }

  res.status(200).json(list);
});

// POST
router.post("/insert", async (req, res) => {
  var title = req.body.title ? req.body.title : "제목없음";
  var context = req.body.context ? req.body.context : "";
  var excepton = false;
  var msg = "";

  if (!context) {
    excepton = true;
    msg = "내용을 입력해주세요.";
  }
  if (!excepton) {
    await query("INSERT INTO tb_memo SET ?", [
      { title, context, regdate: new Date(), reply: "" },
    ]);
    res.status(200).json({ msg: "" });
  } else {
    res.status(400).json({ msg });
  }
});

module.exports = router;
