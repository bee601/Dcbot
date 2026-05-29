const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-stealth');
puppeteer.use(StealthPlugin());

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

const sessions = new Map();

// Helper: generate random name from list or random
function getRandomName(customNames = []) {
    const defaultNames = [
        "BlitzerXX", "CyberFuchs", "NachtNebel", "PixelPirat", "Dosenpfand",
        "LaserLurch", "Toastkönig", "Mondmelone", "Flitzpiepe", "SnackooJäger"
    ];
    const pool = customNames.length ? customNames : defaultNames;
    return pool[Math.floor(Math.random() * pool.length)] + Math.floor(Math.random() * 999);
}

// Helper: generate random email via temp-mail (simulated)
async function getTempEmail() {
    // Real implementation would use temp-mail.org API
    const randomHash = Math.random().toString(36).substring(2, 15);
    return `${randomHash}@guerrillamail.org`;
}

// Main account creation + server join
async function createDiscordAccountAndJoin(inviteLink, proxy, customNames, accountNumber) {
    let browser = null;
    try {
        const args = ['--no-sandbox', '--disable-setuid-sandbox'];
        if (proxy) args.push(`--proxy-server=${proxy}`);
        
        browser = await puppeteer.launch({ 
            headless: false,  // Set to true for production, false for debugging
            args 
        });
        const page = await browser.newPage();
        
        // Step 1: Go to Discord register page
        await page.goto('https://discord.com/register', { waitUntil: 'networkidle2' });
        
        // Step 2: Fill registration form
        const email = await getTempEmail();
        const username = getRandomName(customNames);
        const password = `Snackoo${Math.random().toString(36).substring(2, 10)}!@#`;
        const birthdate = {
            day: Math.floor(Math.random() * 28) + 1,
            month: Math.floor(Math.random() * 12) + 1,
            year: Math.floor(Math.random() * (2005 - 1985 + 1) + 1985)
        };
        
        await page.waitForSelector('input[name="email"]');
        await page.type('input[name="email"]', email);
        await page.type('input[name="username"]', username);
        await page.type('input[name="password"]', password);
        
        // Birthdate selects
        await page.select('select[name="birthday_day"]', birthdate.day.toString());
        await page.select('select[name="birthday_month"]', birthdate.month.toString());
        await page.select('select[name="birthday_year"]', birthdate.year.toString());
        
        // Step 3: Click continue (may need to solve captcha in real scenario – simulated here)
        await page.click('button[type="submit"]');
        
        // Wait for possible captcha (simulate manual bypass or service)
        await page.waitForTimeout(3000);
        
        // Step 4: Check if registration succeeded – look for dashboard or verification message
        const dashboardIndicator = await page.waitForSelector('[aria-label="Servers"]', { timeout: 30000 }).catch(() => null);
        
        if (!dashboardIndicator) {
            // Maybe need email verification – simulate click on verify later
            await page.waitForTimeout(5000);
        }
        
        // Step 5: Join server using invite link
        await page.goto(inviteLink, { waitUntil: 'networkidle2' });
        await page.waitForTimeout(2000);
        
        const acceptButton = await page.$('button[aria-label="Accept Invite"]');
        if (acceptButton) {
            await acceptButton.click();
            await page.waitForTimeout(3000);
        }
        
        // Step 6: Confirmation that joined
        const channelList = await page.$('[aria-label="Channels"]');
        const joinedSuccessfully = !!channelList;
        
        await browser.close();
        
        return {
            success: joinedSuccessfully,
            email,
            username,
            password,
            birthdate,
            joinedServer: joinedSuccessfully,
            inviteLink
        };
        
    } catch (error) {
        if (browser) await browser.close();
        return { success: false, error: error.message };
    }
}

app.post('/api/create', async (req, res) => {
    const { inviteLink, count, delay, proxies, names } = req.body;
    
    if (!inviteLink || !count) {
        return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    const sessionId = uuidv4();
    const results = [];
    const proxyList = proxies ? proxies.split('\n').filter(p => p.trim()) : [];
    const nameList = names ? names.split('\n').filter(n => n.trim()) : [];
    
    for (let i = 0; i < count; i++) {
        const proxy = proxyList[i % proxyList.length] || null;
        console.log(`Creating account ${i+1}/${count} with proxy ${proxy || 'none'}`);
        
        const result = await createDiscordAccountAndJoin(inviteLink, proxy, nameList, i+1);
        results.push({
            number: i+1,
            ...result,
            timestamp: new Date().toISOString()
        });
        
        if (delay && i < count-1) {
            await new Promise(r => setTimeout(r, delay * 1000));
        }
    }
    
    const successful = results.filter(r => r.success).length;
    
    res.json({
        sessionId,
        accounts: results,
        total: results.length,
        successful,
        failed: count - successful
    });
});

app.get('/api/session/:sessionId', (req, res) => {
    const accounts = sessions.get(req.params.sessionId);
    if (!accounts) return res.status(404).json({ error: 'Session not found' });
    res.json({ accounts });
});

app.listen(PORT, () => {
    console.log(`Discord automation server running on port ${PORT}`);
});
