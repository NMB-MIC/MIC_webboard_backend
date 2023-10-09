const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const constance = require("../constance/constance");
const moment = require("moment");

// import model
const counter_table = require("../models/model_counter");

function getDatesInRange(startDate, endDate) {
  const date = new Date(startDate.getTime());
  const dates = [];
  while (date <= endDate) {
    dates.push(formatDate(new Date(date)));
    date.setDate(date.getDate() + 1);
  }
  return dates;
}
function formatDate(date) {
  var d = new Date(date),
    month = "" + (d.getMonth() + 1),
    day = "" + d.getDate(),
    year = d.getFullYear();

  if (month.length < 2) month = "0" + month;
  if (day.length < 2) day = "0" + day;
  return [year, month, day].join("-");
}

/////////////////////// counter /////////////////////////

// MMS alarm
router.get("/mms/:start_date/:end_date/:selectMc", async (req, res) => {
  // router.get("/mms/:start_date/:end_date", async (req, res) => {
  let { start_date } = req.params;
  let { end_date } = req.params;
  let { selectMc } = req.params;
  console.log(selectMc);

  var list_date = [];
  list_date = getDatesInRange(new Date(start_date), new Date(end_date));
  console.log("list_date", list_date);
  var command_column = "";
  var command_pivot = "";
  for (let i = 0; i < list_date.length; i++) {
    command_column =
      command_column +
      `CONVERT(varchar, isnull([` +
      list_date[i] +
      `],0))+','+`;
    command_pivot = command_pivot + "],[" + list_date[i];
  }
  command_column = command_column.substring(0, command_column.length - 5);
  command_pivot = command_pivot + "]";
  command_pivot = command_pivot.substring(2);

  //console.log('command_column',command_column);
  console.log("command_pivot", command_pivot);

  try {
    let resultMMS = await counter_table.sequelize.query(
      `
    WITH cte_quantity
    AS
    (
SELECT 
    [topic]
  ,iif(DATEPART(HOUR, [occurred])<7,dateadd(day,-1,[occurred]),[occurred]) as occur_new
--    ,format( [occurred] ,'dd-MM-yyyy') as newDate
    ,[sum]


FROM [counter].[dbo].[test_mms]	
 
 where [mc_no] = '${selectMc}'and (convert(datetime, [occurred] , 101) between '${start_date}'and'${end_date}' )		
 group by [topic],iif(DATEPART(HOUR, [occurred])<7,dateadd(day,-1,[occurred]),[occurred]),[sum]
 )
   
 , tb1  as(   select  [topic], CONVERT(DECIMAL(10,2),(CAST(sum([sum]) as Float)/60 )) as totalMinute
 ,format(occur_new,'yyyy-MM-dd')  as newDate
 FROM cte_quantity
 group by format(occur_new,'yyyy-MM-dd') ,[topic]

  )
  select [topic],
  ` +
        command_column +
        ` as array
    from tb1 
PIVOT (sum(totalMinute)
FOR [newDate] IN (` +
        command_pivot +
        `)
) AS pvt
ORDER BY pvt.[topic]

        `
    );
    console.log(resultMMS[0]);
    arrayData_MMS = resultMMS[0];

    let resultList_MMS = [];
    arrayData_MMS.forEach(function (a) {
      if (!this[a.topic]) {
        this[a.topic] = { name: a.topic, data: [] };
        resultList_MMS.push(this[a.topic]);
      }
      this[a.topic].data.push(a.array);
    }, Object.create(null));

    console.log(resultList_MMS);

    res.json({
      resultMMS: resultList_MMS,
      resultDate_MMS: list_date,
    });
  } catch (error) {
    res.json({
      error,
      api_result: constance.NOK,
    });
  }
});

router.get("/mms_machine", async (req, res) => {
  try {
    let resultMachine = await counter_table.sequelize.query(`SELECT [process]
    ,[machine_no]
FROM [mms_demo].[dbo].[master_machine]
        `);
    console.log(resultMachine[0]);
    arrayData = resultMachine[0];

    res.json({
      resultMc: arrayData,
    });
  } catch (error) {
    res.json({
      error,
      api_result: constance.NOK,
    });
  }
});

router.post("/master_mc", async (req, res) => {
  // router.post("/TB_counter_mc", async (req, res) => {
  try {
    let result = await counter_table.sequelize.query(
      `
      SELECT  distinct(left(UPPER([mc_no]),5)) AS mc_no
      FROM [mms_demo].[dbo].[data_alarmlist]
      --order by [mc_no] desc
          `
    );
    let result_basic = await counter_table.sequelize.query(
      `
      SELECT  distinct((UPPER([mc_no]))) AS mc_no
      FROM [mms_demo].[dbo].[data_alarmlist]
      order by [mc_no] desc
          `
    );
    return res.json({
      result: result[0],
      result_basic: result_basic[0],
      api_result: constance.OK,
    });
  } catch (error) {
    console.log("*******master*****error***************");

    console.log(result);
    res.json({
      result: error,
      api_result: constance.NOK,
    });
  }
});

