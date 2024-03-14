const express = require('express');
const { chromium } = require('@playwright/chromium');
const cheerio = require('cheerio');
const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.json());

async function login(username, password) {
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    const loginLink = `https://homeaccess.katyisd.org/HomeAccess/Account/LogOn?ReturnUrl=%2fHomeAccess%2fClasses%2fClasswork`;
    try {
        await page.goto(loginLink);
        const requestVerificationToken = await page.evaluate(() => {
            const input = document.querySelector('input[name="__RequestVerificationToken"]');
            return input ? input.value : '';
        });

        await page.evaluate(({ username, password, requestVerificationToken }) => {
            const logonDetailsUserName = document.querySelector('input[name="LogOnDetails.UserName"]');
            const logonDetailsPassword = document.querySelector('input[name="LogOnDetails.Password"]');
            const sckty00328510CustomEnabled = document.querySelector('input[name="SCKTY00328510CustomEnabled"]');
            const sckty00436568CustomEnabled = document.querySelector('input[name="SCKTY00436568CustomEnabled"]');
            const database = document.querySelector('input[name="Database"]');
            const verificationOption = document.querySelector('input[name="VerificationOption"]');

            if (logonDetailsUserName) logonDetailsUserName.value = username;
            if (logonDetailsPassword) logonDetailsPassword.value = password;
            if (sckty00328510CustomEnabled) sckty00328510CustomEnabled.value = 'True';
            if (sckty00436568CustomEnabled) sckty00436568CustomEnabled.value = 'True';
            if (database) database.value = '10';
            if (verificationOption) verificationOption.value = 'UsernamePassword';

            const requestVerificationTokenInput = document.querySelector('input[name="__RequestVerificationToken"]');
            if (requestVerificationTokenInput) requestVerificationTokenInput.value = requestVerificationToken;
        }, { username, password, requestVerificationToken });

        await Promise.all([
            page.click('button[type="submit"]'),
            page.waitForNavigation(),
        ]);

        const currentUrl = page.url();
        if (currentUrl.includes('LogOn')) {
            await browser.close();
            throw new Error('Invalid username or password');
        }
        await page.goto(`https://homeaccess.katyisd.org/HomeAccess/Content/Student/Assignments.aspx`);
        const pageContent = await page.content();
        await browser.close();
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
    const $ = cheerio.load(pageContent);
    const classNames = [];
    const grades = [];

    const assignmentClasses = $('.AssignmentClass');

    assignmentClasses.each((i, elem) => {
        const $elem = $(elem);
        const name = $elem.find('.sg-header a').text().trim();
        classNames.push(name);

        const $categories = $(`#plnMain_rptAssigmnetsByCourse_lblCategories_${i}`);
        const classGrades = [];

        $categories.find('.sg-asp-table-data-row').each((j, elem2) => {
            const $elem2 = $(elem2);
            const category = [];
            $elem2.find('td').each((k, elem3) => {
                if (k !== 0) {
                    category.push($(elem3).text().trim());
                }
            });
            classGrades.push(category);
        });

        grades.push(classGrades);
    });

    res.json({ success: true, names: classNames, grades: grades });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;