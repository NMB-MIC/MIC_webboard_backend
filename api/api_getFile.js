const express = require("express");
const router = express.Router();
const constants = require("./../constant/constant");

const formidable = require("formidable");
const fs = require("fs");

const mic_jobs = require('../model/mic_jobs');
const job_progressive = require('../model/jobProgressive');
const user = require("./../model/user");
const jobs_process_master = require('./../model/jobs_process_master');

router.get("/mic_job_file/:job_id", async (req, res) => {
    try {
        const { job_id } = req.params;
        let result = await mic_jobs.findOne({ where: { job_id } });
        // res.setHeader('Content-Disposition', 'attachment; filename=' + result.jobName);
        res.type(result.fileType);
        res.end(result.fileDetail);
    } catch (error) {
        res.json({
            error,
            message: constants.kResultNok,
        });
    }
});


router.get('/jobProgressiveFile/:progressive_id', async (req, res) => {
    try {
        let { progressive_id } = req.params
        let result = await job_progressive.findOne({
            where: { progressive_id },
            attributes: ['fileDetail', 'fileType']
        });
        res.type(result.fileType);
        res.end(result.fileDetail);
    } catch (error) {
        console.log(error);
        res.json({
            api_result: constants.kResultNok,
            error,
        });
    }
})

module.exports = router;
