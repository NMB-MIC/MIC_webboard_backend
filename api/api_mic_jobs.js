const express = require("express");
const router = express.Router();
const constants = require("./../constant/constant");

const formidable = require("formidable");
const fs = require("fs");

const mic_jobs = require('../model/mic_jobs');
const user = require("./../model/user");
const jobs_process_master = require('./../model/jobs_process_master');
const job_progressive = require('../model/jobProgressive');
const sequelize = require("sequelize");

const mailer = require("nodemailer");
// mic_jobs.belongsToMany(division, { through: 'divisionCode' });

router.get('/mic_job/:jobStatus', async (req, res) => {
    try {
        const { jobStatus } = req.params
        let result = await mic_jobs.sequelize.query(`
SELECT [job_id]
      ,[jobCategory]
      ,[jobName]
      ,[jobDetail]
      ,[jobObjective]
      ,[KickOffDate]
      ,[FinishDate]
      ,[divisionName]
      ,[jobProcess]
      ,[fileType]
      ,A.[createdAt]
      ,A.[updatedAt]
  FROM [MIC_JobProgressive].[dbo].[mic_jobs] A join [MIC_JobProgressive].[dbo].[divison_masters] B
  on A.[divisionCode] = B.[divisionCode]
  where [jobStatus] = '` + jobStatus + `'
  order by A.[updatedAt]`)

        res.json({ result: result[0], api_result: constants.kResultOk })
    } catch (error) {
        console.log(error);
        res.json({ error, api_result: constants.kResultNok })
    }
})

router.get('/mic_job_detail/:job_id', async (req, res) => {
    try {
        const { job_id } = req.params
        let result = await mic_jobs.sequelize.query(`
    SELECT [job_id]
      ,[jobCategory]
      ,[jobName]
      ,[jobDetail]
      ,[jobObjective]
      ,[KickOffDate]
      ,[FinishDate]
      ,A.[divisionCode]
	  ,B.[divisionName]
      ,[fileType]
      ,[jobStatus]
      ,[requestBy]
      ,[jobProcess]
      ,A.[createdAt]
      ,A.[updatedAt]
  FROM [MIC_JobProgressive].[dbo].[mic_jobs] A join [MIC_JobProgressive].[dbo].[divison_masters] B
  on  A.divisionCode = B.divisionCode
  where [job_id] = '${job_id}'`)
        res.json({ result: result[0][0], api_result: constants.kResultOk })
    } catch (error) {
        console.log(error);
        res.json({ error, api_result: constants.kResultNok })
    }
})

router.get('/mic_job_group_status/', async (req, res) => {
    try {
        let result = await mic_jobs.findAll({
            attributes: ['jobStatus', [sequelize.fn('count', sequelize.col('job_id')), 'JobCount']],
            group: ["jobStatus"]
        })

        res.json({ result, api_result: constants.kResultOk })
    } catch (error) {
        console.log(error);
        res.json({ error, api_result: constants.kResultNok })
    }
})