router.post("/mms_log", async (req, res) => {
  try {
    let Result = await counter_table.sequelize.query(
      `
          /* get status_log*/
          with tb1 as ( SELECT format (iif(DATEPART(HOUR, [occurred])<7,dateadd(day,-1,[occurred]),[occurred]),'yyyy-MM-dd') as mfg_date
          ,IIF(CAST(DATEPART(HOUR, [occurred]) AS int)=0,23,CAST(DATEPART(HOUR, [occurred]) AS int)) as [hour]
          ,[occurred]
      ,[mc_status]
      ,[mc_no]
  FROM [mms_demo].[dbo].[data_mcstatus])
      ,tb2 as (select  mfg_date,[occurred]
        ,lead([occurred]) over(partition by [mc_no] order by [mc_no],[occurred]) AS [NextTimeStamp]
        ,[mc_status]
        ,[mc_no]
        from tb1
        where [mc_no] = '${req.body.machine}' and  mfg_date = '${req.body.date}' )
         --where [mc_no] ='${req.body.machine}' and  mfg_date = '${req.body.date}' )
        select mfg_date,convert(varchar,[occurred],120) as [occurred]
        ,convert(varchar,[NextTimeStamp] ,120) as [NextTimeStamp],[mc_status] 
	      ,datediff(SECOND,occurred,NextTimeStamp) as sec_timediff 
	      ,datediff(MINUTE,occurred,NextTimeStamp) as min_timediff 
        from tb2 where [NextTimeStamp] is not null
    `
    );
    return res.json({ result: Result[0] });
  } catch (error) {
    res.json({
      error,
      api_result: constance.NOK,
    });
  }
});

