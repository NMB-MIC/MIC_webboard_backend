const express = require("express");
const router = express.Router();
const constants = require("./../constant/constant");

const formidable = require("formidable");
const fs = require("fs");

const mic_jobs = require('../model/mic_jobs');
const job_progressive = require('../model/jobProgressive');
const user = require("./../model/user");

router.get('/jobProgressive/:job_id', async (req, res) => {
    try {
        let { job_id } = req.params
        let result = await job_progressive.findAll({
            where: { job_id },
            attributes: ['progressive_id'
                , 'job_id'
                , 'progressiveName'
                , 'progressiveType'
                , 'progressiveDetail'
                // , 'fileDetail'
                , 'fileType'
                , 'updateBy'
                , 'createdAt'
                , 'updatedAt']
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
})

router.post('/jobProgressive/', async (req, res) => {
    try {
        req.body.progressiveType = 'web'
        let result = await job_progressive.create(req.body);
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
})

router.post('/jobProgressiveUser/', async (req, res) => {
    try {
        const form = new formidable.IncomingForm();
        form.parse(req, async (error, fields, files) => {
            console.log("error : " + JSON.stringify(error));
            console.log("Fields : " + JSON.stringify(fields));
            console.log("Files : " + JSON.stringify(files));

            const { job_id, progressiveName, progressiveDetail, updateBy } = fields

            var data = {}
            if (files.fileDetail == undefined) {
                data = {
                    job_id,
                    progressiveName,
                    progressiveType: 'user',
                    progressiveDetail,
                    updateBy,
                }
                await job_progressive.create(data);
            } else {
                data = {
                    job_id,
                    progressiveName,
                    progressiveType: 'user',
                    progressiveDetail,
                    updateBy,
                    fileDetail: await fs.readFileSync(files.fileDetail.path),
                    fileType: files.fileDetail.type,
                }
                await job_progressive.create(data);
                fs.unlinkSync(files.fileDetail.path);
            }
            res.json({
                // result,
                api_result: constants.kResultOk,
            });
        })
    } catch (error) {
        res.json({
            api_result: constants.kResultNok,
            error,
        });
    }
})

router.delete('/jobProgressive/', async (req, res) => {
    try {
        const { progressive_id } = req.body
        let result = await job_progressive.destroy({ where: { progressive_id } });
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
})

module.exports = router;
