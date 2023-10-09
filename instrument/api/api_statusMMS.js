const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const constance = require("../constance/constance");
const moment = require("moment");

// import model

const mms_table = require("../models/model_statusMMS");

router.get("/gantt_MMS/:start_date/:selectMC", async (req, res) => {
  try {
    const { start_date, selectMC } = req.params;
    let stringMachine = await selectMC.replace("[", "");
    stringMachine = await stringMachine.replace("]", "");
    stringMachine = await stringMachine.replaceAll('"', "'");

    let ganttResult_STOP = await mms_table.sequelize.query(`
      WITH tb1
         AS
         (
         SELECT  
         iif(DATEPART(HOUR, [occurred])<7,dateadd(day,-1,[occurred]),[occurred]) as occur_new
           ,[mc_status]
           ,[occurred]
          
         ,[mc_no]
      FROM [counter].[dbo].[test_mc_status]
      where [mc_no] ='${selectMC}' 
      group by [mc_status],iif(DATEPART(HOUR, [occurred])<7,dateadd(day,-1,[occurred]),[occurred]),[occurred],[mc_no])
       , tb2  as(   select  [mc_status],format(occur_new,'yyyy-MM-dd')  as newDate ,[occurred],[mc_no]
         FROM tb1
       )
       ,tb3 as (select [mc_status],[occurred],tb2.[newDate] as [MfgDate] ,[mc_no]
       from tb2
      )
       ,tb4 as (
           SELECT *
             ,lead([occurred]) over(partition by [mc_no] order by [mc_no],[occurred]) AS [NextTimeStamp]
           FROM tb3 
           where tb3.[MfgDate] = '${start_date}'
           )
           select * from tb4 where [mc_status] = '0' and [NextTimeStamp] is not null
      `);
    console.log(ganttResult_STOP);

    let ganttResult_START = await mms_table.sequelize.query(` WITH tb1
      AS
      (
      SELECT  
      iif(DATEPART(HOUR, [occurred])<7,dateadd(day,-1,[occurred]),[occurred]) as occur_new
        ,[mc_status]
        ,[occurred]
       
      ,[mc_no]
   FROM [counter].[dbo].[test_mc_status]
   where [mc_no] ='${selectMC}' 
   group by [mc_status],iif(DATEPART(HOUR, [occurred])<7,dateadd(day,-1,[occurred]),[occurred]),[occurred],[mc_no])
    , tb2  as(   select  [mc_status],format(occur_new,'yyyy-MM-dd')  as newDate ,[occurred],[mc_no]
      FROM tb1
    )
    ,tb3 as (select [mc_status],[occurred],tb2.[newDate] as [MfgDate] ,[mc_no]
    from tb2
   )
    ,tb4 as (
        SELECT *
          ,lead([occurred]) over(partition by [mc_no] order by [mc_no],[occurred]) AS [NextTimeStamp]
        FROM tb3 
        where tb3.[MfgDate] = '${start_date}'
        )
        select * from tb4 where [mc_status] = '1' and [NextTimeStamp] is not null
      `);
    let ganttResult_ALARM = await mms_table.sequelize.query(` WITH tb1
      AS
      (
      SELECT  
      iif(DATEPART(HOUR, [occurred])<7,dateadd(day,-1,[occurred]),[occurred]) as occur_new
        ,[mc_status]
        ,[occurred]
       
      ,[mc_no]
   FROM [counter].[dbo].[test_mc_status]
   where [mc_no] ='${selectMC}' 
   group by [mc_status],iif(DATEPART(HOUR, [occurred])<7,dateadd(day,-1,[occurred]),[occurred]),[occurred],[mc_no])
    , tb2  as(   select  [mc_status],format(occur_new,'yyyy-MM-dd')  as newDate ,[occurred],[mc_no]
      FROM tb1
    )
    ,tb3 as (select [mc_status],[occurred],tb2.[newDate] as [MfgDate] ,[mc_no]
    from tb2
   )
    ,tb4 as (
        SELECT *
          ,lead([occurred]) over(partition by [mc_no] order by [mc_no],[occurred]) AS [NextTimeStamp]
        FROM tb3 
        where tb3.[MfgDate] = '${start_date}' 
        )
        select * from tb4 where [mc_status] = '2' and [NextTimeStamp] is not null
      `);

    //set data
    let data_STOP = [];
    let data_START = [];
    let data_ALARM = [];

    ganttResult_STOP[0].forEach(async (item) => {
      await data_STOP.push({
        x: item.mc_no,
        y: [
          new Date(item.occurred).getTime(),
          new Date(item.NextTimeStamp).getTime(),
        ],
      });
    });

    console.log(data_STOP);

    ganttResult_START[0].forEach(async (item) => {
      await data_START.push({
        x: item.mc_no,
        y: [
          new Date(item.occurred).getTime(),
          new Date(item.NextTimeStamp).getTime(),
        ],
      });
    });
    console.log(data_START);
    ganttResult_ALARM[0].forEach(async (item) => {
      await data_ALARM.push({
        x: item.mc_no,
        y: [
          new Date(item.occurred).getTime(),
          new Date(item.NextTimeStamp).getTime(),
        ],
      });
    });

    console.log(data_ALARM);

    let series_STOP = { name: "STOP", data: data_STOP };
    let series_START = { name: "START", data: data_START };
    let series_ALARM = { name: "ALARM", data: data_ALARM };

    let series = [series_START, series_STOP, series_ALARM];

    console.log(series);
    res.json({
      series,
    });
  } catch (error) {
    res.json({
      error,
      api_result: constance.NOK,
    });
  }
});



module.exports = router;
