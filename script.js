// Discord Account Creator - Frontend Controller
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
        this.worker = null;
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
        }
        
        const logEntry = `<span style="color: ${color}">[${timestamp}] ${message}</span><br>`;
        consoleOutput.innerHTML += logEntry;
        consoleOutput.scrollTop = consoleOutput.scrollHeight;
    }

    updateProgress() {
        const progress = Math.round((this.currentAccount / this.totalAccounts) * 100);
        const progressBar = document.getElementById('progressBar');
        const progressText = document.getElementById('progressText');
        
        progressBar.style.width = `${progress}%`;
        progressText.textContent = `${this.currentAccount}/${this.totalAccounts}`;
        
        // Update stats
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
            <small>Password: ${account.password}</small><br>
            <small class="text-muted">Erstellt: ${account.created_at}</small>
        `;
        
        accountsList.prepend(accountItem);
    }

    async start() {
        if (this.isRunning) {
            this.log('Creator läuft bereits', 'warning');
            return;
        }

        // Get user inputs
        this.inviteLink = document.getElementById('inviteLink').value.trim();
        this.totalAccounts = parseInt(document.getElementById('accountCount').value);
        this.delaySeconds = parseInt(document.getElementById('delaySeconds').value);
        
        const proxyText = document.getElementById('proxyList').value.trim();
        const nameText = document.getElementById('nameList').value.trim();
        
        this.proxies = proxyText ? proxyText.split('\n').filter(p => p.trim()) : [];
        this.names = nameText ? nameText.split('\n').filter(n => n.trim()) : [];

        // Validate inputs
        if (!this.inviteLink || !this.inviteLink.includes('discord.gg/')) {
            this.log('Ungültiger Discord Einladungslink', 'error');
            return;
        }

        if (this.totalAccounts < 1 || this.totalAccounts > 100) {
            this.log('Anzahl Accounts muss zwischen 1 und 100 liegen', 'error');
            return;
        }

        this.isRunning = true;
        this.isPaused = false;
        this.currentAccount = 0;
        this.createdAccounts = [];
        this.failedAccounts = 0;
        
        // Clear previous accounts
        document.getElementById('accountsList').innerHTML = 
            '<p class="text-muted text-center">Accounts werden erstellt...</p>';

        this.log('=== Starte Discord Account Creation ===', 'system');
        this.log(`Ziel: ${this.inviteLink}`, 'info');
        this.log(`Anzahl: ${this.totalAccounts} Accounts`, 'info');
        this.log(`Delay: ${this.delaySeconds} Sekunden`, 'info');
        
        if (this.proxies.length > 0) {
            this.log(`Proxies: ${this.proxies.length} verfügbar`, 'info');
        }
        
        if (this.names.length > 0) {
            this.log(`Namen: ${this.names.length} verfügbar`, 'info');
        }

        // Start creation process
        this.createNextAccount();
    }

    async createNextAccount() {
        if (!this.isRunning || this.isPaused) {
            return;
        }

        if (this.currentAccount >= this.totalAccounts) {
            this.finish();
            return;
        }

        this.currentAccount++;
        this.updateProgress();

        const accountNumber = this.currentAccount;
        
        // Generate account data
        const accountData = this.generateAccountData(accountNumber);
        
        this.log(`Starte Erstellung von Account #${accountNumber}`, 'info');
        this.log(`Email: ${accountData.email}`, 'info');
        this.log(`Username: ${accountData.username}`, 'info');

        // Simulate account creation (in real implementation, this would call a backend API)
        setTimeout(() => {
            if (Math.random() > 0.2) { // 80% success rate simulation
                accountData.created_at = new Date().toLocaleString();
                this.createdAccounts.push(accountData);
                this.addAccountToList(accountData);
                
                this.log(`✓ Account #${accountNumber} erfolgreich erstellt`, 'success');
                this.log(`  Dem Server ${this.inviteLink} beigetreten`, 'success');
            } else {
                this.failedAccounts++;
                this.log(`✗ Account #${accountNumber} fehlgeschlagen`, 'error');
            }

            // Continue with next account
            if (this.isRunning && !this.isPaused && this.currentAccount < this.totalAccounts) {
                setTimeout(() => this.createNextAccount(), this.delaySeconds * 1000);
            } else if (this.currentAccount >= this.totalAccounts) {
                this.finish();
            }
        }, 2000); // Simulate 2 second processing time
    }

    generateAccountData(accountNumber) {
        const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'protonmail.com'];
        
        // Generate random email
        const randomStr = Math.random().toString(36).substring(2, 15);
        const domain = domains[Math.floor(Math.random() * domains.length)];
        const email = `${randomStr}@${domain}`;
        
        // Generate username
        let username;
        if (this.names.length > 0) {
            username = this.names[(accountNumber - 1) % this.names.length];
        } else {
            const firstNames = ['Max', 'Anna', 'Leon', 'Emma', 'Paul', 'Sophie', 'Felix', 'Hannah'];
            const lastNames = ['Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Meyer'];
            username = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
        }
        
        // Generate password
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
        let password = '';
        for (let i = 0; i < 16; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        
        // Generate birthdate
        const year = 1980 + Math.floor(Math.random() * 29);
        const month = 1 + Math.floor(Math.random() * 12);
        const day = 1 + Math.floor(Math.random() * 28);
        
        return {
            number: accountNumber,
            email: email,
            username: username,
            password: password,
            birthdate: { year, month, day }
        };
    }

    pauseResume() {
        if (!this.isRunning) return;
        
        this.isPaused = !this.isPaused;
        
        if (this.isPaused) {
            this.log('⏸️ Prozess pausiert', 'warning');
        } else {
            this.log('▶️ Prozess fortgesetzt', 'success');
            this.createNextAccount();
        }
    }

    stop() {
        this.isRunning = false;
        this.isPaused = false;
        this.log('🛑 Prozess gestoppt', 'error');
    }

    finish() {
        this.isRunning = false;
        
        this.log('=== Prozess abgeschlossen ===', 'system');
        this.log(`Erfolgreich erstellt: ${this.createdAccounts.length}/${this.totalAccounts}`, 
                 this.createdAccounts.length > 0 ? 'success' : 'error');
        this.log(`Fehlgeschlagen: ${this.failedAccounts}`, 
                 this.failedAccounts > 0 ? 'warning' : 'info');
        
        if (this.createdAccounts.length > 0) {
            this.log('Accounts wurden in der Liste angezeigt', 'info');
        }
    }
}