router.post("/Timeline_Alarmlist", async (req, res) => {
  try {
    let result = await counter_table.sequelize.query(
      ` -- chart alarm topic
    with tb1 as (select [topic],
      format (iif(DATEPART(HOUR, [occurred])<7,dateadd(day,-1,[occurred]),[occurred]),'yyyy-MM-dd') as mfg_date
      ,[occurred]
      ,[restored]
     --,convert(varchar, [test_counter].[occurred],120) as [occurred]
     --,convert(varchar, [test_counter].[restored],120) as [restored]
     ,IIF(CAST(DATEPART(HOUR, [occurred]) AS int)=0,23,CAST(DATEPART(HOUR, [occurred]) AS int)) as [hour]
     ,UPPER([mc_no]) as [mc_no]
     ,UPPER(left([mc_no],2)) as propcess
     FROM [mms_demo].[dbo].[data_alarmlist]
  )
--,tb2 as (
--select tb1.mfg_date,tb1.[topic],tb1.[occurred] ,tb1.[restored],tb1.[hour],tb1.propcess ,tb1.[mc_no]
--,[test_topic_masters].[responsible]
--from tb1 left join [test_topic_masters]
--on tb1.[topic] COLLATE SQL_Latin1_General_CP1_CI_AS = [test_topic_masters].[Topic] COLLATE SQL_Latin1_General_CP1_CI_AS
--)
select mfg_date,[topic]
       ,convert(varchar,[occurred],120) as [occurred]
       ,convert(varchar,[restored],120) as [restored],[hour],[mc_no]
       , case when mc_no like '%r' then 2
			  when mc_no like '%b' then 1
			  when mc_no like '%h' then 3
			  else 5 end as num
from tb1
where mfg_date = '${req.body.date}'
--and [mc_no] = '${req.body.machine}'
and [mc_no] = '${req.body.machine}'

       order by CASE
                     WHEN [hour] = 7 THEN 1
                     WHEN [hour] = 8 THEN 2
                     WHEN [hour] = 9 THEN 3
                     WHEN [hour] = 10 THEN 4
                     WHEN [hour] = 11 THEN 5
                     WHEN [hour] = 12 THEN 6
                     WHEN [hour] = 13 THEN 7
                     WHEN [hour] = 14 THEN 8
                     WHEN [hour] = 15 THEN 9
                     WHEN [hour] = 16 THEN 10
                     WHEN [hour] = 17 THEN 11
                     WHEN [hour] = 18 THEN 12
                     WHEN [hour] = 19 THEN 13
                     WHEN [hour] = 20 THEN 14 
                     WHEN [hour] = 21 THEN 15
                     WHEN [hour] = 22 THEN 16
                     WHEN [hour] = 23 THEN 17
                     WHEN [hour] = 0 THEN 18
                     WHEN [hour] = 1 THEN 19
                     WHEN [hour] = 2 THEN 20
                     WHEN [hour] = 3 THEN 21
                     WHEN [hour] = 4 THEN 22
                     WHEN [hour] = 5 THEN 23
                    WHEN [hour] = 6 THEN 24
              else 0   end ,[occurred]`
    );
    // console.log(result[0]);
    return res.json({ result: result[0] });
  } catch (error) {
    res.json({
      result: error,
      api_result: constance.NOK,
    });
  }
});
router.post("/AlarmTopic_time2", async (req, res) => {
  try {
    let Result = await counter_table.sequelize.query(
      `      /* TABLE TIME -- count time HH:mm:ss */
        with tb1 as(SELECT 	
          [registered_at],
    format (iif(DATEPART(HOUR, [occurred])<7,dateadd(day,-1,[occurred]),[occurred]),'yyyy-MM-dd') as mfg_date ,
          LEAD([occurred]) OVER (ORDER BY [occurred] ) AS previous,
          LEAD([occurred]) OVER (ORDER BY [occurred] ASC) - [occurred] AS difference_previous
    ,[occurred]
    ,[mc_status],[mc_no]
    FROM [mms_demo].[dbo].[data_mcstatus]
        where format (iif(DATEPART(HOUR, [occurred])<7,dateadd(day,-1,[occurred]),[occurred]),'yyyy-MM-dd') = '${req.body.date2}' and [mc_no] = '${req.body.machine}')
            ,tb2 as(select
              [mc_status],
                sum(DATEDIFF(SECOND, '0:00:00', [difference_previous] )) as [sec]
               from tb1
               where mfg_date = '${req.body.date2}' and [mc_no] = '${req.body.machine}'
               --where mfg_date = '${req.body.date2}' and [mc_no] = '${req.body.machine}'
              group by [mc_status])
              select top 3
              [SEC],
              [mc_status], case
              when [mc_status] = '1' then 'RUN'
              when [mc_status] = '2' then 'STOP'
              when [mc_status] = '3' then 'ALARM'
              when [mc_status] = '4' then 'WAIT PART'
              when [mc_status] = '5' then 'FULL PART'
                end as [status]

              ,convert(varchar,DATEADD(s,[SEC],0),8) as Alarm
              ,IIF(mc_status = '1','badge rounded-pill bg-success',IIF(mc_status = '2','badge rounded-pill bg-danger',IIF(mc_status = '3','badge rounded-pill bg-warning',IIF(mc_status = '4','badge rounded-pill bg-info','badge rounded-pill bg-primary')))) as bg_badge
              from tb2
              WHERE [SEC] <> '' and mc_status in ('1','2')
              order by [SEC] desc`

      //       `
      //       /* count time HH:mm:ss */
      //       with tb1 as(SELECT
      //         [registered_at],
      //             [status_time],
      //             [mc_status],
      //             [mc_no],
      //         LEAD([status_time]) OVER (ORDER BY [status_time] ) AS previous,
      //         LEAD([status_time]) OVER (ORDER BY [status_time] ASC) - [status_time] AS difference_previous
      //       FROM [counter].[dbo].[grinding_status_alarm_counter]
      //       where [registered_at] between '${req.body.date2}' and '${req.body.dateEnd}' and [mc_no] = '${req.body.machine}')
      //           ,tb2 as(select
      //             [mc_status],
      //               sum(DATEDIFF(SECOND, '0:00:00', [difference_previous] )) as [sec]
      //              from tb1
      //              where [registered_at] between '${req.body.date2}' and '${req.body.dateEnd}' and [mc_no] = '${req.body.machine}'
      //             group by [mc_status])
      //             select
      //             [SEC],
      //             [mc_status], case
      //             when [mc_status] = '0' then 'STOP'
      //             when [mc_status] = '1' then 'RUN'
      //             when [mc_status] = '2' then 'ALARM'
      //             when [mc_status] = '3' then 'WAIT PART'
      //             when [mc_status] = '4' then 'FULL PART'
      //             when [mc_status] = '5' then 'CLEAR'
      //               end as [status]

      //             ,convert(varchar,DATEADD(s,[SEC],0),8) as Alarm
      //             from tb2
      //             order by [mc_status] ASC
      // `
    );
    return res.json({ result: Result[0] });
  } catch (error) {
    res.json({
      error,
      api_result: constance.NOK,
    });
  }
});

//////////////////////////////////////////////////////

