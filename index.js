'use strict';

var express = require("express");
var path = require('path');
var app = express();
const body_parser = require('body-parser');
var Chart = require("chart.js");
require("./gapi");

var redis = require("redis");
var client = redis.createClient();
client.on("error", function (err) {
    console.log("Redis Error:" , err);
});
client.on('connect', function(){
    console.log('Redis连接成功.');
});
// 全局redis接口
global.client = client;

app.set('views', path.join(__dirname, 'views')); //设置模版路径在views目录（默认）
app.set("view engine", 'ejs'); //模版引擎设置为 ejs


app.use(body_parser.json());
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

// 加入统计次数
app.get('/addClick', (req, res) => {
    let gameId = req.query['gameId'];
    let btnId = req.query['btnId'];
    if (gameId && btnId) {
        // 加入统计数据
        G.handleClickCount(gameId, btnId);
        res.status(200).send('{"code":0}');
    } else {
        res.status(200).send('{"code":-1}');
    }
});

// 获取点击次数
app.post('/getClick', (req, res) => {
    let body = req.body;
    console.log('body:', body, typeof body);
    let gameId = body['gameId'];
    let btnId = body['btnId'];
    if (gameId && btnId) {
        
        res.status(200).send('{"code":0}');
    } else {
        res.status(200).send('{"code":-1}');
    }
});

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