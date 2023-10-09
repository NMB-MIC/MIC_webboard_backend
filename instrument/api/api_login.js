const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const employee = require("../models/hr_employee_model");


router.post("/login", async (req, res) => {
  try {
    let { employee_id, password } = req.body;
    console.log(req.body.employee_id);
    let result = await employee.findOne({ where: { employee_id: employee_id } });
    console.log(result.name_eng);
    //Condition user checking
    // Check username exist in system
    
    result != null
      ? // Check authentication level of user
        result.level_sys == "ADMIN" ||
        result.level_sys == "SUPERVISOR" ||
        result.level_sys == "STAFF"
        ? // Check password correctly match with user

      
          bcrypt.compareSync(password, result.password)
          ? res.json({ result, message: "OK" })
          : res.json({ result, message: "Incorrect Username or Password" })
        : // Authentications not allow from this user
          res.json({
            result,
            message: "Your Permission Not Allow, Please Contact Support",
          })
      : res.json({ result, message: "Incorrect Username or Password" });
  } catch (error) {
    return res.json({
      result: "Failed",
      message: error.message,
    });
  }
});

router.post("/register", async (req, res) => {
  try {
    const {
      employee_id,
      name_eng,
      password,
      position,
      section,
      department,
      level_sys,
      
    } = req.body;

    console.log(req.body)

    const result = await employee.create({
      employee_id: employee_id,
      name_eng: name_eng,
      position: position,
      section: section,
      department: department,
      level_sys: level_sys,
      password: bcrypt.hashSync(password, 8),
     
     
    });
    res.json({
        api_result: "OK",
      message: JSON.stringify(result),
    });
  } catch (error) {
    return res.json({
        api_result: "Failed",
      message: error.message,
    });
  }
});

router.post("/deleteUser", async (req, res) => {
  try {
    const { employee_id } = req.body;
    const result = await employee.destroy({
      where: { employee_id: employee_id },
    });
    res.json({
      result: "OK",
      message: JSON.stringify(result),
    });
  } catch (error) {
    return res.json({
      result: "Failed",
      message: error.message,
    });
  }
});

module.exports = router;
