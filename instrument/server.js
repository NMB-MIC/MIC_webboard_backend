const express = require("express");
const app = express();
const path = require("path");
const bodyParser = require("body-parser");
const cors = require("cors");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "./filclses")));
app.use(cors());

app.use(express.json());

app.use("/api/authen", require("./api/api_login"));

app.use("/api/api_counter", require("./api/api_counter")); 
app.use("/api/api_spc", require("./api/api_spc")); 
app.use("/api/api_statusMMS", require("./api/api_statusMMS")); 


app.listen(5011, () => {
 
  console.log("server is up and listening on port 5011");
});




////// Set powershell runscript once before using Nodemon
////---- Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass ----////