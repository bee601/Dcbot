// Discord Account Creator - Snackoo Edition (Fixed Backend Connection)
class DiscordAccountCreator {
    constructor() {
        this.isRunning = false;
        this.isPaused = false;
        this.createdAccounts = [];
        this.failedAccounts = 0;
        this.currentAccount = 0;
        this.totalAccounts = 0;
        this.delaySeconds = 10;
        this.inviteLink = '';
        this.proxies = [];
        this.names = [];
        
        // Try multiple backend ports
        this.backendPorts = [5000, 3000];
        this.activePort = null;
        this.backendReady = false;
        
        // Snack system
        this.snackCount = 0;
        this.snackMultiplier = 1;
        this.comboCounter = 0;
        this.upgrades = { double: false, rainbow: false, mega: false, unlimited: false };
        this.dailyClaimed = false;
        this.loadSnackData();
        
        // Auto-detect backend on startup
        this.detectBackend();
    }

    async detectBackend() {
        for (let port of this.backendPorts) {
            try {
                const response = await fetch(`http://localhost:${port}/api/status`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' }
                });
                if (response.ok) {
                    this.activePort = port;
                    this.backendReady = true;
                    this.log(`✅ Backend verbunden auf Port ${port}`, 'success');
                    return;
                }
            } catch(e) {
                // continue to next port
            }
        }
        this.log(`❌ Kein Backend gefunden. Starte backend.py mit "python backend.py" auf Port 5000`, 'error');
        this.log(`   Oder starte server.js mit "node server.js" auf Port 3000`, 'error');
    }

    get apiUrl() {
        return this.activePort ? `http://localhost:${this.activePort}/api` : 'http://localhost:5000/api';
    }

    loadSnackData() {
        const saved = localStorage.getItem('snackooData');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.snackCount = data.snackCount || 0;
                this.snackMultiplier = data.snackMultiplier || 1;
                this.upgrades = data.upgrades || { double: false, rainbow: false, mega: false, unlimited: false };
                this.dailyClaimed = data.dailyClaimed || false;
            } catch(e) {}
        }
        this.updateSnackDisplay();
    }

    saveSnackData() {
        localStorage.setItem('snackooData', JSON.stringify({
            snackCount: this.snackCount,
            snackMultiplier: this.snackMultiplier,
            upgrades: this.upgrades,
            dailyClaimed: this.dailyClaimed
        }));
    }

    updateSnackDisplay() {
        const counter = document.getElementById('snackCounter');
        const progress = document.getElementById('snackProgress');
        if (counter) counter.innerText = Math.floor(this.snackCount);
        if (progress) {
            const percent = Math.min((this.snackCount % 100) / 100 * 100, 100);
            progress.style.width = `${percent}%`;
        }
    }

    playCrunch() {
        try {
            const audio = document.getElementById('snackCrunch');
            if (audio) audio.play().catch(() => {});
        } catch(e) {}
    }

    awardSnacks(baseAmount, reason = 'Account erstellt') {
        let amount = baseAmount * this.snackMultiplier;
        
        if (this.comboCounter >= 3) {
            let comboBonus = Math.floor(amount * 0.5);
            amount += comboBonus;
            this.log(`🔥 COMBO x${this.comboCounter}! +${comboBonus} Snacks!`, 'snackoo');
        }
        
        if (this.upgrades.rainbow && Math.random() < 0.3) {
            let rainbowBonus = amount * 2;
            amount += rainbowBonus;
            this.log(`🌈 Regenbogen-Snack! +${rainbowBonus}`, 'snackoo');
        }
        
        if (this.upgrades.mega && Math.random() < 0.2) {
            let megaBonus = amount * 3;
            amount += megaBonus;
            this.log(`💥 MEGA SNACKOO! +${megaBonus}`, 'snackoo');
        }
        
        if (this.upgrades.unlimited) {
            amount = 999;
            this.log(`♾️ UNENDLICH MODUS: +999 Snacks!`, 'snackoo');
        }
        
        this.snackCount += amount;
        this.saveSnackData();
        this.updateSnackDisplay();
        this.log(`🍪 +${amount} Snacks (${reason}) | Multi: ${this.snackMultiplier}x | Total: ${Math.floor(this.snackCount)}`, 'snackoo');
        this.showSnackooAnimation(amount);
        this.playCrunch();
        return amount;
    }

    showSnackooAnimation(amount) {
        let burstCount = Math.min(Math.floor(amount / 5) + 1, 30);
        for (let b = 0; b < burstCount; b++) {
            setTimeout(() => {
                for (let i = 0; i < 20; i++) {
                    let conf = document.createElement('div');
                    conf.style.position = 'fixed';
                    conf.style.width = `${Math.random() * 12 + 4}px`;
                    conf.style.height = `${Math.random() * 12 + 4}px`;
                    conf.style.background = `hsl(${Math.random() * 360}, 100%, 60%)`;
                    conf.style.left = Math.random() * window.innerWidth + 'px';
                    conf.style.top = '-30px';
                    conf.style.borderRadius = '50%';
                    conf.style.pointerEvents = 'none';
                    conf.style.zIndex = '9999';
                    conf.style.animation = `fall ${Math.random() * 2 + 1}s linear forwards`;
                    document.body.appendChild(conf);
                    setTimeout(() => conf.remove(), 3000);
                }
            }, b * 150);
        }
        
        let popup = document.createElement('div');
        popup.innerHTML = `
            <div style="position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); background:radial-gradient(circle, #ffcc44, #ff8844); color:#fff; padding:20px 40px; border-radius:80px; font-size:2rem; font-weight:bold; z-index:10000; box-shadow:0 0 80px orange; text-align:center; animation:bounce 0.4s;">
                🍪 +${amount} SNACKOO! 🍪<br><small>Gesamt: ${Math.floor(this.snackCount)}</small>
            </div>`;
        document.body.appendChild(popup);
        setTimeout(() => popup.remove(), 2000);
    }

    log(message, type = 'info') {
        const consoleOutput = document.getElementById('consoleOutput');
        if (!consoleOutput) return;
        const timestamp = new Date().toLocaleTimeString();
        let color = '#ffffff';
        switch(type) {
            case 'success': color = '#43b581'; break;
            case 'error': color = '#f04747'; break;
            case 'warning': color = '#faa61a'; break;
            case 'info': color = '#7289da'; break;
            case 'system': color = '#99aab5'; break;
            case 'snackoo': color = '#ffaa44'; break;
        }
        consoleOutput.innerHTML += `<span style="color: ${color}">[${timestamp}] ${message}</span><br>`;
        consoleOutput.scrollTop = consoleOutput.scrollHeight;
    }

    updateProgress() {
        let percent = Math.round((this.currentAccount / this.totalAccounts) * 100);
        let progressBar = document.getElementById('progressBar');
        let progressText = document.getElementById('progressText');
        if (progressBar) progressBar.style.width = `${percent}%`;
        if (progressText) progressText.textContent = `${this.currentAccount}/${this.totalAccounts}`;
        let statsElem = document.getElementById('stats');
        let failedElem = document.getElementById('statsFailed');
        if (statsElem) statsElem.textContent = `Erfolgreich: ${this.createdAccounts.length}`;
        if (failedElem) failedElem.textContent = `Fehlerhaft: ${this.failedAccounts}`;
    }

    addAccountToList(account) {
        let accountsList = document.getElementById('accountsList');
        if (!accountsList) return;
        if (accountsList.firstChild?.className === 'text-muted text-center') accountsList.innerHTML = '';
        let item = document.createElement('div');
        item.className = 'account-item';
        item.innerHTML = `
            <strong>Account #${account.number}</strong><br>
            <small>Email: ${account.email}</small><br>
            <small>Username: ${account.username}</small><br>
            <small>Passwort: ${account.password}</small><br>
            <small class="text-muted">Server beigetreten: ${account.joinedServer ? '✅ Ja' : '❌ Nein'}</small>
        `;
        accountsList.prepend(item);
    }

    async start() {
        if (this.isRunning) { this.log('Creator läuft bereits', 'warning'); return; }
        
        if (!this.backendReady) {
            this.log('Warte auf Backend-Verbindung...', 'warning');
            await this.detectBackend();
            if (!this.backendReady) {
                this.log('❌ Kein Backend erreichbar. Starte backend.py mit "python backend.py"', 'error');
                return;
            }
        }
        
        this.inviteLink = document.getElementById('inviteLink').value.trim();
        this.totalAccounts = parseInt(document.getElementById('accountCount').value);
        this.delaySeconds = parseInt(document.getElementById('delaySeconds').value);
        let proxyText = document.getElementById('proxyList').value.trim();
        let nameText = document.getElementById('nameList').value.trim();
        this.proxies = proxyText ? proxyText.split('\n').filter(p => p.trim()) : [];
        this.names = nameText ? nameText.split('\n').filter(n => n.trim()) : [];
        
        if (!this.inviteLink || !this.inviteLink.includes('discord.gg/')) {
            this.log('Ungültiger Discord Einladungslink', 'error');
            return;
        }
        
        this.isRunning = true;
        this.isPaused = false;
        this.currentAccount = 0;
        this.createdAccounts = [];
        this.failedAccounts = 0;
        this.comboCounter = 0;
        
        this.log('=== Starte Discord Automation mit Snackoo ===', 'system');
        this.log(`Server: ${this.inviteLink}`, 'info');
        this.log(`Backend URL: ${this.apiUrl}`, 'info');
        
        try {
            let response = await fetch(`${this.apiUrl}/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    inviteLink: this.inviteLink,
                    count: this.totalAccounts,
                    delay: this.delaySeconds,
                    proxies: this.proxies.join('\n'),
                    names: this.names.join('\n')
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            let data = await response.json();
            this.log(`Backend antwortet: ${data.total || 0} Accounts verarbeitet`, 'success');
            
            if (data.accounts) {
                for (let acc of data.accounts) {
                    if (!this.isRunning) break;
                    while (this.isPaused) await new Promise(r => setTimeout(r, 500));
                    this.currentAccount++;
                    if (acc.success) {
                        let snackAmount = (acc.snackReward || 10) + (acc.snackBonus ? 15 : 0);
                        if (acc.snackBonus) this.log(`✨ ${acc.snackBonus}! +15 Extra Snacks!`, 'snackoo');
                        this.createdAccounts.push(acc);
                        this.addAccountToList(acc);
                        this.log(`✓ Account ${acc.username} (${acc.email}) erstellt & beigetreten`, 'success');
                        this.awardSnacks(snackAmount, `Account ${acc.username}`);
                    } else {
                        this.failedAccounts++;
                        this.log(`✗ Account #${acc.number} fehlgeschlagen: ${acc.error || 'Unbekannt'}`, 'error');
                        this.awardSnacks(5, 'Trost-Snack');
                    }
                    this.updateProgress();
                    if (this.delaySeconds > 0 && this.currentAccount < this.totalAccounts)
                        await new Promise(r => setTimeout(r, this.delaySeconds * 1000));
                }
                this.finish();
            } else {
                throw new Error('Ungültige Antwort vom Backend');
            }
        } catch(err) {
            this.log(`Backend Fehler: ${err.message}`, 'error');
            this.log(`Stelle sicher, dass backend.py läuft: python backend.py`, 'warning');
            this.isRunning = false;
        }
    }

    finish() {
        this.isRunning = false;
        this.log('=== Prozess abgeschlossen ===', 'system');
        this.log(`${this.createdAccounts.length} erfolgreich, ${this.failedAccounts} fehlgeschlagen`, this.createdAccounts.length ? 'success' : 'error');
        if (this.createdAccounts.length) this.awardSnacks(50, 'Abschlussbonus');
    }

    pauseResume() { 
        if (!this.isRunning) return;
        this.isPaused = !this.isPaused;
        this.log(this.isPaused ? '⏸️ Pausiert' : '▶️ Fortgesetzt', 'warning');
        if (!this.isPaused) this.start(); 
    }
    
    stop() { 
        this.isRunning = false; 
        this.isPaused = false;
        this.log('🛑 Gestoppt', 'error');
    }
}

