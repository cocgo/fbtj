'use strict';
var express = require("express");
var path = require('path');
var app = express();
var Chart = require("chart.js")

var redis = require("redis");
var client = redis.createClient();
client.on("error", function (err) {
    console.log("Redis Error:", err);
});
client.on('connect', function () {
    console.log('Redis连接成功.');
    addData();
    checkAllTj();
});

function addData() {
    let nowTime = Math.floor((new Date().getTime()) / 1000);
    let btnId = 1;
    let tjData = {
        nowTime: nowTime,
        count: 1,
    }
    client.hset("tjBskball", btnId, JSON.stringify(tjData));

};

function checkAllTj() {
    let nowTime = Math.floor((new Date().getTime()) / 1000);
    console.log('checkAllTj', nowTime);

    client.hgetall('tjBskball', function (e, v) {
        if (e) {
            console.log('err1', e);
        } else {
            console.log('v',v);
            if (v == null || v == '' || v == 'null') {
                console.log('没有统计，游戏：tjBskball');
                return;
            }
            for (var tjData in v) {
                console.log('tjData', typeof tjData, tjData);
            }
        }
    })
};