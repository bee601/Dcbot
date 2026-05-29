from flask import Flask, request, jsonify
from flask_cors import CORS
import random
import string
import time
import threading
from datetime import datetime

app = Flask(__name__)
CORS(app)  # Erlaubt Anfragen von GitHub Pages

class DiscordBotBackend:
    def __init__(self):
        self.active_sessions = {}
    
    def generate_account(self, session_id):
        """Generiert Account-Daten"""
        domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com']
        username = ''.join(random.choices(string.ascii_lowercase + string.digits, k=10))
        domain = random.choice(domains)
        
        first_names = ['Max', 'Anna', 'Leon', 'Emma', 'Paul']
        last_names = ['Müller', 'Schmidt', 'Fischer', 'Weber', 'Meyer']
        
        return {
            'email': f"{username}@{domain}",
            'username': f"{random.choice(first_names)} {random.choice(last_names)}",
            'password': ''.join(random.choices(string.ascii_letters + string.digits + '!@#$%^&*', k=16)),
            'birthdate': {
                'year': random.randint(1980, 2008),
                'month': random.randint(1, 12),
                'day': random.randint(1, 28)
            }
        }

backend = DiscordBotBackend()

@app.route('/api/create_account', methods=['POST'])
def create_account():
    """API Endpoint zum Erstellen eines Accounts"""
    data = request.json
    
    try:
        account_data = backend.generate_account(data.get('session_id'))
        
        # Hier würde der eigentliche Discord Bot laufen
        # Für Demo-Zwecke simulieren wir nur
        
        time.sleep(2)  # Simuliere Verarbeitungszeit
        
        return jsonify({
            'success': True,
            'account': account_data,
            'timestamp': datetime.now().isoformat()
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/bulk_create', methods=['POST'])
def bulk_create():
    """API für Massenerstellung"""
    data = request.json
    
    count = data.get('count', 1)
    delay = data.get('delay', 5)
    invite_link = data.get('invite_link', '')
    
    results = []
    
    for i in range(count):
        account_data = backend.generate_account(f"session_{i}")
        
        # Simuliere Account-Erstellung und Server-Join
        time.sleep(delay)
        
        results.append({
            'number': i + 1,
            'data': account_data,
            'success': random.random() > 0.2,  # 80% Erfolgsrate
            'joined_server': bool(invite_link)
        })
    
    return jsonify({
        'success': True,
        'results': results,
        'total': len(results),
        'successful': sum(1 for r in results if r['success'])
    })

@app.route('/api/status', methods=['GET'])
def status():
    """Status Endpoint"""
    return jsonify({
        'status': 'online',
        'version': '1.0',
        'uptime': '24/7'
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
