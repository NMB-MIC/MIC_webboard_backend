const express = require("express");
const router = express.Router();
const constants = require("./../constant/constant");
const allianceWebsite = require("./../model/allianceWebsite")

router.get('/allianceWebsite/', async (req, res) => {
    try {
        const result = await allianceWebsite.findAll()
        res.json({ result, api_result: constants.kResultOk })
    } catch (error) {
        log.error(error)
        res.json({ error, api_result: constants.kResultNok })
    }
})

router.post('/allianceWebsite/', async (req, res) => {
    try {
        const result = await allianceWebsite.create(req.body)
        res.json({ result, api_result: constants.kResultOk })
    } catch (error) {
        log.error(error)
        res.json({ error, api_result: constants.kResultNok })
    }
})

router.patch('/allianceWebsite/', async (req, res) => {
    try {
        const { websiteName } = req.body
        const result = await allianceWebsite.update(req.body, { where: { websiteName } })
        res.json({ result, api_result: constants.kResultOk })
    } catch (error) {
        log.error(error)
        res.json({ error, api_result: constants.kResultNok })
    }
})


router.delete('/allianceWebsite/', async (req, res) => {
    try {
        const { websiteName } = req.body
        const result = await allianceWebsite.destroy({ where: { websiteName } })
        res.json({ result, api_result: constants.kResultOk })
    } catch (error) {
        log.error(error)
        res.json({ error, api_result: constants.kResultNok })
    }
})


module.exports = router;