// router.post("/GD_counter_log", async (req, res) => {
//   try {
//     let Result = await counter_table.sequelize.query(
//       `
//           /* get status_log*/
//           with tb1 as ( SELECT format (iif(DATEPART(HOUR, [occurred])<7,dateadd(day,-1,[occurred]),[occurred]),'yyyy-MM-dd') as mfg_date
//           ,IIF(CAST(DATEPART(HOUR, [occurred]) AS int)=0,23,CAST(DATEPART(HOUR, [occurred]) AS int)) as [hour]
//           ,[occurred]
//       ,[mc_status]
//       ,[mc_no]
//   FROM [counter].[dbo].[data_mcstatus])
//       ,tb2 as (select  mfg_date,[occurred]
//         ,lead([occurred]) over(partition by [mc_no] order by [mc_no],[occurred]) AS [NextTimeStamp]
//         ,[mc_status]
//         ,[mc_no]
//         from tb1
//         where [mc_no] = '${req.body.machine}' and  mfg_date = '${req.body.date}' )
//          --where [mc_no] ='${req.body.machine}' and  mfg_date = '${req.body.date}' )
//         select mfg_date,convert(varchar,[occurred],120) as [occurred]
//         ,convert(varchar,[NextTimeStamp] ,120) as [NextTimeStamp],[mc_status] 
// 	      ,datediff(SECOND,occurred,NextTimeStamp) as sec_timediff 
// 	      ,datediff(MINUTE,occurred,NextTimeStamp) as min_timediff 
//         from tb2 where [NextTimeStamp] is not null
//     `
//     );
//     return res.json({ result: Result[0] });
//   } catch (error) {
//     res.json({
//       error,
//       api_result: constance.NOK,
//     });
//   }
// });

// router.post("/AlarmTopic_time", async (req, res) => {
//   try {
//     let Result = await counter_table.sequelize.query(
//       `
//           /* count time HH:mm:ss */
//           with tb1 as(
//               select [topic],
//               format (iif(DATEPART(HOUR, [occurred])<7,dateadd(day,-1,[occurred]),[occurred]),'yyyy-MM-dd') as mfg_date
//               ,iif(DATEPART(HOUR, [occurred])<7,dateadd(day,-1,[occurred]),[occurred]) as occur_new
//               ,iif(DATEPART(HOUR, [restored])<7,dateadd(day,-1,[restored]),[restored]) as [restored]
//              --,convert(varchar, [test_counter].[occurred],120) as [occurred]
//              --,convert(varchar, [test_counter].[restored],120) as [restored]
//              ,IIF(CAST(DATEPART(HOUR, [test_counter].[occurred]) AS int)=0,23,CAST(DATEPART(HOUR, [test_counter].[occurred]) AS int)) as [hour]
//              ,[mc_no]
//              ,[sum]
//              FROM [counter].[dbo].[test_counter]
//              )
//             ,tb2 as ( 
//             select  [topic]
//              ,sum([sum]) as [Time]
//              from tb1
//              where mfg_date = '${req.body.date}'
//              and [mc_no] = '${req.body.machine}'
//              group by [topic]
//              ) 
//             select top(3) [topic]
//             ,[Time]
//             ,convert(varchar,DATEADD(s,[Time],0),8) as Alarm
//             from tb2
//             order by convert(varchar,DATEADD(s,[Time],0),8) desc 
//     `
//     );
//     return res.json({ result: Result[0] });
//   } catch (error) {
//     res.json({
//       error,
//       api_result: constance.NOK,
//     });
//   }
// });

// // Table Topic MC
// router.post("/GetTopic_time", async (req, res) => {
//   try {
//     let Result = await counter_table.sequelize.query(
//       `      /* TABLE TIME -- count time HH:mm:ss */
//       with tb1 as(SELECT 	
//           [registered_at],
//     format (iif(DATEPART(HOUR, [occurred])<7,dateadd(day,-1,[occurred]),[occurred]),'yyyy-MM-dd') as mfg_date ,
//           LEAD([occurred]) OVER (ORDER BY [occurred] ) AS previous,
//           LEAD([occurred]) OVER (ORDER BY [occurred] ASC) - [occurred] AS difference_previous
// 		  ,[occurred]-[restored] as rre
//     ,[occurred]
//     ,[topic],[restored],[time_diff],[mc_no]
//   FROM [counter].[dbo].[data_alarmlist]
//         where format (iif(DATEPART(HOUR, [occurred])<7,dateadd(day,-1,[occurred]),[occurred]),'yyyy-MM-dd') = '${req.body.date2}' and [mc_no] = '${req.body.machine}')
//             ,tb2 as(select
//               [topic],
//                 sum(DATEDIFF(SECOND, '0:00:00', [difference_previous] )) as [sec]
//                from tb1
//                where mfg_date = '${req.body.date2}' and [mc_no] = '${req.body.machine}'
//               group by [topic])
//               select top 3
//               [SEC],topic,convert(varchar,DATEADD(s,[SEC],0),8) as Alarm
//      --         ,IIF(mc_status = '1','badge rounded-pill bg-success',IIF(mc_status = '2','badge rounded-pill bg-danger',IIF(mc_status = '3','badge rounded-pill bg-warning',IIF(mc_status = '4','badge rounded-pill bg-info','badge rounded-pill bg-primary')))) as bg_badge
//               from tb2
//               order by [SEC] desc`
//     );
//     return res.json({ result: Result[0] });
//   } catch (error) {
//     res.json({
//       error,
//       api_result: constance.NOK,
//     });
//   }
// });

