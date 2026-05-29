// Discord Account Creator - Full Automation + Snackoo
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
        this.sessionId = null;
        this.apiUrl = 'http://localhost:3000/api'; // Change to your backend URL
    }

    log(message, type = 'info') {
        const consoleOutput = document.getElementById('consoleOutput');
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
        const logEntry = `<span style="color: ${color}">[${timestamp}] ${message}</span><br>`;
        consoleOutput.innerHTML += logEntry;
        consoleOutput.scrollTop = consoleOutput.scrollHeight;
    }

    showSnackoo() {
        // Snackoo reward – visual + audio celebration
        const snackooDiv = document.createElement('div');
        snackooDiv.innerHTML = `
            <div id="snackooOverlay" style="position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); 
                background:linear-gradient(135deg,#ffaa44,#ff6644); color:white; padding:20px 40px; 
                border-radius:50px; font-size:2rem; font-weight:bold; z-index:10000; 
                box-shadow:0 0 50px rgba(0,0,0,0.5); text-align:center; animation:bounce 0.5s;">
                🍪 SNACKOO ERHALTEN! 🍪<br>
                <small style="font-size:1rem;">+1 Cookie für dich!</small>
            </div>
            <style>
                @keyframes bounce {
                    0% { transform: translate(-50%,-50%) scale(0.3); opacity:0; }
                    50% { transform: translate(-50%,-50%) scale(1.2); }
                    100% { transform: translate(-50%,-50%) scale(1); opacity:1; }
                }
            </style>
        `;
        document.body.appendChild(snackooDiv);
        
        // Play snackoo sound (simulated beep)
        const audio = new Audio('data:audio/wav;base64,U3RlYWx0aCBzb3VuZCBzaW11bGF0aW9u'); // dummy
        audio.play().catch(() => {});
        
        // Confetti effect
        for(let i = 0; i < 100; i++) {
            const conf = document.createElement('div');
            conf.style.position = 'fixed';
            conf.style.width = '10px';
            conf.style.height = '10px';
            conf.style.background = `hsl(${Math.random()*360}, 100%, 50%)`;
            conf.style.left = Math.random() * window.innerWidth + 'px';
            conf.style.top = '-20px';
            conf.style.pointerEvents = 'none';
            conf.style.zIndex = '9999';
            conf.style.animation = `fall ${Math.random() * 2 + 1}s linear forwards`;
            document.body.appendChild(conf);
            setTimeout(() => conf.remove(), 3000);
        }
        
        setTimeout(() => snackooDiv.remove(), 3000);
        
        this.log('🍪 SNACKOO freigeschaltet! Du bekommst einen Snack!', 'snackoo');
    }

    updateProgress() {
        const progress = Math.round((this.currentAccount / this.totalAccounts) * 100);
        document.getElementById('progressBar').style.width = `${progress}%`;
        document.getElementById('progressText').textContent = `${this.currentAccount}/${this.totalAccounts}`;
        document.getElementById('stats').textContent = `Erfolgreich: ${this.createdAccounts.length}`;
        document.getElementById('statsFailed').textContent = `Fehlerhaft: ${this.failedAccounts}`;
    }

    addAccountToList(account) {
        const accountsList = document.getElementById('accountsList');
        if (accountsList.firstChild?.className === 'text-muted text-center') {
            accountsList.innerHTML = '';
        }
        const accountItem = document.createElement('div');
        accountItem.className = 'account-item';
        accountItem.innerHTML = `
            <strong>Account #${account.number}</strong><br>
            <small>Email: ${account.email}</small><br>
            <small>Username: ${account.username}</small><br>
            <small>Passwort: ${account.password}</small><br>
            <small class="text-muted">Server beigetreten: ${account.joinedServer ? '✅ Ja' : '❌ Nein'}</small>
        `;
        accountsList.prepend(accountItem);
    }

    async start() {
        if (this.isRunning) {
            this.log('Creator läuft bereits', 'warning');
            return;
        }
        
        this.inviteLink = document.getElementById('inviteLink').value.trim();
        this.totalAccounts = parseInt(document.getElementById('accountCount').value);
        this.delaySeconds = parseInt(document.getElementById('delaySeconds').value);
        const proxyText = document.getElementById('proxyList').value.trim();
        const nameText = document.getElementById('nameList').value.trim();
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
        
        this.log('=== Starte echte Discord Automation mit Login & Server Join ===', 'system');
        this.log(`Server: ${this.inviteLink}`, 'info');
        
        // Call backend real automation
        try {
            const response = await fetch(`${this.apiUrl}/create`, {
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
            const data = await response.json();
            
            if (data.accounts) {
                this.totalAccounts = data.accounts.length;
                for (let acc of data.accounts) {
                    this.currentAccount++;
                    if (acc.success) {
                        this.createdAccounts.push(acc);
                        this.addAccountToList(acc);
                        this.log(`✓ Account ${acc.username} (${acc.email}) erstellt und Server beigetreten`, 'success');
                        // SNACKOO for every successful account
                        this.showSnackoo();
                    } else {
                        this.failedAccounts++;
                        this.log(`✗ Account #${acc.number} fehlgeschlagen: ${acc.error || 'Unbekannt'}`, 'error');
                    }
                    this.updateProgress();
                }
                this.finish();
            }
        } catch (err) {
            this.log(`Backend Fehler: ${err.message}`, 'error');
            this.isRunning = false;
        }
    }

    finish() {
        this.isRunning = false;
        this.log('=== Prozess abgeschlossen ===', 'system');
        this.log(`${this.createdAccounts.length} erfolgreiche Accounts, ${this.failedAccounts} fehlgeschlagen`, 
                 this.createdAccounts.length > 0 ? 'success' : 'error');
        if(this.createdAccounts.length > 0) {
            this.log('🎉 SNACKOO wurde dir gutgeschrieben! 🎉', 'snackoo');
        }
    }

    pauseResume() { this.log('Pause/Resume in Vollautomatik nicht nötig', 'warning'); }
    stop() { this.isRunning = false; this.log('Prozess gestoppt', 'error'); }
}

const creator = new DiscordAccountCreator();

function startCreation() { creator.start(); }
function pauseResume() { creator.pauseResume(); }
function stopCreation() { creator.stop(); }
function clearConsole() { document.getElementById('consoleOutput').innerHTML = '<span style="color:#7289da;">=== Discord Account Creator ===</span><br><span style="color:#43b581;">Console gelöscht...</span>'; }
function exportAccounts() { /* existing export code */ }