let creator = new DiscordAccountCreator();

// Globale Funktionen
function clearConsole() {
    let el = document.getElementById('consoleOutput');
    if (el) el.innerHTML = '<span style="color: #7289da;">=== Discord Account Creator ===</span><br><span style="color: #43b581;">Console gelöscht...</span>';
}

function exportAccounts() {
    if (!creator.createdAccounts.length) { alert('Keine Accounts zum Exportieren'); return; }
    let text = `Discord Accounts Export - ${new Date()}\nServer: ${creator.inviteLink}\n${'='.repeat(50)}\n`;
    creator.createdAccounts.forEach(acc => {
        text += `#${acc.number}\n  Email: ${acc.email}\n  User: ${acc.username}\n  Pass: ${acc.password}\n  Joined: ${acc.joinedServer}\n${'-'.repeat(30)}\n`;
    });
    let blob = new Blob([text], {type: 'text/plain'});
    let a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `discord_snackoo_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
    creator.log('Accounts exportiert', 'success');
}

function openSnackShop() {
    let modal = new bootstrap.Modal(document.getElementById('snackShopModal'));
    modal.show();
}

function claimDailySnack() {
    let last = localStorage.getItem('lastDailySnack');
    let today = new Date().toDateString();
    if (last === today) {
        creator.log('Heute schon Tages-Snack geholt! Morgen wieder.', 'warning');
        return;
    }
    localStorage.setItem('lastDailySnack', today);
    creator.awardSnacks(25, 'Täglicher Snack');
}

function buySnackUpgrade(type) {
    let costs = { double: 50, rainbow: 100, mega: 200, unlimited: 500 };
    let cost = costs[type];
    if (creator.snackCount < cost) {
        creator.log(`Nicht genug Snacks! Benötigt ${cost} Snacks.`, 'error');
        return;
    }
    creator.snackCount -= cost;
    if (type === 'double') { creator.snackMultiplier = 2; creator.upgrades.double = true; creator.log('🍪 Doppelte Snacks aktiviert!', 'success'); }
    if (type === 'rainbow') { creator.upgrades.rainbow = true; creator.log('🌈 Regenbogen-Snack aktiviert!', 'success'); }
    if (type === 'mega') { creator.upgrades.mega = true; creator.log('💥 Mega Snackoo aktiviert!', 'success'); }
    if (type === 'unlimited') { creator.snackMultiplier = 999; creator.upgrades.unlimited = true; creator.log('♾️ UNENDLICH SNACKS MODUS!', 'snackoo'); }
    creator.saveSnackData();
    creator.updateSnackDisplay();
    bootstrap.Modal.getInstance(document.getElementById('snackShopModal')).hide();
}

window.onload = () => {
    if (document.getElementById('nameList')) {
        document.getElementById('nameList').value = ['SnackoMaster', 'CookieHunter', 'CrunchTime', 'DiscordSnack'].join('\n');
    }
    creator.log('🍪 Snackoo Edition geladen – Suche nach Backend...', 'snackoo');
    creator.detectBackend();
};
