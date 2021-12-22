const express = require("express");
const router = express.Router();
const constant = require("../constant/constant");

const formidable = require("formidable");
const fs = require("fs");
const csv = require('csvtojson')
const moment = require('moment');
const formulajs = require('@formulajs/formulajs')

router.post('/pchart', async (req, res) => {
    try {
        const form = new formidable.IncomingForm();

        form.parse(req, async (error, fields, files) => {
            console.log("error : " + JSON.stringify(error));
            console.log("Fields : " + JSON.stringify(fields));
            console.log("Files : " + JSON.stringify(files));

            const csvFilePath = files.files.path
            csv()
                .fromFile(csvFilePath)
                .then((jsonObj) => {
                    console.log(jsonObj);
                })

            const jsonArray = await csv().fromFile(csvFilePath);

            //cal P
            var SX = 0
            var Sn = 0
            var P = []
            for (let index = 0; index < jsonArray.length; index++) {
                const item = jsonArray[index];
                item.P = parseInt(item.X) / parseInt(item.n)
                P.push(parseInt(item.X) / parseInt(item.n))
                SX += parseInt(item.X)
                Sn += parseInt(item.n)
            }
            var CL = SX / Sn
            var n = Sn / jsonArray.length
            var ucl = CL + (3 * Math.sqrt((CL * (1 - CL)) / n))
            var lcl = CL - (3 * Math.sqrt((CL * (1 - CL)) / n))

            res.json({
                CL,
                SX,
                Sn,
                ucl,
                lcl: lcl < 0 ? 0 : lcl,
                n,
                P,
                api_result: constant.kResultOk,
            });
        });
    } catch (error) {
        res.json({ error, api_result: constant.kResultNok, })
    }
})

router.post('/dynamic_pchart', async (req, res) => {
    try {
        const numToFixed = 5
        const form = new formidable.IncomingForm();

        form.parse(req, async (error, fields, files) => {
            console.log("error : " + JSON.stringify(error));
            console.log("Fields : " + JSON.stringify(fields));
            console.log("Files : " + JSON.stringify(files));

            const csvFilePath = files.file.path
            const jsonArray = await csv().fromFile(csvFilePath);

            //cal P
            const backup_i = parseInt(fields.backup_i)

            var list_cl = []
            var list_ucl = []
            var list_lcl = []
            var list_p = []
            var sample_name = []

            for (let index = 0; index < jsonArray.length; index++) {
                const item = jsonArray[index];
                item.n = parseInt(item.n)
                item.X = parseInt(item.X)
                item.P = parseInt(item.X) / parseInt(item.n)
            }

            for (let i = backup_i; i < jsonArray.length; i++) {
                const item_i = jsonArray[i];
                let s_X = 0
                let s_n = 0

                list_p.push((item_i.P).toFixed(numToFixed))
                sample_name.push(item_i.sample)

                for (let j = (i - backup_i); j < (backup_i + (i - backup_i)); j++) {
                    const item_j = jsonArray[j];
                    s_X += item_j.X
                    s_n += item_j.n
                }

                //n bar
                const n_b = s_n / backup_i

                //cl
                const cl = s_X / s_n
                item_i.cl = cl
                list_cl.push(cl.toFixed(numToFixed))

                //ucl
                const ucl = (cl + (3 * Math.sqrt((cl * (1 - cl)) / n_b))).toFixed(numToFixed)
                item_i.ucl = ucl
                list_ucl.push(ucl)

                //ucl
                const lcl = (cl - (3 * Math.sqrt((cl * (1 - cl)) / n_b))).toFixed(numToFixed)
                item_i.lcl = lcl < 0 ? 0 : lcl
                list_lcl.push(lcl < 0 ? 0 : lcl)
                // item_i.lcl = lcl
                // list_lcl.push(lcl)
            }

            res.json({
                list_cl,
                list_ucl,
                list_lcl,
                list_p,
                sample_name,
                jsonArray,
                backup_i,
                api_result: constant.kResultOk,
            });
        });
    } catch (error) {
        res.json({ error, api_result: constant.kResultNok, })
    }
})

