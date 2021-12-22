const { Sequelize, DataTypes } = require("sequelize");
const database = require("./../instance/user_instance");

const user = database.define(
  "user",
  {
    // attributes
    username: {
      type: Sequelize.STRING,
      allowNull: false,
      primaryKey: true,
      validate: {
        notEmpty: {
          args: true,
          msg: "Required",
        },
        len: {
          args: [4, 20],
          msg: "String length is not in this range",
        },
      },
    },
    empNumber: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: {
          args: true,
          msg: "Required",
        },
        // is: {
        //   args: ["^[a-z]+$", "i"],
        //   msg: "Only letters allowed",
        // },
        len: {
          args: [4, 6],
          msg: "String length is not in this range",
        },
      },
    },
    password: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    levelUser: {
      type: Sequelize.STRING,
      defaultValue: "guest",
      allowNull: false,
    },
    divisionCode: {
      type: Sequelize.STRING,
      defaultValue: "",
      allowNull: false,
      validate: {
        notEmpty: {
          args: true,
          msg: "Required",
        },
        len: {
          args: [4, 4],
          msg: "String length is not in this range (4 digit)",
        },
      },
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: {
          msg: "Must be a valid email address",
        }
      }
    },
    registerKey: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lastLogOn: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW,
    },
    lastWebsite: {
      type: Sequelize.STRING,
      defaultValue: "",
    },
  },
  {
    //option
  }
);

(async () => {
  await user.sync({ force: false });
})();

module.exports = user;