// //counter GD ICB
// router.post("/counter_counter_ICB", async (req, res) => {
//   try {
//     let result = await counter_table.sequelize.query(`
//     SELECT TOP(1) registered_at,[mc_no],[rssi],[mc_status],[status_time],[avg_cycletime],[utl_shift1]
//     ,[utl_shift2],[utl_shift3],[utl_total],[prod_shift1],[prod_shift2],[prod_shift3],[prod_total]
//   FROM [counter].[dbo].[grinding_status_alarm_counter]
//   WHERE [mc_no] = '${req.body.mc_no}'
//   ORDER BY registered_at DESC
//         `);
//     console.log(result[0]);
//     res.json({
//       result: result[0],
//     });
//   } catch (error) {
//     res.json({
//       result: error,
//       api_result: constance.NOK,
//     });
//   }
// });

// //mc status [non/operating time]
// router.post(
//   "/MC_Status_All/:start_date/:end_date/:selectMc",
//   async (req, res) => {
//     try {
//       let { start_date } = req.params;
//       let { end_date } = req.params;
//       let { selectMc } = req.params;
//       let resultdata = await counter_table.sequelize.query(
//         `WITH tb1
//       AS
//       (
//       SELECT  
//       iif(DATEPART(HOUR, [occurred])<7,dateadd(day,-1,[occurred]),[occurred]) as occur_new
//   , [registered_at]
//    ,[occurred]
//    ,[mc_status]
//    ,[mc_no]
// FROM [counter].[dbo].[data_mcstatus]
//    where [mc_no] ='${selectMc}' 
//    group by [mc_status],iif(DATEPART(HOUR, [occurred])<7,dateadd(day,-1,[occurred]),[occurred])  , [registered_at]
//    ,[occurred]
//    ,[mc_status]
//    ,[mc_no])
//     , tb2  as(   select  [mc_status],format(occur_new,'yyyy-MM-dd')  as newDate ,[occurred],[mc_no]
//       FROM tb1
//     )
//     ,tb3 as (select tb2.[newDate]  as [mfg_date],[mc_no],[mc_status],[occurred]
//     from tb2
//    )
//     ,tb4 as (
//         SELECT *
//           ,lead([occurred]) over(partition by [mc_no] order by [mc_no],[occurred]) AS [NextTimeStamp]
//         FROM tb3 
//         where tb3.[mfg_date]  between '${start_date}'  and '${end_date}' --= '2023-08-24'
//         )
//         ,tb5 as (
//     select * ,datediff(MINUTE,occurred,NextTimeStamp) as timediff 
//     from tb4 where [NextTimeStamp] is not null
//    --group by [mfg_date],[mc_no],occurred,NextTimeStamp,[mc_status]
//     --order by occurred desc
//     ) 
//     ,non as (
//     select mfg_date,[mc_no], sum(timediff) as non_oper
//     from tb5 
//     where [mc_status] <> '1'
//     group by mfg_date,[mc_no]
//     )
//     ,oper as ( select mfg_date,[mc_no], sum(timediff) as oper
//     from tb5 
//     group by mfg_date,[mc_no]
//     )
//     select non.mfg_date,oper.[mc_no],oper,non_oper
//     from non 
//     left join oper
//     on non.mfg_date = oper.mfg_date
//     --where oper > non_oper`
//         //       `-- ///////////  non operating [1-5] = all  ///////////
//         //       with tb1_min as(
//         //       SELECT [occurred],mc_no,[mc_status],format (iif(DATEPART(HOUR, [occurred])<7,dateadd(day,-1,[occurred]),[occurred]),'yyyy-MM-dd') as mfg_date
//         //           ,convert(varchar, [occurred], 108) as min_cur
//         //         FROM [counter].[dbo].[data_mcstatus]
//         //        where  DATEPART(HOUR,[occurred] ) > '12' and /*DATEPART(HOUR,[occurred] ) = '15' and*/ format (iif(DATEPART(HOUR, [occurred])<7,dateadd(day,-1,[occurred]),[occurred]),'yyyy-MM-dd') between '${start_date}'  and '${end_date}'
//         //        and mc_no = '${selectMc}' and [mc_status] <> '1'
//         //        )
//         //        , total_tb1 as (
//         //        select mfg_date,MIN(min_cur) as min_date,MAX(min_cur) as max_date,mc_no
//         //        from tb1_min
//         //        group by mc_no,mfg_date
//         //        )
//         //        -- //////////  operationg [1-5]   ////////////
//         //        ,tb2_min as(
//         //       SELECT [occurred],mc_no,[mc_status],format (iif(DATEPART(HOUR, [occurred])<7,dateadd(day,-1,[occurred]),[occurred]),'yyyy-MM-dd') as mfg_date
//         //           ,convert(varchar, [occurred], 108) as min_cur
//         //         FROM [counter].[dbo].[data_mcstatus]
//         //        where  DATEPART(HOUR,[occurred] ) > '12' and /*DATEPART(HOUR,[occurred] ) = '15' and*/  format (iif(DATEPART(HOUR, [occurred])<7,dateadd(day,-1,[occurred]),[occurred]),'yyyy-MM-dd') between '${start_date}'  and '${end_date}'
//         //        and mc_no = '${selectMc}' and [mc_status] = '1'
//         //        --order by registered_at asc
//         //        )
//         //        , total_tb2 as (select mfg_date,MIN(min_cur) as min_date,MAX(min_cur) as max_date, mc_no
//         //        from tb2_min
//         //       group by mc_no,mfg_date)
//         //       ,total_all as (
//         //        select total_tb1.mfg_date,Upper(total_tb1.mc_no) as mc_no, DATEDIFF(SECOND,total_tb1.min_date, total_tb1.max_date) as nonoper , DATEDIFF(SECOND,total_tb2.min_date, total_tb2.max_date) as oper
//         //        from total_tb1
//         //        left join total_tb2
//         //        on total_tb1.mfg_date = total_tb2.mfg_date)
//         //        select mfg_date,mc_no,nonoper,cast((nonoper/(6*3600.00))*100 as decimal(10,2)) as [dec_non]   --,(nonoper*100/(6*3600)) as non
//         //        ,oper,cast((oper*100/(6*3600.00)) as decimal(10,2)) as [dec_oper]
//         //        from total_all
//         //  `
//       );

