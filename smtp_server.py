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
SLACK_WEBHOOK_URL = os.getenv('SLACK_WEBHOOK_URL', 'https://hooks.slack.com/services/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')
SLACK_BOT_TOKEN = os.getenv('SLACK_BOT_TOKEN', '')
SLACK_DM_USER_ID = os.getenv('SLACK_DM_USER_ID', '')
SLACK_DM_USER_EMAIL = os.getenv('SLACK_DM_USER_EMAIL', '')


def build_ssl_context(allow_insecure=False):
    if _CA_FILE:
        context = ssl.create_default_context(cafile=_CA_FILE)
    else:
        context = ssl.create_default_context()
    if allow_insecure:
        context.check_hostname = False
        context.verify_mode = ssl.CERT_NONE
    return context


def slack_api_post(path, token, payload):
    body = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(
        f'https://slack.com/api/{path}',
        data=body,
        headers={
            'Content-Type': 'application/json; charset=utf-8',
            'Authorization': f'Bearer {token}'
        }
    )

    for allow_insecure in (False, True):
        try:
            with urllib.request.urlopen(req, context=build_ssl_context(allow_insecure=allow_insecure)) as response:
                raw = response.read().decode('utf-8')
                data = json.loads(raw or '{}')
                return data
        except ssl.SSLError:
            if allow_insecure:
                raise


def resolve_slack_user_id(token, user_id='', user_email=''):
    if user_id:
        return user_id
    if not user_email:
        return ''
    lookup = slack_api_post('users.lookupByEmail', token, {'email': user_email})
    if not lookup.get('ok') or not lookup.get('user', {}).get('id'):
        raise RuntimeError(f"Slack user lookup failed: {lookup.get('error') or lookup}")
    return lookup['user']['id']

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
                
                # Construct Slack payload
                resolved_title = payload.get('title') or ('Membership Cancellation Started' if payload.get('monitoringType') == 'Selected' else 'SBS Started')
                text = f"*{resolved_title}*\n*Conversation ID:* {payload.get('conversationId')}\n*Taker:* {payload.get('takerName') or 'Unknown'}\n*Agent:* {payload.get('agentName') or 'Unknown'}\n*Type:* {payload.get('scorecardType') or 'Scorecard'}"

                target_user_id = payload.get('slackUserId') or SLACK_DM_USER_ID
                target_user_email = payload.get('slackUserEmail') or SLACK_DM_USER_EMAIL

                if (target_user_id or target_user_email) and not SLACK_BOT_TOKEN:
                    raise RuntimeError('Set SLACK_BOT_TOKEN to send direct messages to a Slack user.')

                if SLACK_BOT_TOKEN and (target_user_id or target_user_email):
                    resolved_user_id = resolve_slack_user_id(
                        SLACK_BOT_TOKEN,
                        user_id=target_user_id,
                        user_email=target_user_email
                    )
                    open_resp = slack_api_post('conversations.open', SLACK_BOT_TOKEN, {'users': resolved_user_id})
                    if not open_resp.get('ok') or not open_resp.get('channel', {}).get('id'):
                        raise RuntimeError(f"Slack conversations.open failed: {open_resp.get('error') or open_resp}")
                    channel_id = open_resp['channel']['id']
                    post_resp = slack_api_post('chat.postMessage', SLACK_BOT_TOKEN, {'channel': channel_id, 'text': text})
                    if not post_resp.get('ok'):
                        raise RuntimeError(f"Slack chat.postMessage failed: {post_resp.get('error') or post_resp}")
                    print(f"Slack DM sent to user {resolved_user_id} via channel {channel_id}")
                    response_payload = {'status': 'sent', 'mode': 'dm', 'userId': resolved_user_id, 'channel': channel_id}
                elif SLACK_WEBHOOK_URL:
                    slack_data = json.dumps({"text": text}).encode('utf-8')
                    req = urllib.request.Request(
                        SLACK_WEBHOOK_URL,
                        data=slack_data,
                        headers={'Content-Type': 'application/json'}
                    )
                    with urllib.request.urlopen(req, context=build_ssl_context(allow_insecure=True)) as response:
                        slack_resp = response.read()
                        print(f"Slack webhook response: {slack_resp}")
                    response_payload = {'status': 'sent', 'mode': 'webhook'}
                else:
                    response_payload = {'status': 'skipped', 'message': 'Slack integration not configured'}
                
                self.send_response(200)
                self._set_cors()
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(response_payload).encode('utf-8'))
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
