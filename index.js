const express = require('express');
const puppeteer = require('puppeteer-core');
const chrome = require('chrome-aws-lambda');
const cheerio = require('cheerio');
const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.json());

async function login(username, password) {
    let options = {
        args: [...chrome.args, "--hide-scrollbars", "--disable-web-security"],
        defaultViewport: chrome.defaultViewport,
        executablePath: await chrome.executablePath,
        headless: true,
        ignoreHTTPSErrors: true,
    };
    const loginLink = `https://homeaccess.katyisd.org/HomeAccess/Account/LogOn?ReturnUrl=%2fHomeAccess%2fClasses%2fClasswork`;

    try {
        let browser = await puppeteer.launch(options);
        let page = await browser.newPage();
        await page.goto(loginLink, { waitUntil: 'networkidle0' });
        // const requestVerificationToken = await page.evaluate(() => {
        //     const input = document.querySelector('input[name="__RequestVerificationToken"]');
        //     return input ? input.value : '';
        // });

        // const loginFields = {
        //     '__RequestVerificationToken': requestVerificationToken,
        //     'SCKTY00328510CustomEnabled': 'True',
        //     'SCKTY00436568CustomEnabled': 'True',
        //     'Database': '10',
        //     'VerificationOption': 'UsernamePassword',
        //     'LogOnDetails.UserName': username,
        //     'tempUN': '',
        //     'tempPW': '',
        //     'LogOnDetails.Password': password,
        // };

        // for (const [key, value] of Object.entries(loginFields)) {
        // await page.type(`input[name="${key}"]`, value);
        // }

        // await Promise.all([
        //     page.click('button[type="submit"]'),
        //     page.waitForNavigation({ waitUntil: 'networkidle0' }),
        // ]);

        // const currentUrl = await page.url();
        // if (currentUrl.includes('LogOn')) {
        //     await browser.close();
        //     throw new Error('Invalid username or password');
        // }
        // await page.goto(`https://homeaccess.katyisd.org/HomeAccess/Content/Student/Assignments.aspx`, { waitUntil : 'networkidle0'});
        const pageContent = await page.content();
        return pageContent;
    } catch (error) {
        await browser.close();
        throw error;
    }
}

app.get("/", (req, res) => res.send("Express on Vercel"));

app.get('/api/home', (req, res) => {
    res.json({ message: 'Welcome to the Home Access Center API!', routes : '/api/home, /api/getGrades' });
});

app.get('/api/getGrades', async (req, res) => {
    const { username, password } = req.query;
    let pageContent = await login(username, password);
    res.json( {success : true, content : pageContent} );
    // console.log(pageContent);
    // const $ = cheerio.load(pageContent);
    // const classNames = [];
    // const grades = [];

    // const assignmentClasses = $('.AssignmentClass');

    // assignmentClasses.each((i, elem) => {
    //     const $elem = $(elem);
    //     const name = $elem.find('.sg-header a').text().trim();
    //     classNames.push(name);

    //     const $categories = $(`#plnMain_rptAssigmnetsByCourse_lblCategories_${i}`);
    //     const classGrades = [];

    //     $categories.find('.sg-asp-table-data-row').each((j, elem2) => {
    //         const $elem2 = $(elem2);
    //         const category = [];
    //         $elem2.find('td').each((k, elem3) => {
    //             if (k !== 0) {
    //                 category.push($(elem3).text().trim());
    //             }
    //         });
    //         classGrades.push(category);
    //     });

    //     grades.push(classGrades);
    // });

    // res.json({ success: true, names: classNames, grades: grades });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;