//       // console.log(resultdata);
//       console.log(resultdata[0].length);
//       arrayData = resultdata[0];
//       let name_series = ["Operating time", "Non - Operating time"];
//       let resultMC_Status = [];
//       arrayData.forEach(function (a) {
//         if (!this[a.mfg_date]) {
//           this[a.mfg_date] = { name: a.mfg_date, data: [] };
//           resultMC_Status.push(this[a.mfg_date]);
//         }
//         this[a.mfg_date].data.push(
//           a.oper,
//           a.non_oper
//           // a.dec_non,
//           // a.dec_oper,
//         );
//       }, Object.create(null));
//       // set arr all value
//       console.log("resultMC_Status =========", resultMC_Status);
//       let getarr1 = [];
//       let getarr2 = [];
//       for (let index = 0; index < resultMC_Status.length; index++) {
//         const item = resultMC_Status[index];
//         await getarr1.push(item.data[0]);
//         await getarr2.push(item.data[1]);
//       }
//       let getarr = [];
//       getarr.push(getarr1, getarr2);
//       // console.log(getarr);
//       //set name ball
//       let namemc = [];
//       for (let index = 0; index < resultMC_Status.length; index++) {
//         const item = resultMC_Status[index];
//         await namemc.push(item.name);
//       }
//       //set arr name,data
//       let dataset = [];
//       for (let index = 0; index < getarr.length; index++) {
//         dataset.push({
//           name: name_series[index],
//           data: getarr[index],
//         });
//       }

//       let resultDate = [];
//       arrayData.forEach(function (a) {
//         if (!this[a.mfg_date]) {
//           this[a.mfg_date] = { name: a.mfg_date };
//           resultDate.push(this[a.mfg_date]);
//         }
//       }, Object.create(null));

//       let newDate = [];
//       for (let index = 0; index < resultDate.length; index++) {
//         const item = resultDate[index];
//         await newDate.push(item.name);
//       }

//       // console.log(BallUsage[0]);
//       console.log("==============");
//       console.log(dataset);
//       console.log(resultDate);

//       res.json({
//         // resultBall: BallUsage[0],
//         result_length: resultdata[0].length,
//         result: dataset,
//         resultDate: newDate,

//         // resultTarget_turn: seriesTarget_new,
//       });
//     } catch (error) {
//       res.json({
//         error,
//         api_result: constance.NOK,
//       });
//     }
//   }
// );