router.post('/dynamic_pchart_json', async (req, res) => {
    try {
        const numToFixed = 5
        const jsonArray = req.body.data

        //cal P
        const backup_i = parseInt(req.body.backup_i)

        var list_cl = []
        var list_ucl = []
        var list_lcl = []
        var list_p = []
        var sample_name = []

        for (let index = 0; index < jsonArray.length; index++) {
            const item = jsonArray[index];
            item.n = parseInt(item.n)
            item.X = parseInt(item.X)
            item.P = parseInt(item.X) / parseInt(item.n)

        }

        for (let i = backup_i; i < jsonArray.length; i++) {
            const item_i = jsonArray[i];
            let s_X = 0
            let s_n = 0

            list_p.push((item_i.P).toFixed(numToFixed))
            sample_name.push(item_i.sample)

            for (let j = (i - backup_i); j < (backup_i + (i - backup_i)); j++) {
                const item_j = jsonArray[j];
                s_X += item_j.X
                s_n += item_j.n
            }

            //n bar
            const n_b = s_n / backup_i

            //cl
            const cl = s_X / s_n
            item_i.cl = cl
            list_cl.push(cl.toFixed(numToFixed))

            //ucl
            const ucl = (cl + (3 * Math.sqrt((cl * (1 - cl)) / n_b))).toFixed(numToFixed)
            item_i.ucl = ucl
            list_ucl.push(ucl)

            //ucl
            const lcl = (cl - (3 * Math.sqrt((cl * (1 - cl)) / n_b))).toFixed(numToFixed)
            item_i.lcl = lcl < 0 ? 0 : lcl
            list_lcl.push(lcl < 0 ? 0 : lcl)
            // item_i.lcl = lcl
            // list_lcl.push(lcl)
        }

        res.json({
            list_cl,
            list_ucl,
            list_lcl,
            list_p,
            sample_name,
            jsonArray,
            backup_i,
            api_result: constant.kResultOk,
        });
    } catch (error) {
        console.log(error)
        res.json({ error })
    }
})

