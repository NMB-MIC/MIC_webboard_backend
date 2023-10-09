const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const constance = require("../constance/constance");

// import model
const masterSPC = require("../models/model_masterSPC");
const masterLine = require("../models/model_Data_matching");
const XbarData = require("../models/model_Data_matching");



// get data from SQL query
router.get("/MasterModel", async (req, res) => {
  try {
    let resultdata = await masterSPC.sequelize.query(`SELECT distinct [Model]
  FROM [mms_demo].[dbo].[Master_specs]

      `);

    res.json({
      result: resultdata[0],
    });
  } catch (error) {
    res.json({
      error,
      api_result: constance.NOK,
    });
  }
});

router.get("/MasterLine", async (req, res) => {
  try {
    let resultdata = await masterLine.sequelize.query(`SELECT distinct [Line]   
FROM [mms_demo].[dbo].[Data_matchings]
      `);

    res.json({
      result: resultdata[0],
    });
  } catch (error) {
    res.json({
      error,
      api_result: constance.NOK,
    });
  }
});

router.get("/MasterPart", async (req, res) => {
  try {
    let resultdata = await masterSPC.sequelize.query(`SELECT distinct [Part]
  FROM [mms_demo].[dbo].[Master_specs]
      `);

    res.json({
      result: resultdata[0],
    });
  } catch (error) {
    res.json({
      error,
      api_result: constance.NOK,
    });
  }
});

router.get("/MasterPara/:myPart", async (req, res) => {
  try {
    const { myPart } = req.params;

    let stringPart = await myPart.replace("[", "");
    stringPart = await stringPart.replace("]", "");
    stringPart = await stringPart.replaceAll('"', "'");

    let resultdata = await masterSPC.sequelize
      .query(`with newpara (Parameter,Number) as (
SELECT distinct [Parameter], [id]
FROM [mms_demo].[dbo].[Master_specs]
where [mms_demo].[dbo].[Master_specs].[Part] = '${stringPart}'
)
select Parameter,Number from newpara 
      `);

    res.json({
      result: resultdata[0],
    });
  } catch (error) {
    res.json({
      error,
      api_result: constance.NOK,
    });
  }
});

router.get("/state1", async (req, res) => {
  try {
    let resultstate1 = await XbarData.sequelize.query(`
SELECT TOP (3) [id]
      ,[Model]
      ,[Barcode]
      ,[Axial_Play]
      ,[Oil_Top]
      ,[Oil_Bottom]
      ,[MC_Axial_Play]
      ,[MC_Oil_Top]
      ,[MC_Oil_Bottom]
     
  FROM [mms_demo].[dbo].[Data_shows]
          `);

    // console.log(resultstate1[0]);

    res.json({
      resultstate1: resultstate1[0],
    });
  } catch (error) {
    res.json({
      error,
      api_result: constance.NOK,
    });
  }
});

router.get("/state2", async (req, res) => {
  try {
    let resultstate2 = await XbarData.sequelize.query(`
SELECT TOP (3) 
      [MC_Axial_Play]
      ,[MC_Oil_Top]
      ,[MC_Oil_Bottom]
  FROM [mms_demo].[dbo].[Data_shows]
          `);

    // console.log(resultstate2[0]);

    res.json({
      resultstate2: resultstate2[0],
    });
  } catch (error) {
    res.json({
      error,
      api_result: constance.NOK,
    });
  }
});

router.get(
  "/get_xbar/:mystartdate/:myenddate/:myModel/:myLine/:myPart/:myPara",

  async (req, res) => {
    try {
      const { mystartdate, myenddate, myModel, myLine, myPart, myPara } =
        req.params;
      let jsonPara = await myPara;
      let Para1 = await JSON.parse(jsonPara);

      var listDataAll = [];
      var seriesData = [];
      var seriesTimeset = []

      for (let index = 0; index < Para1.length; index++) {
        const arrayPara = Para1[index];

        let resultYaxis = await XbarData.sequelize
          .query(`SELECT format([mms_demo].[dbo].[Data_matchings].[Timestamp],'yyyy-MM-dd') as [mfg_date],[mms_demo].[dbo].[Data_matchings].[Model],[mms_demo].[dbo].[Data_matchings].[Line],[mms_demo].[dbo].[Data_matchings].[Part],[mms_demo].[dbo].[Data_matchings].[${arrayPara}], [mms_demo].[dbo].[Master_specs].[UCL],[mms_demo].[dbo].[Master_specs].[CL],[mms_demo].[dbo].[Master_specs].[LCL],
           cast(DATEPART(hour, [mms_demo].[dbo].[Data_matchings].[Timestamp]) as varchar) + ':00' as [Time]
    FROM [mms_demo].[dbo].[Data_matchings]
    LEFT JOIN [mms_demo].[dbo].[Master_specs] ON [mms_demo].[dbo].[Data_matchings].[Model] = [mms_demo].[dbo].[Master_specs].[Model] and [mms_demo].[dbo].[Master_specs].[Parameter] = '${arrayPara}'
    where format([mms_demo].[dbo].[Data_matchings].[Timestamp],'yyyy-MM-dd') between '${mystartdate}' and '${myenddate}'and  [mms_demo].[dbo].[Data_matchings].[Model]  ='${myModel}' and [mms_demo].[dbo].[Data_matchings].[Line] ='${myLine}' and [mms_demo].[dbo].[Data_matchings].[Part] ='${myPart}' and [mms_demo].[dbo].[Data_matchings].[${arrayPara}] > '0'
    ORDER BY [mms_demo].[dbo].[Data_matchings].[Timestamp] ;
          `);
        // console.log(resultYaxis);

        arrayData = resultYaxis[0];
        console.log(arrayData);
        console.log("para1", Para1[0]);
        console.log("para2", Para1[1]);

        // วน for เพื่อให้ได้ค่า average ตาม parameter
        let listData = [];
        for (let index = 0; index < arrayData.length; index++) {
          listData.push(arrayData[index][arrayPara]);
        }
        listDataAll.push(listData); // ดึงข้อมูลที่ได้ในแต่ชุดของ listData  ที่เกิดจากการเลือก para แต่ละตัว ใส่ที่ listDataAll
        console.log("listData", listData);
        let collectData = [];
        for (let index = 0; index < listDataAll.length; index++) {
          collectData = { name: Para1[index], data: listDataAll[index] };
        }

        let seriesUCL = [];
        let seriesLCL = [];
        let seriesCL = [];
        let seriesTime = [];

        for (let index = 0; index < arrayData.length; index++) {
          const item = arrayData[index];
          await seriesUCL.push(item.UCL);
          await seriesLCL.push(item.LCL);
          await seriesCL.push(item.CL);
          await seriesTime.push(item.Time);
        }
        console.log("item", arrayData[0].Time);
        let seriesUCL_new = { name: "UCL", data: seriesUCL, color: "#FF4560" };
        let seriesLCL_new = { name: "LCL", data: seriesLCL, color: "#FF4560" };
        let seriesCL_new = { name: "CL", data: seriesCL, color: "#C5D86D" };
        let seriesTime_new = { name: "Time", data: seriesTime };

        let seriesNew = [
          collectData,
          seriesUCL_new,
          seriesLCL_new,
          seriesCL_new,
        ];

        let seriesNewTime = [seriesTime_new];

        seriesData.push(seriesNew);
        seriesTimeset.push(seriesNewTime)

        console.log("series", seriesData);
      }

      res.json({
        seriesData,seriesTimeset,

        api_result: constance.OK,
      });
    } catch (error) {
      console.log(error);
      res.json({ error, api_result: constance.NOK });
    }
  }
);

module.exports = router;