router.post('/mic_job', async (req, res) => {
    try {
        const form = new formidable.IncomingForm();
        form.parse(req, async (error, fields, files) => {
            console.log("error : " + JSON.stringify(error));
            console.log("Fields : " + JSON.stringify(fields));
            console.log("Files : " + JSON.stringify(files));
            // console.log("Binary : " + base64_encode(files.file.path));

            var data = {}
            console.log(files.fileDetail);
            try {
                let job_create = {}
                if (files.fileDetail == undefined) {
                    data = {
                        jobCategory: fields.jobCategory,
                        jobName: fields.jobName,
                        jobDetail: fields.jobDetail,
                        jobObjective: fields.jobObjective,
                        KickOffDate: fields.kickOffDate,
                        FinishDate: fields.finishDate,
                        divisionCode: fields.divisionCode,
                        requestBy: fields.requestBy
                    };
                    job_create = await mic_jobs.create(data);

                } else {
                    data = {
                        jobCategory: fields.jobCategory,
                        jobName: fields.jobName,
                        jobDetail: fields.jobDetail,
                        jobObjective: fields.jobObjective,
                        KickOffDate: fields.kickOffDate,
                        FinishDate: fields.finishDate,
                        divisionCode: fields.divisionCode,
                        fileDetail: await fs.readFileSync(files.fileDetail.path),
                        fileType: files.fileDetail.type,
                        requestBy: fields.requestBy
                    };
                    job_create = await mic_jobs.create(data);
                    //update job progressive

                    fs.unlinkSync(files.fileDetail.path);
                }

                let jobProgressive = {
                    job_id: parseInt(job_create.job_id),
                    progressiveName: 'Create job',
                    progressiveDetail: 'This job has been created',
                    progressiveType: 'web',
                    updateBy: fields.requestBy,
                }
                job_progressive.create(jobProgressive);

                //send email to approver
                const userDetail = await user.findOne({ where: { empNumber: fields.requestBy } })
                const HeadDivDetail = await user.findOne({ where: { levelUser: 'MIC_Head' } })

                var smtp = {
                    host: "10.121.1.22", //set to your host name or ip
                    port: 25, //25, 465, 587 depend on your
                    secure: false, // use SSL
                };
                var smtpTransport = mailer.createTransport(smtp);
                var mail = {
                    from: "mic_messenger@minebea.co.th", //from email (option)
                    to: HeadDivDetail.email, //to email (Head div)
                    cc: userDetail.email, //to email (require)
                    subject: "Please check this job", //subject
                    html:
                        `<p>Please click below this link to check this project</p>
                 <a href='${constants.frontEndIP}mic_jobs/job_detail/${job_create.job_id}'>Click</a>`,
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
                // res.json({
                //     api_result: constants.kResultOk,
                // });
            } catch (error) {
                console.log(error);
                res.json({
                    error,
                    api_result: constants.kResultNok,
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
})

router.patch('/mic_job_approve', async (req, res) => {
    try {
        const { job_id, jobStatus } = req.body
        let result = await mic_jobs.update({ jobStatus }, { where: { job_id } })
        const jobDetail = await mic_jobs.findOne({ where: { job_id } })
        const userDetail = await user.findOne({ where: { empNumber: jobDetail.requestBy } })
        const MIC_Head = await user.findOne({ where: { levelUser: 'MIC_Head' } })

        //update job progressive
        let jobProgressive = {
            job_id: parseInt(job_id),
            progressiveName: 'Approved job ',
            progressiveDetail: 'This job has been approved',
            progressiveType: 'web',
            updateBy: MIC_Head.empNumber,
        }
        await job_progressive.create(jobProgressive);

        //send email to project owner
        var smtp = {
            host: "10.121.1.22", //set to your host name or ip
            port: 25, //25, 465, 587 depend on your
            secure: false, // use SSL
        };
        var smtpTransport = mailer.createTransport(smtp);
        var mail = {
            from: "mic_messenger@minebea.co.th", //from email (option)
            to: userDetail.email, //to email (require)
            subject: "Your job has been approved", //subject
            html:
                `<p>Please click below this link to check your project status</p>
                 <a href='${constants.frontEndIP}mic_jobs/job_detail/${job_id}'>Click</a>`,
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
        res.json({ error, api_result: constants.kResultNok })
    }
})

router.patch('/mic_job', async (req, res) => {
    try {
        const { job_id } = req.body
        let result = await mic_jobs.update(req.body, { where: { job_id } })
        res.json({ result, api_result: constants.kResultOk })
    } catch (error) {
        console.log(error);
        res.json({ error, api_result: constants.kResultNok })
    }
})

router.put('/mic_job', async (req, res) => {
    try {
        const form = new formidable.IncomingForm();
        form.parse(req, async (error, fields, files) => {
            console.log("error : " + JSON.stringify(error));
            console.log("Fields : " + JSON.stringify(fields));
            console.log("Files : " + JSON.stringify(files));

            const { job_id } = fields

            //check un match data
            const oldData = await mic_jobs.findOne({ where: { job_id } })
            let progressiveDetail = ''
            if (oldData.jobName != fields.jobName) {
                progressiveDetail += 'Change job name, '
            }
            if (oldData.jobStatus != fields.jobStatus) {
                progressiveDetail += 'Change job status, '
            }
            if (oldData.jobCategory != fields.jobCategory) {
                progressiveDetail += 'Change job category, '
            }
            if (oldData.jobDetail != fields.jobDetail) {
                progressiveDetail += 'Change job detail, '
            }
            if (oldData.jobObjective != fields.jobObjective) {
                progressiveDetail += 'Change job objective, '
            }
            if (oldData.KickOffDate != fields.kickOffDate) {
                progressiveDetail += 'Change kick off date, '
            }
            if (oldData.FinishDate != fields.finishDate) {
                progressiveDetail += 'Change finish date, '
            }

            if (files.fileDetail == undefined) {
                data = {
                    jobCategory: fields.jobCategory,
                    jobName: fields.jobName,
                    jobStatus: fields.jobStatus,
                    jobDetail: fields.jobDetail,
                    jobObjective: fields.jobObjective,
                    KickOffDate: fields.kickOffDate,
                    FinishDate: fields.finishDate,
                };
                await mic_jobs.update(data, { where: { job_id } });

            } else {
                data = {
                    jobCategory: fields.jobCategory,
                    jobName: fields.jobName,
                    jobDetail: fields.jobDetail,
                    jobStatus: fields.jobStatus,
                    jobObjective: fields.jobObjective,
                    KickOffDate: fields.kickOffDate,
                    FinishDate: fields.finishDate,
                    fileDetail: await fs.readFileSync(files.fileDetail.path),
                    fileType: files.fileDetail.type,
                };
                progressiveDetail += 'Change job file detail.'

                await mic_jobs.update(data, { where: { job_id } });
                //update job progressive

                fs.unlinkSync(files.fileDetail.path);
            }

            //update job progressive
            let jobProgressive = {
                job_id: parseInt(job_id),
                progressiveName: 'Edit job detail',
                progressiveDetail,
                progressiveType: 'web',
                updateBy: fields.updateBy,
            }
            await job_progressive.create(jobProgressive);

            res.json({ api_result: constants.kResultOk })
        })
    } catch (error) {
        console.log(error);
        res.json({ error, api_result: constants.kResultNok })
    }
})

router.get('/job_score/:job_id', async (req, res) => {
    try {
        const { job_id } = req.params
        let jobDetail = await mic_jobs.findOne({
            attributes: ['jobProcess'],
            where: { job_id }
        })

        let jobProcessDetail = await jobs_process_master.findAll({
            order: [["piority", 'ASC']],
        });

        var totalWeight = 0
        var currentWeight = 0

        for (let index = 0; index < jobProcessDetail.length; index++) {
            const item = jobProcessDetail[index];
            totalWeight += item.jobWeight
            if (index <= jobDetail.jobProcess) {
                currentWeight += item.jobWeight
            }
        }

        res.json({ result: parseFloat((currentWeight / totalWeight).toFixed(4)), api_result: constants.kResultOk })
    } catch (error) {
        console.log(error);
        res.json({ error, api_result: constants.kResultNok })
    }
})


module.exports = router;
