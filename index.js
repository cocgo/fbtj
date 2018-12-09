var express = require("express");
var path = require('path');
var app = express();
var Chart = require("chart.js")

app.set('views', path.join(__dirname, 'views')); //设置模版路径在views目录（默认）
app.set("view engine", 'ejs'); //模版引擎设置为 ejs

app.get("/", function (req, res) {
    // views目录下寻找'index.ejs'
    // res.render(路径， 数据对象)
    res.render('index.ejs', {
        title: "演示",
        message: "点击次数",
        item: ['a', 'b', 'c']
    })
})


app.listen(3001, () => console.log('Example app listening on port 3001!'))