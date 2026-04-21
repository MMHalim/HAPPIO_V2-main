#!/usr/bin/env python3
import json
import ssl
try:
    import certifi
    _CA_FILE = certifi.where()
except Exception:
    certifi = None
    _CA_FILE = None
import smtplib
import urllib.request
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from email.message import EmailMessage
import os

# Gmail SMTP credentials (can be overridden via environment variables)
SMTP_HOST = os.getenv('SMTP_HOST', 'smtp.gmail.com')
SMTP_PORT = int(os.getenv('SMTP_PORT', '587'))
SMTP_USER = os.getenv('SMTP_USER', 'happio.softs@gmail.com')
# Strip spaces in app passwords (Gmail app passwords are often shown grouped)
SMTP_PASS = os.getenv('SMTP_PASS', 'yiny eqhn fiha insi').replace(' ', '')

class EmailHandler(BaseHTTPRequestHandler):
    def _set_cors(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')

    def log_message(self, format, *args):
        # Reduce noisy logging
        pass

    def do_OPTIONS(self):
        self.send_response(204)
        self._set_cors()
        self.end_headers()

    def do_POST(self):
        if self.path == '/send-slack-sbs':
            try:
                length = int(self.headers.get('Content-Length', '0'))
                body = self.rfile.read(length) if length > 0 else b''
                payload = json.loads(body.decode('utf-8') or '{}')
                
                # Slack Webhook URL provided by user
                slack_url = "https://hooks.slack.com/services/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"
                
                # Construct Slack payload
                resolved_title = payload.get('title') or ('Membership Cancellation Started' if payload.get('monitoringType') == 'Selected' else 'SBS Started')
                text = f"*{resolved_title}*\n*Conversation ID:* {payload.get('conversationId')}\n*Taker:* {payload.get('takerName') or 'Unknown'}\n*Agent:* {payload.get('agentName') or 'Unknown'}\n*Type:* {payload.get('scorecardType') or 'Scorecard'}"
                
                slack_data = json.dumps({"text": text}).encode('utf-8')
                req = urllib.request.Request(slack_url, data=slack_data, headers={'Content-Type': 'application/json'})
                
                # Create unverified SSL context for local dev
                ctx = ssl.create_default_context()
                ctx.check_hostname = False
                ctx.verify_mode = ssl.CERT_NONE

                with urllib.request.urlopen(req, context=ctx) as response:
                    slack_resp = response.read()
                    print(f"Slack response: {slack_resp}")
                
                self.send_response(200)
                self._set_cors()
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'status': 'sent'}).encode('utf-8'))
            except Exception as e:
                print(f"Slack error: {e}")
                err = json.dumps({'ok': False, 'error': str(e)}).encode('utf-8')
                self.send_response(500)
                self._set_cors()
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(err)
            return

        if self.path != '/send-email':
            self.send_response(404)
            self._set_cors()
            self.end_headers()
            self.wfile.write(b'Not Found')
            return

        try:
            length = int(self.headers.get('Content-Length', '0'))
            body = self.rfile.read(length) if length > 0 else b''
            payload = json.loads(body.decode('utf-8') or '{}')
            to = payload.get('to')
            cc = payload.get('cc') or []
            subject = payload.get('subject') or 'QA Summary'
            html = payload.get('html') or '<p>No content</p>'

            # Normalize recipients to list
            if isinstance(to, str):
                to_list = [to]
            elif isinstance(to, list):
                to_list = to
            else:
                to_list = [SMTP_USER]
            # Normalize CC to list
            if isinstance(cc, str):
                cc_list = [cc]
            elif isinstance(cc, list):
                cc_list = cc
            else:
                cc_list = []
            recipients = to_list + cc_list

            # Compose message
            msg = EmailMessage()
            msg['Subject'] = subject
            msg['From'] = f'Happio QA <{SMTP_USER}>'
            msg['To'] = ', '.join(to_list)
            if cc_list:
                msg['Cc'] = ', '.join(cc_list)
            msg.set_content('HTML email attached. Please view in an HTML-capable client.')
            msg.add_alternative(html, subtype='html')

            # Send via Gmail SMTP with STARTTLS
            # Build TLS context with robust CA store (certifi) when available
            if _CA_FILE:
                context = ssl.create_default_context(cafile=_CA_FILE)
            else:
                context = ssl.create_default_context()
            # As a last resort in dev, allow no-verify to avoid local CA issues
            # (Not recommended for production; only used if handshake fails)
            with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
                server.ehlo()
                try:
                    server.starttls(context=context)
                except Exception:
                    # Fallback: attempt STARTTLS with permissive context
                    insecure = ssl.create_default_context()
                    insecure.check_hostname = False
                    insecure.verify_mode = ssl.CERT_NONE
                    server.starttls(context=insecure)
                server.ehlo()
                server.login(SMTP_USER, SMTP_PASS)
                # Log recipients for troubleshooting
                print(f"Sending email to: {', '.join(recipients)} | Subject: {subject}")
                server.send_message(msg)

            # Respond success
            resp = json.dumps({'ok': True}).encode('utf-8')
            self.send_response(200)
            self._set_cors()
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(resp)))
            self.end_headers()
            self.wfile.write(resp)
        except Exception as e:
            err = json.dumps({'ok': False, 'error': str(e)}).encode('utf-8')
            self.send_response(500)
            self._set_cors()
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(err)))
            self.end_headers()
            self.wfile.write(err)


def run(port=8025):
    server = ThreadingHTTPServer(('127.0.0.1', port), EmailHandler)
    print(f"SMTP relay server listening on http://127.0.0.1:{port}/send-email")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == '__main__':
    run()