router.post('/x_bar_r_chart', async (req, res) => {
    try {
        const { data, n, usl, lsl } = req.body
        const sigma = 3
        const d2 = [0, 0, 1.128, 1.693, 2.059, 2.326, 2.534, 2.704, 2.847, 2.970]
        const d3 = [0, 0, 0, 0, 0, 0, 0, 0.076, 0.136, 0.184]
        const d4 = [0, 0, 3.267, 2.574, 2.282, 2.114, 2.004, 1.924, 1.864, 1.816]
        //prepare data
        var sampleNameList = []
        var groupDataByDateAndHourList = {}
        for (let i = 0; i < data.length; i++) {
            const item = data[i];
            const convertDate = moment(item.timeStamp, "DD/MM/YYYY HH:mm:ss").format('DD-MM-YYYY HH')
            if (convertDate != "Invalid date") {
                if (!sampleNameList.includes(convertDate)) {
                    sampleNameList.push(convertDate)
                }

                //grouping
                var temp = groupDataByDateAndHourList[convertDate]
                if (temp == null) {
                    groupDataByDateAndHourList[convertDate] = [{
                        data: parseFloat(item.data),
                        timeStamp: item.timeStamp,
                        Sample: convertDate
                    },]
                } else {
                    var tempArray = [...temp]
                    tempArray.push({
                        data: parseFloat(item.data),
                        timeStamp: item.timeStamp,
                        Sample: convertDate
                    })
                    groupDataByDateAndHourList[convertDate] = tempArray
                }
            }

        }
        sampleNameList.sort();

        //random sample n data
        var sampleDataList = {}
        for (let j = 0; j < sampleNameList.length; j++) {
            const item = sampleNameList[j];
            if (groupDataByDateAndHourList[item].length < n) {
                res.json({ error: 'Sample data ' + item + ' less than ' + n + ' data', api_result: constant.kResultNok, })
                return
            }
            const shuffleArray = shuffle(groupDataByDateAndHourList[item])
            // const shuffleArray = groupDataByDateAndHourList[item]
            var sampleArray = shuffleArray.slice(0, n);
            sampleDataList[item] = sampleArray
        }

        //find average and min max data
        var summaryData = {}
        var sumData = 0
        var countData = 0
        var sumRange = 0
        var cl_x = 0
        var cl_r = 0

        var list_usl = []
        var list_lsl = []

        var x = []
        var r = []

        for (let l = 0; l < sampleNameList.length; l++) {
            const item = sampleNameList[l];
            var average = 0
            var range = []
            for (let m = 0; m < sampleDataList[item].length; m++) {
                const element = sampleDataList[item][m];
                average += element.data
                range.push(element.data)
                countData++
            }
            sumData += average
            average = (average / n)
            sumRange += (Math.max(...range) - Math.min(...range))
            summaryData[item] = {
                average,
                range: Math.max(...range) - Math.min(...range),
                min: Math.min(...range),
                max: Math.max(...range),
            }
            x.push(average)
            r.push(Math.max(...range) - Math.min(...range))

            list_usl.push(usl)
            list_lsl.push(lsl)
        }

        //cal std
        cl_x = sumData / countData
        cl_r = sumRange / sampleNameList.length
        var stdX = (cl_r / d2[n]) / Math.sqrt(n)

        var statisticsData = {
            cl_x,
            stdX,
            ucl_x: cl_x + (stdX * sigma),
            lcl_x: cl_x - (stdX * sigma),

            cl_r,
            ucl_r: d4[n] * cl_r,
            lcl_r: d3[n] * cl_r,

            // sumData,
            // countData,
            // sumRange,
        }

        //chartData
        summaryData = []
        var list_cl_x = []
        var list_cl_r = []
        var list_ucl_x = []
        var list_lcl_x = []
        var list_ucl_r = []
        var list_lcl_r = []
        for (let i = 0; i < sampleNameList.length; i++) {
            const item = sampleNameList[i];
            list_cl_x.push(statisticsData.cl_x)
            list_cl_r.push(statisticsData.cl_r)
            list_ucl_x.push(statisticsData.ucl_x)
            list_lcl_x.push(statisticsData.lcl_x)
            list_ucl_r.push(statisticsData.ucl_r)
            list_lcl_r.push(statisticsData.lcl_r)
            summaryData.push({
                sample: item,
                X_bar: x[i],
                cl_x: statisticsData.cl_x,
                ucl_x: statisticsData.ucl_x,
                lcl_x: statisticsData.lcl_x,
                Range: r[i],
                cl_r: statisticsData.cl_r,
                ucl_r: statisticsData.ucl_r,
                lcl_r: statisticsData.lcl_r,
            })
        }

        //Rule3 , 4
        var rule3List = []
        var rule4List = []
        for (let i = 0; i < summaryData.length; i++) {
            //rule3
            if (i < (summaryData.length - 9)) {
                var more_cl = 0
                var lower_cl = 0
                for (let j = i; j < i + 9; j++) {
                    const element = summaryData[j];
                    if (element.X_bar > element.cl_x) {
                        more_cl++
                    }
                    if (element.X_bar < element.cl_x) {
                        lower_cl++
                    }
                }
                if (more_cl >= 9 || lower_cl >= 9) {
                    for (let k = i; k < i + 9; k++) {
                        const element = summaryData[k].X_bar;
                        rule3List[k] = element
                    }
                }
            }

            //rule4
            if (i < (summaryData.length - 6)) {
                var countMoreThan = 0
                for (let j = i; j < i + 6 - 1; j++) {
                    const element1 = summaryData[j];
                    const element2 = summaryData[j + 1];
                    if (element2.X_bar > element1.X_bar) {
                        countMoreThan++
                    } else {
                        break
                    }
                }
                if (countMoreThan >= 6 - 1) {
                    for (let k = i; k < i + 6; k++) {
                        const element = summaryData[k].X_bar;
                        rule4List[k] = element
                    }
                }
            }
        }

        var chartData = {
            xChart: {
                categories: sampleNameList,
                series: [
                    {
                        name: "X_bar",
                        data: x,
                    },
                    {
                        name: "CL",
                        data: list_cl_x
                    },
                    {
                        name: "LCL",
                        data: list_lcl_x,
                        color: '#ff0000'
                    },
                    {
                        name: "UCL",
                        data: list_ucl_x,
                        color: '#ff0000'
                    },
                    {
                        name: "USL",
                        data: list_usl,
                        color: '#ff0000'
                    },
                    {
                        name: "LSL",
                        data: list_lsl,
                        color: '#ff0000'
                    },
                    {
                        name: "Rule3",
                        data: rule3List,
                        color: '#ffb000'
                    },
                    {
                        name: "Rule4",
                        data: rule4List,
                        color: '#d060f0'
                    },
                ],
            },
            rChart: {
                categories: sampleNameList,
                series: [
                    {
                        name: "Range",
                        data: r
                    },
                    {
                        name: "CL",
                        data: list_cl_r
                    },
                    {
                        name: "LCL",
                        data: list_lcl_r,
                        color: '#ff0000'
                    },
                    {
                        name: "UCL",
                        data: list_ucl_r,
                        color: '#ff0000'
                    },
                ],
            }
        }

        //cal cpk
        var ProcessCapability
        if (usl || lsl) {
            console.log('usl', usl);
            console.log('lsl', lsl);
            var cp
            var cpu
            var cpl
            var cpk
            var PercentYield
            if (usl && lsl) {
                cp = (usl - lsl) / (6 * (cl_r / d2[n]))
                console.log('cp', cp);
            }
            if (usl) {
                cpu = (usl - cl_x) / (3 * (cl_r / d2[n]))
                console.log('cpu', cpu);
            }
            if (lsl) {
                cpl = (cl_x - lsl) / (3 * (cl_r / d2[n]))
                console.log('cpl', cpl);
            }
            if (cpu && cpl) {
                PercentYield = (formulajs.NORMSDIST((usl - cl_x) / (cl_r / d2[n]), true) - formulajs.NORMSDIST((lsl - cl_x) / (cl_r / d2[n]), true)) * 100
                if (cpu > cpl) {
                    cpk = cpl
                } else {
                    cpk = cpu
                }
            } else if (cpu) {
                PercentYield = formulajs.NORMSDIST((usl - cl_x) / (cl_r / d2[n]), true) * 100
                cpk = cpu
            } else {
                PercentYield = formulajs.NORMSDIST((cl_x - lsl) / (cl_r / d2[n]), true) * 100
                cpk = cpl
            }


            console.log('cpk', cpk);
            console.log('PercentYield', PercentYield);
            ProcessCapability = {
                cp,
                cpu,
                cpl,
                cpk,
                PercentYield,
            }
        }


        // sampleDataList,
        // sampleNameList,
        console.log(ProcessCapability);
        res.json({
            chartData,
            summaryData,
            statisticsData,
            ProcessCapability,
            api_result: constant.kResultOk,
        })
    } catch (error) {
        console.log(error);
        res.json({ error, api_result: constant.kResultNok, })
    }
})

