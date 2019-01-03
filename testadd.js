'use strict';
var express = require("express");
var path = require('path');
var app = express();
var Chart = require("chart.js")
require("./gapi");

var redis = require("redis");
var client = redis.createClient();
client.on("error", function (err) {
    console.log("Redis Error:", err);
});
global.client = client;

/**
 [
{
	btnId: 1,
	data:[
		{ year:2018, month:12, day:12, hour:1, count: 8},
		{ year:2018, month:12, day:12, hour:2, count: 8},
		{ year:2018, month:12, day:12, hour:3, count: 8},
		{ year:2018, month:12, day:12, hour:24, count: 8},
	]
},
{
	btnId: 2,
	data:[
		{ year:2018, month:12, day:12, hour:1, count: 8},
		{ year:2018, month:12, day:12, hour:2, count: 18},
	]
}
]
 */
client.on('connect', function () {
    console.log('Redis连接成功.');
    addData();
    // checkAllTj();
});


// 加入统计数据
function addData() {
    let nowTime = Math.floor((new Date().getTime()) / 1000);

    let gameId = 1;
    let btnId = 1;
    client.hexists("arrTj", gameId, function (err, res) {
        if (err) {
            console.log('noredis arrTj:', err);
        } else {
            // 1有 0没有
            if (0 == res) {
                console.log('no tj gameid');
                let bdata = {
                    btnId: btnId,
                    data: []
                }
                client.hset("arrTj", gameId, JSON.stringify(bdata));
            } else {
                console.log('have tj gameid', res);
            }
            addOneClickData(gameId, btnId);
        }
    });
};

function addOneClickData(gameId, btnId){
    client.hgetall('arrTj', function(e, v){
        if(e){
            console.log('err2', e);
        }else{
            // console.log('v', v, typeof v);
            if (v == null || v == '' || v == 'null') {
                console.log('没有统计，游戏id：', gameId);
                return;
            }
            for (var gid in v) {
                // console.log('tjData', typeof gid, gid);
                if(gid == gameId){
                    let strAllGameBtnData = v[gid];
                    var gameAllBtnData = JSON.parse(strAllGameBtnData);
                    if(gameAllBtnData.btnId == btnId){
                        let oneBtnDatas = gameAllBtnData.data;
                        // console.log('oneBtnDatas',oneBtnDatas);
                        // 现在时间
                        let nowTime = new Date();
                        let nowYear = nowTime.getFullYear();
                        let nowMonth = (nowTime.getMonth() + 1);
                        let nowDay = nowTime.getDay();
                        let nowHour = nowTime.getHours();
                        // 增|改 数据
                        var isHave = false;
                        for (let index = 0; index < oneBtnDatas.length; index++) {
                            const oned = oneBtnDatas[index];
                            // { year:2018, month:12, day:12, hour:1, count: 8},
                            if(oned.year == nowYear && oned.month == nowMonth && oned.day == nowDay && oned.hour == nowHour){
                                oned.count += 1;
                                isHave = true;
                                console.log('add1',gameAllBtnData);
                            }
                        }
                        if(isHave == false){
                            let addOneHourData = {
                                year: nowYear,
                                month: nowMonth,
                                day: nowDay,
                                hour: nowHour,
                                count: 1
                            }
                            oneBtnDatas.push(addOneHourData);
                            console.log('add2',gameAllBtnData);
                        }
                        let newAllGameBtnData = JSON.stringify(gameAllBtnData);
                        client.hset('arrTj', gameId, newAllGameBtnData);
                    }
                }

            }
        }
    })
}

function checkAllTj() {
    let nowTime = Math.floor((new Date().getTime()) / 1000);
    console.log('arrTj', nowTime);

    client.hgetall('arrTj', function (e, v) {
        if (e) {
            console.log('err1', e);
        } else {
            console.log('v', v);
            if (v == null || v == '' || v == 'null') {
                console.log('没有统计，游戏：tjBskball');
                return;
            }
            for (var tjData in v) {
                console.log('arrTj', typeof tjData, tjData);
            }
        }
    })
};