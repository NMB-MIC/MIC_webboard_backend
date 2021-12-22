const express = require("express");
const router = express.Router();

const jobs_process_master = require('./../model/jobs_process_master');
const division = require("./../model/division_master");
const constants = require("./../constant/constant");

const Sequelize = require("sequelize");
const Op = Sequelize.Op;
const { getToken, verifyToken } = require('../passport/jwtHandler');

//Division
router.get("/division", async (req, res) => {
  try {
    let result = await division.findAll({
      order: [["divisionName"]],
    });
    res.json({
      api_result: constants.kResultOk,
      result,
    });
  } catch (error) {
    res.json({
      api_result: constants.kResultNok,
      error,
    });
  }
});

router.get('/divisionName/:divisionCode', async (req, res) => {
  try {
    const { divisionCode } = req.params
    let result = await division.findOne({
      where: { divisionCode },
    });
    res.json({
      api_result: constants.kResultOk,
      result,
    });
  } catch (error) {
    res.json({
      api_result: constants.kResultNok,
      error,
    });
  }
})

router.get("/division/keyword/:keyword", async (req, res) => {
  try {
    const { keyword } = req.params;
    let result = await division.findAll({
      where: {
        [Op.or]: [
          { divisionCode: { [Op.like]: `%${keyword}%` } },
          { divisionName: { [Op.like]: `%${keyword}%` } },
          { PlantCode: { [Op.like]: `%${keyword}%` } },
        ],
      },
      order: [["updatedAt", "DESC"]],
    });
    res.json({
      api_result: constants.kResultOk,
      result,
    });
  } catch (error) {
    res.json({
      api_result: constants.kResultNok,
      error,
    });
  }
});

router.post("/division", verifyToken, async (req, res) => {
  try {
    // encrypt password
    let result = await division.create(req.body);
    res.json({
      result,
      api_result: constants.kResultOk,
    });
  } catch (error) {
    res.json({
      error,
      api_result: constants.kResultNok,
    });
  }
});

router.put("/division", verifyToken, async (req, res) => {
  try {
    await division.update(req.body, {
      where: { divisionCode: req.body.divisionCode },
    });

    res.json({
      // result ,
      api_result: constants.kResultOk,
    });
  } catch (error) {
    res.json({
      api_result: constants.kResultNok,
      error,
    });
  }
});

router.delete("/division", verifyToken, async (req, res) => {
  try {
    let result = await division.destroy({
      where: { divisionCode: req.body.divisionCode },
    });
    res.json({
      api_result: constants.kResultOk,
    });
  } catch (error) {
    res.json({
      api_result: constants.kResultNok,
      error,
    });
  }
});

// jobs_process_master
router.get("/jobs_process_master", async (req, res) => {
  try {
    let result = await jobs_process_master.findAll({
      order: [["piority", 'ASC']],
    });
    res.json({
      api_result: constants.kResultOk,
      result,
    });
  } catch (error) {
    res.json({
      api_result: constants.kResultNok,
      error,
    });
  }
});

router.get("/jobs_process_master/keyword/:keyword", async (req, res) => {
  try {
    const { keyword } = req.params;
    let result = await jobs_process_master.findAll({
      where: {
        [Op.or]: [
          { jobProcess: { [Op.like]: `%${keyword}%` } },
          { piority: { [Op.like]: `%${keyword}%` } },
        ],
      },
      order: [["updatedAt", "DESC"]],
    });
    res.json({
      api_result: constants.kResultOk,
      result,
    });
  } catch (error) {
    res.json({
      api_result: constants.kResultNok,
      error,
    });
  }
});

router.post("/jobs_process_master", async (req, res) => {
  try {
    // encrypt password
    let result = await jobs_process_master.create(req.body);
    res.json({
      result,
      api_result: constants.kResultOk,
    });
  } catch (error) {
    res.json({
      error,
      api_result: constants.kResultNok,
    });
  }
});

router.put("/jobs_process_master", verifyToken, async (req, res) => {
  try {
    let result = await jobs_process_master.update(req.body, {
      where: { jobProcess: req.body.jobProcess },
    });

    res.json({
      result,
      api_result: constants.kResultOk,
    });
  } catch (error) {
    res.json({
      api_result: constants.kResultNok,
      error,
    });
  }
});

router.delete("/jobs_process_master", verifyToken, async (req, res) => {
  try {
    let result = await jobs_process_master.destroy({
      where: { jobProcess: req.body.jobProcess },
    });
    res.json({
      result,
      api_result: constants.kResultOk,
    });
  } catch (error) {
    res.json({
      api_result: constants.kResultNok,
      error,
    });
  }
});

module.exports = router;