router.post('/warningStatus', async (req, res) => {
    try {
        const { summaryData, usl, lsl } = req.body
        var rule1Index = []
        var rule2Index = []
        var rule3Index = []
        var rule4Index = []
        console.log(usl, lsl);
        for (let i = 0; i < summaryData.length; i++) {
            const item = summaryData[i];
            // rule1
            if (usl || lsl) {
                if (item.X_bar > parseFloat(usl) || item.X_bar < parseFloat(lsl)) {
                    rule1Index.push(i)
                }
            }

            //rule2
            if (item.X_bar > item.ucl_x || item.X_bar < item.lcl_x) {
                rule2Index.push(i)
            }

            //rule3
            if (i < (summaryData.length - 9)) {
                var more_cl = 0
                var lower_cl = 0
                for (let j = i; j < i + 9; j++) {
                    const element = summaryData[j];
                    if (element.X_bar > element.cl_x) {
                        more_cl++
                    }
                    if (element.X_bar < element.cl_x) {
                        lower_cl++
                    }
                }
                if (more_cl >= 9 || lower_cl >= 9) {
                    rule3Index.push(i)
                }
            }

            //rule4
            if (i < (summaryData.length - 6)) {
                var countMoreThan = 0
                for (let j = i; j < i + 6 - 1; j++) {
                    const element1 = summaryData[j];
                    const element2 = summaryData[j + 1];
                    if (element2.X_bar > element1.X_bar) {
                        countMoreThan++
                    } else {
                        break
                    }
                }
                if (countMoreThan >= 6 - 1) {
                    rule4Index.push(i)
                }
            }
        }

        res.json({ rule1Index, rule2Index, rule3Index, rule4Index, summaryData })
    } catch (error) {
        console.log(error);
    }
})

function shuffle(array) {
    var currentIndex = array.length, randomIndex;

    // While there remain elements to shuffle...
    while (currentIndex != 0) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
    }

    return array;
}


module.exports = router;