// //mc status [non/operating time]
// router.post(
//   "/mc_by_status/:start_date/:end_date/:selectMc",
//   async (req, res) => {
//     try {
//       let { start_date } = req.params;
//       let { end_date } = req.params;
//       let { selectMc } = req.params;
//       let resultdata = await counter_table.sequelize.query(
//         `  WITH tb1
//       AS
//       (
//       SELECT  
//       iif(DATEPART(HOUR, [occurred])<7,dateadd(day,-1,[occurred]),[occurred]) as occur_new
//   , [registered_at]
//    ,[occurred]
//    ,[mc_status]
//    ,[mc_no]
// FROM [counter].[dbo].[data_mcstatus]
//    where [mc_no] ='${selectMc}' 
//    group by [mc_status],iif(DATEPART(HOUR, [occurred])<7,dateadd(day,-1,[occurred]),[occurred])  , [registered_at]
//    ,[occurred]
//    ,[mc_status]
//    ,[mc_no])
//     , tb2  as(   select  [mc_status],format(occur_new,'yyyy-MM-dd')  as newDate ,[occurred],[mc_no]
//       FROM tb1
//     )
//     ,tb3 as (select tb2.[newDate]  as [mfg_date],[mc_no],[mc_status],[occurred]
//     from tb2
//    )
//     ,tb4 as (
//         SELECT *
//           ,lead([occurred]) over(partition by [mc_no] order by [mc_no],[occurred]) AS [NextTimeStamp]
//         FROM tb3 
//         where tb3.[mfg_date] between '${start_date}' and '${end_date}'
//         )
//         ,tb5 as (
//     select * ,datediff(MINUTE,occurred,NextTimeStamp) as timediff 
//     from tb4 where [NextTimeStamp] is not null
//     ) 
//     ,run as (
//     select mfg_date,[mc_no], sum(timediff) as run_oper
//     from tb5 
//     where [mc_status] = '1'
//     group by mfg_date,[mc_no]
//     )
//     ,stop as ( select mfg_date,[mc_no], sum(timediff) as stop_oper
//     from tb5 
//     where [mc_status] = '2'
//     group by mfg_date,[mc_no]
//     )
//     ,alarm as ( select mfg_date,[mc_no], sum(timediff) as alarm_oper
//     from tb5 
//     where [mc_status] = '3'
//     group by mfg_date,[mc_no]
//     )
//     ,wait as ( select mfg_date,[mc_no], sum(timediff) as wait_oper
//     from tb5 
//     where [mc_status] = '4'
//     group by mfg_date,[mc_no]
//     )
//     ,full_part as ( select mfg_date,[mc_no], sum(timediff) as full_oper
//     from tb5 
//     where [mc_status] = '5'
//     group by mfg_date,[mc_no]
//     )
//     select run.mfg_date,run.[mc_no],run_oper,stop_oper,alarm_oper,wait_oper,full_oper
//     from run 
//     left join stop
//     on run.mfg_date = stop.mfg_date
//     left join alarm
//     on run.mfg_date = alarm.mfg_date
//     left join wait
//     on run.mfg_date = wait.mfg_date
//     left join full_part
//     on run.mfg_date = full_part.mfg_date

// `
//       );

//       console.log(resultdata[0].length);
//       arrayData = resultdata[0];
//       let name_series = [
//         "RUN (1)",
//         "STOP (2)",
//         "ALARM (3)",
//         "WAIT PART (4)",
//         "FULL PART (5)",
//       ];
//       let resultMC_Status = [];
//       arrayData.forEach(function (a) {
//         if (!this[a.mfg_date]) {
//           this[a.mfg_date] = { name: a.mfg_date, data: [] };
//           resultMC_Status.push(this[a.mfg_date]);
//         }
//         this[a.mfg_date].data.push(
//           a.run_oper,
//           a.stop_oper,
//           a.alarm_oper,
//           a.wait_oper,
//           a.full_oper
//           // a.dec_non,
//           // a.dec_oper,
//         );
//       }, Object.create(null));
//       // set arr all value
//       console.log("resultMC_Status ====status=====", resultMC_Status);
//       let getarr1 = [];
//       let getarr2 = [];
//       let getarr3 = [];
//       let getarr4 = [];
//       let getarr5 = [];
//       for (let index = 0; index < resultMC_Status.length; index++) {
//         const item = resultMC_Status[index];
//         await getarr1.push(item.data[0]);
//         await getarr2.push(item.data[1]);
//         await getarr3.push(item.data[2]);
//         await getarr4.push(item.data[3]);
//         await getarr5.push(item.data[4]);
//       }
//       let getarr = [];
//       getarr.push(getarr1, getarr2, getarr3, getarr4, getarr5);
//       // console.log(getarr);
//       //set name ball
//       let namemc = [];
//       for (let index = 0; index < resultMC_Status.length; index++) {
//         const item = resultMC_Status[index];
//         await namemc.push(item.name);
//       }
//       //set arr name,data
//       let dataset = [];
//       for (let index = 0; index < getarr.length; index++) {
//         dataset.push({
//           name: name_series[index],
//           data: getarr[index],
//         });
//       }

