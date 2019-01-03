global.G = {
    // 统计的游戏列表
    arrGameBtns:[
        {
            gameId: 1,
            name: 'Flying Basketball',
            btns:[
                {bid: 1, name:'按钮1'},
                {bid: 2, name:'按钮2'},
                {bid: 3, name:'按钮3'},
                {bid: 4, name:'按钮4'},
                {bid: 5, name:'按钮5'},
            ]
        },
        {
            gameId: 2,
            name: 'Test Game',
            btns:[
                {bid: 1, name:'按钮1'},
                {bid: 2, name:'按钮2'},
                {bid: 3, name:'按钮3'},
                {bid: 4, name:'按钮4'},
                {bid: 5, name:'按钮5'},
            ]
        },
    ],

    // 2018-01
    getNowYearMonthSimple() {
        let nowTime = new Date();
        let strm = '' + (nowTime.getMonth() + 1);
        if (strm.length == 1) {
            strm = '0' + strm;
        }
        let strMonth = nowTime.getFullYear() + '-' + strm;
        return strMonth;
    },

    // 获取2位数的字符串 G.getTwoNum(1)
    getTwoNum(iNum) {
        let strm = '' + iNum;
        if (strm.length == 1) {
            strm = '0' + strm;
        }
        return strm;
    },

    isInGameList(gameId, btnId){
        for (let i = 0; i < G.arrGameBtns.length; i++) {
            const oneg = G.arrGameBtns[i];
            if(oneg.gameId == gameId){
                for (let j = 0; j < oneg.btns.length; j++) {
                    if(btnId == oneg.btns[j].bid){
                        return true;
                    }
                }
            }
        }
        console.log('no gameId, btnId');
        return false;
    },

    // 处理客户端点击按钮，加入统计
    handleClickCount(gameId, btnId) {
        if(G.isInGameList(gameId, btnId) == false){
            return;
        }
        // 是否有数据
        client.hexists("arrTj", gameId, function (err, res) {
            if (err) {
                console.log('noredis arrTj:', err);
            } else {
                // 1有 0没有
                if (0 == res) {
                    // console.log('no tj gameid');
                    let bdatas = [ { btnId: btnId, data: []} ];
                    client.hset("arrTj", gameId, JSON.stringify(bdatas));
                } else {
                    // console.log('have tj gameid', res);
                }
                G.addOneClickData(gameId, btnId);
            }
        });
    },

    // 加入一个点击数据到redis数据库里面
    addOneClickData(gameId, btnId) {
        client.hgetall('arrTj', function (e, v) {
            if (e) {
                console.log('err2', e);
            } else {
                // console.log('v', v, typeof v);
                if (v == null || v == '' || v == 'null') {
                    console.log('没有统计，游戏id：', gameId);
                    return;
                }
                for (var gid in v) {
                    // console.log('tjData', typeof gid, gid);
                    if (gid == gameId) {
                        let strAllGameBtnData = v[gid];
                        var gameAllBtnDatas = JSON.parse(strAllGameBtnData);
                        // 现在时间
                        let nowTime = new Date();
                        let nowYear = nowTime.getFullYear();
                        let nowMonth = (nowTime.getMonth() + 1);
                        let nowDay = nowTime.getDate();
                        let nowHour = nowTime.getHours();
                        // console.log('gameAllBtnDatas: ',gameAllBtnDatas, typeof gameAllBtnDatas);
                        var isHaveBtnId = false;
                        for (let j = 0; j < gameAllBtnDatas.length; j++) {
                            var gameAllOneBtnData = gameAllBtnDatas[j];
                            if (gameAllOneBtnData.btnId == btnId) {
                                isHaveBtnId = true;
                                // 某游戏的所有按钮id统计
                                let oneBtnDatas = gameAllOneBtnData.data;
                                // console.log('oneBtnDatas',oneBtnDatas);

                                // 增|改 数据
                                var isHave = false;
                                for (let index = 0; index < oneBtnDatas.length; index++) {
                                    const oned = oneBtnDatas[index];
                                    // { year:2018, month:12, day:12, hour:1, count: 8},
                                    if (oned.year == nowYear && oned.month == nowMonth && oned.day == nowDay && oned.hour == nowHour) {
                                        oned.count += 1;
                                        isHave = true;
                                        // console.log('add1', gameAllBtnData);
                                    }
                                }
                                if (isHave == false) {
                                    let addOneHourData = {
                                        year: nowYear,
                                        month: nowMonth,
                                        day: nowDay,
                                        hour: nowHour,
                                        count: 1
                                    }
                                    oneBtnDatas.push(addOneHourData);
                                    // console.log('add2', gameAllBtnData);
                                }                           
                            }
                        }
                        if(isHaveBtnId == false){
                            // 没有记录新的按钮，则新增一个按钮组数据
                            gameAllBtnDatas.push({
                                btnId: btnId,
                                data:[{
                                    year: nowYear,
                                    month: nowMonth,
                                    day: nowDay,
                                    hour: nowHour,
                                    count: 1
                                }]
                            })
                        }
                        // 更新数据
                        let newAllGameBtnDatas = JSON.stringify(gameAllBtnDatas);
                        client.hset('arrTj', gameId, newAllGameBtnDatas);
                        console.log('all btns', newAllGameBtnDatas);
                    }

                }
            }
        })
    },

    // 获取按钮 - 实时数据（单位：今日24小时）
    getTjBtnCurDays(gameId, btnIds, cbFunc){
        var toData = [];
        for (let index = 0; index < btnIds.length; index++) {
            const btnId = btnIds[index];
            let oneData = {btnId:btnId, vdata:[0,0,0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0,0,0, 0,0,0,0]};
            toData.push(oneData);
        }
        // 按小时设置数据
        function setBtnIdCount(btnId, hour, count){
            for (let index = 0; index < toData.length; index++) {
                if(toData[index].btnId == btnId){
                    toData[index].vdata[hour-1] = count;
                }
            }
        }

        client.hgetall('arrTj', function (e, v) {
            if (e) {
                console.log('err2', e);
            } else {
                // console.log('v', v, typeof v);
                if (v == null || v == '' || v == 'null') {
                    console.log('没有统计，游戏id：', gameId);
                    cbFunc([]);
                }
                for (var gid in v) {
                    // console.log('tjData', typeof gid, gid);
                    if (gid == gameId) {
                        let strAllGameBtnData = v[gid];
                        var gameAllBtnDatas = JSON.parse(strAllGameBtnData);
                        // 现在时间
                        let nowTime = new Date();
                        let nowYear = nowTime.getFullYear();
                        let nowMonth = (nowTime.getMonth() + 1);
                        let nowDay = nowTime.getDate();
                        let nowHour = nowTime.getHours();
                        // console.log('gameAllBtnDatas: ',gameAllBtnDatas, typeof gameAllBtnDatas);
                        // [{hour:1, count:8},{hour:2, count:8}]
                        for (let j = 0; j < gameAllBtnDatas.length; j++) {
                            var gameAllOneBtnData = gameAllBtnDatas[j];
                            let oneBtnDatas = gameAllOneBtnData.data;
                            for (let index = 0; index < oneBtnDatas.length; index++) {
                                const oned = oneBtnDatas[index];
                                // { year:2018, month:12, day:12, hour:1, count: 8},
                                if (oned.year == nowYear && oned.month == nowMonth && oned.day == nowDay ) {
                                    setBtnIdCount(gameAllOneBtnData.btnId, oned.hour, oned.count);
                                }
                            }
                        }
                        cbFunc(toData);
                    }else{
                        cbFunc([]);
                    }

                }
            }
        })
    },
    // 获取按钮 - 历史数据（单位为：最近7天）
    getTjBtnHistoryDay(gameId, btnIds, cbFunc){
        var toData = [];
        let limitDay = 7;
        for (let index = 0; index < btnIds.length; index++) {
            const btnId = btnIds[index];
            var oneData = {btnId:btnId, vdata:[]};
            for (let j = 0; j < limitDay; j++) {
                oneData.vdata.push(0);
            }
            toData.push(oneData);
        }
        // 按最近7天设置数据
        function addBtnIdCount(btnId, lastDay, addCount){
            for (let index = 0; index < toData.length; index++) {
                if(toData[index].btnId == btnId){
                    toData[index].vdata[lastDay] += addCount;
                }
            }
        }

        client.hgetall('arrTj', function (e, v) {
            if (e) {
                console.log('err2', e);
            } else {
                // console.log('v', v, typeof v);
                if (v == null || v == '' || v == 'null') {
                    console.log('没有统计，游戏id：', gameId);
                    cbFunc([]);
                }
                for (var gid in v) {
                    // console.log('tjData', typeof gid, gid);
                    if (gid == gameId) {
                        let strAllGameBtnData = v[gid];
                        var gameAllBtnDatas = JSON.parse(strAllGameBtnData);
                        for (let j = 0; j < gameAllBtnDatas.length; j++) {
                            var gameAllOneBtnData = gameAllBtnDatas[j];
                            let oneBtnDatas = gameAllOneBtnData.data;
                            for (let index = 0; index < oneBtnDatas.length; index++) {
                                const oned = oneBtnDatas[index];
                                // 历史时间
                                let hday = oned.year + '-' + G.getTwoNum(oned.month) + '-' + G.getTwoNum(oned.day);
                                for (let k = 0; k < limitDay; k++) {
                                    console.log('sss', hday , G.getdDay(-1*k))
                                    if(hday == G.getdDay(-k)){
                                        addBtnIdCount(gameAllOneBtnData.btnId, k, oned.count);
                                    }
                                }
                            }
                        }
                        cbFunc(toData);
                    }else{
                        cbFunc([]);
                    }

                }
            }
        })
    },

    // 获取游戏的按钮数量
    getGameBtns(gameId){
        let arrBtnIds = [];
        for (let i = 0; i < G.arrGameBtns.length; i++) {
            const oneg = G.arrGameBtns[i];
            if(oneg.gameId == gameId){
                for (let j = 0; j < oneg.btns.length; j++) {
                    arrBtnIds.push(oneg.btns[j].bid);
                }
            }
        }
        return arrBtnIds;
    },










    // 时间相关1
    getdDay(day) {
        var today = new Date();
        var targetday_milliseconds = today.getTime() + 1000 * 60 * 60 * 24 * day;
        today.setTime(targetday_milliseconds); //注意，这行是关键代码
        var tYear = today.getFullYear();
        var tMonth = today.getMonth();
        var tDate = today.getDate();
        tMonth = G.getTwoNum(tMonth + 1);
        tDate = G.getTwoNum(tDate);
        return tYear + "-" + tMonth + "-" + tDate;
    },

    // 时间相关2
    formatDate(val) {
        // 格式化时间
        let start = new Date(val)
        let y = start.getFullYear()
        let m = (start.getMonth() + 1) > 10 ? (start.getMonth() + 1) : '0' + (start.getMonth() + 1)
        let d = start.getDate() > 10 ? start.getDate() : '0' + start.getDate()
        return y + '-' + m + '-' + d
    },

    mistiming(sDate1, sDate2) {
        // 计算开始和结束的时间差
        let aDate, oDate1, oDate2, iDays
        aDate = sDate1.split('-')
        oDate1 = new Date(aDate[1] + '-' + aDate[2] + '-' + aDate[0])
        aDate = sDate2.split('-')
        oDate2 = new Date(aDate[1] + '-' + aDate[2] + '-' + aDate[0])
        iDays = parseInt(Math.abs(oDate1 - oDate2) / 1000 / 60 / 60 / 24)
        return iDays + 1
    },

    countDate(start, end) {
        // 判断开始和结束之间的时间差是否在90天内
        let days = mistiming(start, end)
        let stateT = days > 90 ? Boolean(0) : Boolean(1)
        return {
            state: stateT,
            day: days
        }
    },
    timeForMat(count) {
        // 拼接时间
        let time1 = new Date()
        time1.setTime(time1.getTime() - (24 * 60 * 60 * 1000))
        let Y1 = time1.getFullYear()
        let M1 = ((time1.getMonth() + 1) > 10 ? (time1.getMonth() + 1) : '0' + (time1.getMonth() + 1))
        let D1 = (time1.getDate() > 10 ? time1.getDate() : '0' + time1.getDate())
        let timer1 = Y1 + '-' + M1 + '-' + D1 // 当前时间
        let time2 = new Date()
        time2.setTime(time2.getTime() - (24 * 60 * 60 * 1000 * count))
        let Y2 = time2.getFullYear()
        let M2 = ((time2.getMonth() + 1) > 10 ? (time2.getMonth() + 1) : '0' + (time2.getMonth() + 1))
        let D2 = (time2.getDate() > 10 ? time2.getDate() : '0' + time2.getDate())
        let timer2 = Y2 + '-' + M2 + '-' + D2 // 之前的7天或者30天
        return {
            t1: timer1,
            t2: timer2
        }
    },

    yesterday(start, end) {
        // 校验是不是选择的昨天
        let timer = timeForMat(1)
        return timer
    },

    sevenDays() {
        // 获取最近7天
        let timer = timeForMat(7)
        return timer
    },

    thirtyDays() {
        // 获取最近30天
        let timer = timeForMat(30)
        return timer
    },
      
}