'use strict';
var express = require("express");
var path = require('path');
var app = express();
var Chart = require("chart.js")

var redis = require("redis");
var client = redis.createClient();
client.on("error", function (err) {
    console.log("Redis Error:" , err);
});
client.on('connect', function(){
    console.log('Redis连接成功.');
});

app.set('views', path.join(__dirname, 'views')); //设置模版路径在views目录（默认）
app.set("view engine", 'ejs'); //模版引擎设置为 ejs

app.use(express.static('public'));
app.get("/", function (req, res) {
    // views目录下寻找'index.ejs'
    // res.render(路径， 数据对象)
    
    res.render('index.ejs', {
        title: "演示",
        message: "点击次数",
        item: ['test1', 'test2']
    })
})

app.get("/testa", function (req, res) {
    // views目录下寻找'testa.ejs'
    // res.render(路径， 数据对象)
    res.render('testa.ejs', {
        title: "加次数",
        message: "点击次数",
        item: ['1', '2', '3']
    })
})



app.listen(1338, () => console.log('fb statistics listening on port 1338!'))