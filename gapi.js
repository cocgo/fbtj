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
        let strm = '' + (iNum + 1);
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
                        let nowDay = nowTime.getDay();
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
                        let nowDay = nowTime.getDay();
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
    // 获取按钮 - 历史数据（单为：最近7天）
    getTjBtnHistoryDay(gameId, btnIds){

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

}