//       let resultDate = [];
//       arrayData.forEach(function (a) {
//         if (!this[a.mfg_date]) {
//           this[a.mfg_date] = { name: a.mfg_date };
//           resultDate.push(this[a.mfg_date]);
//         }
//       }, Object.create(null));

//       let newDate = [];
//       for (let index = 0; index < resultDate.length; index++) {
//         const item = resultDate[index];
//         await newDate.push(item.name);
//       }

//       // console.log(BallUsage[0]);
//       console.log("======status========");
//       console.log(dataset);
//       console.log(newDate);

//       res.json({
//         resultdata: resultdata,
//         result: dataset,
//         resultDate: newDate,

//         // resultTarget_turn: seriesTarget_new,
//       });
//     } catch (error) {
//       res.json({
//         error,
//         api_result: constance.NOK,
//       });
//     }
//   }
// );

// router.get(
//   "/count_mc_status_daily_GD/:start_date/:end_date",
//   async (req, res) => {
//     let { start_date } = req.params;
//     let { end_date } = req.params;
//     let { selectMc } = req.params;
//     console.log(selectMc);

//     var list_date = [];
//     list_date = getDatesInRange(new Date(start_date), new Date(end_date));
//     console.log("list_date", list_date);
//     var command_column = "";
//     var command_pivot = "";
//     for (let i = 0; i < list_date.length; i++) {
//       command_column =
//         command_column +
//         `CONVERT(varchar, isnull([` +
//         list_date[i] +
//         `],0))+','+`;
//       command_pivot = command_pivot + "],[" + list_date[i];
//     }
//     command_column = command_column.substring(0, command_column.length - 5);
//     command_pivot = command_pivot + "]";
//     command_pivot = command_pivot.substring(2);

//     //console.log('command_column',command_column);
//     // console.log("command_pivot", command_pivot);

//     try {
//       let resultcounter = await counter_table.sequelize.query(
//         `  WITH tb1 as (Select
//     format ( iif(DATEPART(HOUR, [occurred])<7,dateadd(day,-1,[occurred]),[occurred]),'yyyy-MM-dd') as [mfg_date],
//           iif(DATEPART(HOUR, [occurred])<7,dateadd(day,-1,[occurred]),[occurred]) as our,
//               --COUNT(mc_status) as new_mc_status-- sum(CASE WHEN [mc_status] <> '1' THEN 1 ELSE 0 END) as new_mc_status
//               [mc_no]
                
//             FROM [counter].[dbo].[data_mcstatus]
//             group by [occurred], [mc_no],[mc_status])
//     ,tb3 as (	  select [mfg_date],CASE WHEN COUNT([mc_no]) > 1 THEN 1 ELSE 0 END as new_mc_status,[mc_no]
//         from tb1
//         group by  [mfg_date],[mc_no]
//         --order by mc_no asc
//         )
//     ,tb2
//           AS
//           ( Select  [mfg_date],new_mc_status,[mc_no]
                
//             FROM tb3
//             where  [mfg_date] between '${start_date}'and'${end_date}' and mc_no like '%r'-- and [mc_no] in ('TB01','TB02','TB03','TB04','TB05','TB06','TB14','TB15','TB16','TB17','TB18')
//         )
//           select [mc_no] as name,
//           ` +
//           command_column +
//           ` as data
//             from tb2
//         PIVOT (sum(new_mc_status)
//         FOR [mfg_date] IN (` +
//           command_pivot +
//           `)
//         ) AS pvt
//         ORDER BY pvt.[mc_no]
//           `
//       );

//       arrayData_Over = resultcounter[0];
//       console.log(arrayData_Over);
//       //   arrayData_Over.forEach(function (data, index) {
//       //     arrayData_Over[index].array = (data.array.split(","))
//       // })
//       // console.log("test", arrayData_Over)
//       // ตัด '
//       arrayData_Over.forEach(function (data, index) {
//         arrayData_Over[index].data = data.data.split(",").map((str) => {
//           return +str;
//         });
//       });

//       // console.log("test", arrayData_Over);

//       // let resultList_counter = [];
//       // arrayData_Over.forEach(function (a) {
//       //   if (!this[a.mc_no]) {
//       //     this[a.mc_no] = { name: a.mc_no, data: [] };
//       //     resultList_counter.push(this[a.mc_no]);
//       //   }
//       //   this[a.mc_no].data.push(a.array);
//       // }, Object.create(null));

//       // console.log(resultList_counter);
//       // console.log(list_date);
//       // console.log(resultList_counter.data[0]);

//       res.json({
//         // result: resultList_counter,
//         result_Over: arrayData_Over,
//         resultDate: list_date,
//       });
//     } catch (error) {
//       res.json({
//         error,
//         api_result: constance.NOK,
//       });
//     }
//   }
// );


module.exports = router;