// Initialize creator instance
const creator = new DiscordAccountCreator();

// Global functions for button clicks
function startCreation() {
    creator.start();
}

function pauseResume() {
    creator.pauseResume();
}

function stopCreation() {
    creator.stop();
}

function clearConsole() {
    document.getElementById('consoleOutput').innerHTML = 
        '<span style="color: #7289da;">=== Discord Account Creator ===</span><br>' +
        '<span style="color: #43b581;">Console gelöscht...</span>';
}

function exportAccounts() {
    if (creator.createdAccounts.length === 0) {
        alert('Keine Accounts zum Exportieren vorhanden');
        return;
    }
    
    let exportText = `Discord Accounts Export - ${new Date().toLocaleString()}\n`;
    exportText += `Server: ${creator.inviteLink}\n`;
    exportText += '='.repeat(50) + '\n\n';
    
    creator.createdAccounts.forEach(account => {
        exportText += `Account #${account.number}:\n`;
        exportText += `  Email: ${account.email}\n`;
        exportText += `  Username: ${account.username}\n`;
        exportText += `  Password: ${account.password}\n`;
        exportText += `  Created: ${account.created_at}\n`;
        exportText += '-'.repeat(30) + '\n';
    });
    
    // Create download link
    const blob = new Blob([exportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `discord_accounts_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    creator.log('Accounts exportiert als Textdatei', 'success');
}

// Add sample data on load
window.onload = function() {
    // Add sample names
    const sampleNames = [
        'Max Müller', 'Anna Schmidt', 'Leon Fischer', 'Emma Weber',
        'Paul Schneider', 'Sophie Wagner', 'Felix Hoffmann', 'Hannah Becker'
    ];
    document.getElementById('nameList').value = sampleNames.join('\n');
    
    // Add sample proxies
    const sampleProxies = [
        '192.168.1.1:8080',
        'proxy.example.com:3128',
        '10.0.0.1:8888'
    ];
    document.getElementById('proxyList').value = sampleProxies.join('\n');
};
