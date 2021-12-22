const express = require("express");
const app = express();
const path = require("path");
const bodyParser = require("body-parser");
const cors = require("cors");
const json2xls = require('json2xls');
const { getToken, verifyToken } = require('./passport/jwtHandler');
const cluster = require('cluster');
const cCPUs = require('os').cpus().length;

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb' }));
app.use(bodyParser.json({ limit: '100mb' }));
app.use(bodyParser.urlencoded({ limit: "100mb", extended: false }));
app.use(json2xls.middleware);
app.use(express.static(path.join(__dirname, "./files")));
app.use(cors());


app.use("/api/mic_jobProgressive/authen/", require("./api/api_authen"));
app.use("/api/mic_jobProgressive/manage_user/", verifyToken, require("./api/api_manage_user"));
app.use("/api/mic_jobProgressive/manage_master/", require("./api/api_manage_master"));
app.use("/api/mic_jobProgressive/Jobs/", verifyToken, require("./api/api_mic_jobs"));
app.use("/api/mic_jobProgressive/JobProgressive/", verifyToken, require("./api/api_job_progressive"));
app.use("/api/mic_jobProgressive/qc_control_chart/", verifyToken, require("./api/api_quality_control_chart"));
app.use("/api/mic_jobProgressive/getFiles/", require("./api/api_getFile"));
app.use("/api/mic_jobProgressive/alliance_website/", require("./api/api_alliance_website"));

if (cluster.isMaster) {
  // Create a worker for each CPU
  for (var i = 0; i < cCPUs; i++) {
    cluster.fork();
  }

  cluster.on('online', function (worker) {
    console.log('Worker ' + worker.process.pid + ' is online.');
  });
  cluster.on('exit', function (worker, code, signal) {
    console.log('worker ' + worker.process.pid + ' died.');
  });
} else {
  app.listen(5001, () => {
    console.log("Backend is running...");
  });
}

