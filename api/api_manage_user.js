const express = require("express");
const router = express.Router();
const user = require("./../model/user");
const bcrypt = require("bcryptjs");
const constants = require("./../constant/constant");
const Sequelize = require("sequelize");
const Op = Sequelize.Op;
const mailer = require("nodemailer");

router.get("/user", async (req, res) => {
  try {
    let result = await user.findAll({
      attributes: ['username', 'empNumber', 'levelUser', 'divisionCode', 'email', 'lastLogOn'],
      order: [["lastLogOn", "DESC"]],
    });

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

router.get("/user/:username", async (req, res) => {
  try {
    const { username } = req.params;
    let result = await user.findOne({
      where: {
        username: username,
      },
    });
    res.json({
      result,
      api_result: constants.kResultOk,
    });
  } catch (error) {
    res.json({
      result: JSON.stringify(error),
      api_result: constants.kResultNok,
    });
  }
});

router.get("/find_user/:keyword", async (req, res) => {
  try {
    const { keyword } = req.params;
    let result = await user.findAll({
      where: {
        [Op.or]: [
          { username: { [Op.like]: `%${keyword}%` }, },
          { empNumber: { [Op.like]: `%${keyword}%` } },
          { divisionCode: { [Op.like]: `%${keyword}%` } },
          { email: { [Op.like]: `%${keyword}%` } },
        ],
      },
      attributes: ['username', 'empNumber', 'levelUser', 'divisionCode', 'email', 'lastLogOn'],
      order: [["lastLogOn", "DESC"]],
    });
    res.json({
      result: result,
      api_result: constants.kResultOk,
    });
  } catch (error) {
    res.json({
      result: JSON.stringify(error),
      api_result: constants.kResultNok,
    });
  }
});

router.put("/user", async (req, res) => {
  try {

    //check updater class
    let { updater } = req.body
    let userLevel = await user.findOne({ where: { username: updater } })
    if (userLevel.levelUser === 'admin' || userLevel.levelUser === 'MIC_Head') {



      let updateDetail = {}
      if (req.body.empNumber) {
        updateDetail.empNumber = req.body.empNumber
      }
      if (req.body.levelUser) {
        updateDetail.levelUser = req.body.levelUser
      }
      if (req.body.email) {
        updateDetail.email = req.body.email
      }

      await user.update(updateDetail, { where: { username: req.body.username } });

      res.json({
        // result ,
        api_result: constants.kResultOk,
      });
    } else {
      res.json({
        api_result: constants.kResultNok,
        error: 'permission denied',
      });
    }
  } catch (error) {
    res.json({
      api_result: constants.kResultNok,
      error,
    });
  }
});

router.put("/changeLevel", async (req, res) => {
  try {
    //check updater class
    let { updater, username, levelUser } = req.body
    let userLevel = await user.findOne({ where: { username: updater } })
    if (userLevel.levelUser === 'admin' || userLevel.levelUser === 'MIC_Head') {
      let updateDetail = { levelUser }
      await user.update(updateDetail, { where: { username } });

      res.json({
        // result ,
        api_result: constants.kResultOk,
      });
    } else {
      res.json({
        api_result: constants.kResultNok,
        error: 'permission denied',
      });
    }
  } catch (error) {
    res.json({
      api_result: constants.kResultNok,
      error,
    });
  }
});

router.delete("/user", async (req, res) => {
  try {
    let { username, updater } = req.body
    const userLevel = await user.findOne({ where: { username: updater } })
    if (userLevel.levelUser === 'admin' || userLevel.levelUser === 'MIC_Head') {
      let result = await user.destroy({
        where: { username },
      });
      res.json({
        result,
        api_result: constants.kResultOk,
      });
    } else {
      res.json({
        api_result: constants.kResultNok,
        error: 'permission denied',
      });
    }
  } catch (error) {
    res.json({
      api_result: constants.kResultNok,
      error,
    });
  }
});

router.patch('/user', async (req, res) => {
  try {
    const { username, oldPassword, newPassword } = req.body
    console.log(username);
    const userData = await user.findOne({ where: { username } })
    const password = await bcrypt.hashSync(newPassword, 8);

    if (bcrypt.compareSync(oldPassword, userData.password)) {
      //Update new password
      let result = await user.update({ password }, { where: { username } })
      res.json({
        api_result: constants.kResultOk,
        result,
      });
    } else {
      res.json({
        api_result: constants.kResultNok,
        error: 'Password old password mistake!',
      });
    }

  } catch (error) {
    console.log(error);
    res.json({
      api_result: constants.kResultNok,
      error,
    });
  }
})


module.exports = router;
