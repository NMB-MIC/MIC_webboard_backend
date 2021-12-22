const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const constants = require("./../constant/constant");
const Sequelize = require("sequelize");
const { getToken, verifyToken } = require('../passport/jwtHandler');
const mailer = require("nodemailer");
const moment = require('moment');

//Models
const user = require("./../model/user");

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    let result = await user.findOne({ where: { username } });
    if (result != null) {
      if (
        result.levelUser == "user" ||
        result.levelUser == "power" ||
        result.levelUser == "admin" ||
        result.levelUser == "MIC_Member" ||
        result.levelUser == "MIC_Head"
      ) {
        if (bcrypt.compareSync(password, result.password)) {
          //update last logon
          await user.update(
            { lastLogOn: moment().format('YYYY-MM-DD HH:mm:ss') },
            { where: { username } })
          var token = await getToken({ username })
          res.json({
            result,
            token,
            api_result: constants.kResultOk,
          });
        } else {
          console.log("Incorrect password");
          res.json({
            error: "Incorrect password",
            api_result: constants.kResultNok,
          });
        }
      } else {
        console.log("Please validate email");
        res.json({
          error: "Please validate email",
          api_result: constants.kResultNok,
        });
      }
    } else {
      console.log("Username not found please register");
      res.json({
        error: "Username not found please register",
        api_result: constants.kResultNok,
      });
    }
  } catch (error) {
    console.log(error);
    res.json({
      error,
      api_result: constants.kResultNok,
    });
  }
});

router.post("/register", async (req, res) => {
  try {
    req.body.levelUser = "guest"
    
    // encrypt password
    req.body.password = bcrypt.hashSync(req.body.password, 8);

    //create registerKey
    const registerKey = makeid(10);
    req.body.registerKey = registerKey;

    //Insert to db
    let result = await user.create(req.body);

    try {
      var smtp = {
        host: "10.121.1.22", //set to your host name or ip
        port: 25, //25, 465, 587 depend on your
        secure: false, // use SSL
      };

      var smtpTransport = mailer.createTransport(smtp);
      var mail = {
        from: "mic_messenger@minebea.co.th", //from email (option)
        to: req.body.email, //to email (require)
        subject: "Please verify your email", //subject
        html:
          `<p>Please click below this link to verify your email</p>
        <a href='${constants.frontEndIP}verifyEmail/` +
          req.body.username +
          `/` +
          registerKey +
          `'>Click</a>`,
      };

      await smtpTransport.sendMail(mail, function (error, _response) {
        smtpTransport.close();
        if (error) {
          //error handler
          console.log(error);
          res.json({
            error,
            api_result: constants.kResultNok,
          });
        } else {
          res.json({
            result,
            api_result: constants.kResultOk,
          });
        }
      });
    } catch (error) {
      console.log(error);
      res.json({
        error,
        api_result: constants.kResultNok,
      });
    }

  } catch (error) {
    console.log(error);
    res.json({
      error,
      api_result: constants.kResultNok,
    });
  }
});

router.patch("/forgot", async (req, res) => {
  try {

    const { email } = req.body
    const newPassword = await makeid(12)
    const password = await bcrypt.hashSync(newPassword, 8);
    await user.update({ password }, { where: { email } })
    let result = await user.findOne({ where: { email } });
    try {
      var smtp = {
        host: "10.121.1.22", //set to your host name or ip
        port: 25, //25, 465, 587 depend on your
        secure: false, // use SSL
      };

      var smtpTransport = mailer.createTransport(smtp);
      var mail = {
        from: "mic_messenger@minebea.co.th", //from email (option)
        to: result.email, //to email (require)
        subject: "<Forgot password> re-created your new password", //subject
        html: `
        <p>Username : ${result.username}</p>
        <p>new password : ${newPassword}</p>
        <p>Please use this new password to log in again</p>`,
      };

      await smtpTransport.sendMail(mail, function (error, _response) {
        smtpTransport.close();
        if (error) {
          //error handler
          console.log(error);
          res.json({
            error,
            api_result: constants.kResultNok,
          });
        } else {
          res.json({
            api_result: constants.kResultOk,
          });
        }
      });
    } catch (error) {
      console.log(error);
      res.json({
        error,
        api_result: constants.kResultNok,
      });
    }
  } catch (error) {
    console.log(error);
    res.json({
      error,
      api_result: constants.kResultNok,
    });
  }
})

router.get("/verifyEmail/:username&:registerKey", async (req, res) => {
  try {
    console.log("verify");
    const { username, registerKey } = req.params;
    let result = await user.update(
      { levelUser: "user" },
      { where: { username, registerKey } }
    );

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


function makeid(length) {
  var result = "";
  var characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

module.exports = router;
