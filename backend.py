from flask import Flask, request, jsonify
from flask_cors import CORS
import asyncio
import random
import string
import time
import uuid
from datetime import datetime
from fake_useragent import UserAgent
from pyppeteer import launch
import traceback

app = Flask(__name__)
CORS(app, origins="*")  # Macho mode: allow everything

ua = UserAgent()

# Helper: random name generator
def get_random_name(custom_names=None):
    default_names = [
        "SnackRider", "CookieMonster", "DiscordNinja", "MachoBot",
        "PixelFresser", "Cronchy", "SnackooKing", "FlaskFighter",
        "PyroPanda", "LaserLama", "ToastTitan", "KeksKaiser"
    ]
    pool = custom_names if custom_names and len(custom_names) > 0 else default_names
    base = random.choice(pool)
    suffix = random.randint(100, 9999)
    return f"{base}{suffix}"

# Helper: random email (temp mail simulation)
def get_temp_email():
    domains = ["guerrillamail.org", "10minutemail.net", "mailinator.com", "temp-mail.org"]
    username = ''.join(random.choices(string.ascii_lowercase + string.digits, k=12))
    return f"{username}@{random.choice(domains)}"

# Helper: random password
def gen_password(length=16):
    chars = string.ascii_letters + string.digits + "!@#$%^&*"
    return ''.join(random.choices(chars, k=length))

# Helper: random birthdate
def gen_birthdate():
    return {
        "year": random.randint(1980, 2005),
        "month": random.randint(1, 12),
        "day": random.randint(1, 28)
    }

# The main async function that automates Discord
async def create_discord_account_async(invite_link, proxy=None, custom_names=None, account_num=1):
    browser = None
    try:
        launch_args = {
            'headless': False,  # Set to True for production stealth
            'args': [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu'
            ]
        }
        if proxy:
            launch_args['args'].append(f'--proxy-server={proxy}')
        
        browser = await launch(launch_args)
        page = await browser.newPage()
        
        # Set fake user agent
        await page.setUserAgent(ua.random)
        
        # Go to Discord register
        await page.goto('https://discord.com/register', {'waitUntil': 'networkidle2'})
        
        # Generate account data
        email = get_temp_email()
        username = get_random_name(custom_names)
        password = gen_password()
        birth = gen_birthdate()
        
        # Fill form
        await page.waitForSelector('input[name="email"]', {'timeout': 10000})
        await page.type('input[name="email"]', email)
        await page.type('input[name="username"]', username)
        await page.type('input[name="password"]', password)
        
        # Birthdate selects
        await page.select('select[name="birthday_day"]', str(birth['day']))
        await page.select('select[name="birthday_month"]', str(birth['month']))
        await page.select('select[name="birthday_year"]', str(birth['year']))
        
        # Submit
        await page.click('button[type="submit"]')
        
        # Wait for possible captcha or verification (simulate wait)
        await asyncio.sleep(3)
        
        # Check if registration succeeded (simple check: URL changes or dashboard appears)
        current_url = page.url
        success_reg = 'channels' in current_url or 'app' in current_url
        
        joined_server = False
        if success_reg:
            # Join server using invite link
            await page.goto(invite_link, {'waitUntil': 'networkidle2'})
            await asyncio.sleep(2)
            
            # Try to click accept button
            accept_btn = await page.querySelector('button[aria-label="Accept Invite"]')
            if accept_btn:
                await accept_btn.click()
                await asyncio.sleep(3)
                joined_server = True
        
        await browser.close()
        
        # Snack reward calculation (macho style)
        snack_reward = random.randint(15, 35) if success_reg else 0
        if joined_server:
            snack_reward += 20
        
        return {
            "success": success_reg and joined_server,
            "email": email,
            "username": username,
            "password": password,
            "birthdate": birth,
            "joinedServer": joined_server,
            "inviteLink": invite_link,
            "snackReward": snack_reward,
            "snackBonus": "🍪 Macho Bonus!" if snack_reward > 30 else None,
            "number": account_num
        }
        
    except Exception as e:
        if browser:
            await browser.close()
        return {
            "success": False,
            "error": str(e),
            "number": account_num,
            "snackReward": 5  # consolation snack
        }

# Wrapper to run async function from sync Flask route
def run_async_coroutine(invite_link, proxy, custom_names, account_num):
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        result = loop.run_until_complete(create_discord_account_async(invite_link, proxy, custom_names, account_num))
        return result
    finally:
        loop.close()

# API: single account creation
@app.route('/api/create_account', methods=['POST'])
def create_account():
    data = request.json
    invite_link = data.get('invite_link', 'https://discord.gg/example')
    proxy = data.get('proxy')
    custom_names = data.get('names', [])
    
    result = run_async_coroutine(invite_link, proxy, custom_names, 1)
    return jsonify({
        "success": result.get("success", False),
        "account": result,
        "timestamp": datetime.now().isoformat()
    })

# API: bulk creation (used by frontend)
@app.route('/api/create', methods=['POST'])
def bulk_create():
    data = request.json
    invite_link = data.get('inviteLink', '')
    count = int(data.get('count', 1))
    delay = int(data.get('delay', 5))
    proxies_text = data.get('proxies', '')
    names_text = data.get('names', '')
    
    proxy_list = [p.strip() for p in proxies_text.split('\n') if p.strip()] if proxies_text else []
    name_list = [n.strip() for n in names_text.split('\n') if n.strip()] if names_text else []
    
    results = []
    for i in range(count):
        proxy = proxy_list[i % len(proxy_list)] if proxy_list else None
        print(f"[+] Creating account {i+1}/{count} with proxy {proxy or 'none'}")
        
        acc = run_async_coroutine(invite_link, proxy, name_list, i+1)
        results.append(acc)
        
        if delay > 0 and i < count - 1:
            time.sleep(delay)
    
    successful = sum(1 for r in results if r.get('success', False))
    
    # Add snack totals
    total_snacks = sum(r.get('snackReward', 0) for r in results)
    
    return jsonify({
        "success": True,
        "accounts": results,
        "total": len(results),
        "successful": successful,
        "failed": count - successful,
        "totalSnacksAwarded": total_snacks
    })

# API: status check
@app.route('/api/status', methods=['GET'])
def status():
    return jsonify({
        "status": "macho_online",
        "version": "2.0_snackoo",
        "uptime": "since_boot",
        "snack_mode": "unlimited"
    })

# Health check for frontend
@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({"status": "healthy", "snacks": "ready"})

if __name__ == '__main__':
    print("""
    ╔═══════════════════════════════════════╗
    ║   🍪 MACHO BACKEND.PY - SNACKOO EDITION 🍪
    ║   Discord Automation + Snack Rewards
    ║   Running on http://0.0.0.0:5000
    ╚═══════════════════════════════════════╝
    """)
    app.run(host='0.0.0.0', port=5000, debug=True, threaded=True)
