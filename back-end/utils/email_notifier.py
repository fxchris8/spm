# @faw_sd
# Email notification utility untuk rotation change notifications

import os
import smtplib
from datetime import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from dotenv import load_dotenv

load_dotenv()

# Email configuration from environment variables
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
SENDER_EMAIL = os.getenv("EMAIL_SENDER", "")
SENDER_PASSWORD = os.getenv("EMAIL_PASSWORD", "")

# Recipient emails for different divisions (comma-separated in .env)
RECIPIENT_EMAILS = os.getenv(
    "EMAIL_RECIPIENTS",
    "division1@company.com,division2@company.com,division3@company.com",
).split(",")

print("=" * 60)
print("EMAIL NOTIFIER MODULE")
print("=" * 60)
print(f"Sender: {SENDER_EMAIL}")
print(f"Recipients: {len(RECIPIENT_EMAILS)} divisions")
print("=" * 60)


def send_rotation_change_notification(
    seamancode, nama, job, group_key, mutation_to, tanggal_ready, status_data
):
    """
    Kirim email notification ke divisi terkait ketika ada perubahan schedule rotation dari tim pusat

    Args:
        seamancode: Kode ABK
        nama: Nama ABK
        job: Posisi/jabatan
        group_key: Group rotation
        mutation_to: Kapal tujuan
        tanggal_ready: Tanggal ready dari tim pusat
        status_data: Status (CHANGE/ACCEPTED/REJECTED)

    Returns:
        Dict dengan status pengiriman email
    """
    try:
        # Validate email configuration
        if not SENDER_PASSWORD:
            print(
                "WARNING - EMAIL_PASSWORD not configured, skipping email notification"
            )
            return {
                "success": False,
                "message": "Email password not configured",
                "sent_count": 0,
            }

        # Format tanggal
        try:
            tanggal_formatted = datetime.strptime(tanggal_ready, "%d-%m-%Y").strftime(
                "%d %B %Y"
            )
        except Exception:
            tanggal_formatted = tanggal_ready

        # Determine status badge color and text
        if status_data == "CHANGE":
            status_color = "#FF9800"  # Orange
            status_text = "PERUBAHAN JADWAL"
        elif status_data == "ACCEPTED":
            status_color = "#4CAF50"  # Green
            status_text = "DITERIMA"
        elif status_data == "REJECTED":
            status_color = "#F44336"  # Red
            status_text = "DITOLAK"
        else:
            status_color = "#9E9E9E"  # Gray
            status_text = status_data

        # Get dynamic base URL from environment or use localhost
        base_url = os.getenv("BASE_URL", "http://localhost:3000")

        # Create email content
        subject = f"[URGENT] Perubahan Jadwal Rotasi Kru - {nama} ({job})"

        # HTML email body
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {{
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    background-color: #f4f4f4;
                    margin: 0;
                    padding: 0;
                }}
                .container {{
                    max-width: 600px;
                    margin: 20px auto;
                    background: white;
                    border-radius: 8px;
                    overflow: hidden;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }}
                .header {{
                    background: #dc2626;
                    color: white;
                    padding: 30px;
                    text-align: center;
                }}
                .header h1 {{
                    margin: 0;
                    font-size: 24px;
                    font-weight: 600;
                }}
                .header p {{
                    margin: 5px 0 0 0;
                    opacity: 0.95;
                    font-size: 14px;
                }}
                .content {{
                    padding: 30px;
                }}
                .status-badge {{
                    display: inline-block;
                    padding: 8px 16px;
                    background: {status_color};
                    color: white;
                    border-radius: 20px;
                    font-weight: bold;
                    margin: 10px 0;
                }}
                .info-table {{
                    width: 100%;
                    border-collapse: collapse;
                    margin: 20px 0;
                }}
                .info-table td {{
                    padding: 12px;
                    border-bottom: 1px solid #eee;
                }}
                .info-table td:first-child {{
                    font-weight: bold;
                    color: #666;
                    width: 40%;
                }}
                .urgent-box {{
                    background: #fef2f2;
                    border: 2px solid #dc2626;
                    padding: 15px;
                    border-radius: 5px;
                    margin: 20px 0;
                }}
                .action-box {{
                    background: #fffbeb;
                    border: 1px solid #f59e0b;
                    padding: 15px;
                    border-radius: 5px;
                    margin: 20px 0;
                }}
                .footer {{
                    background: #f8f9fa;
                    padding: 20px;
                    text-align: center;
                    font-size: 12px;
                    color: #666;
                }}
                .button {{
                    display: inline-block;
                    padding: 12px 30px;
                    background: #dc2626;
                    color: white;
                    text-decoration: none;
                    border-radius: 5px;
                    margin: 10px 0;
                    font-weight: 600;
                    transition: background 0.3s;
                }}
                .button:hover {{
                    background: #b91c1c;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>SPM - Ship Personnel Management</h1>
                    <p>PT Salam Pacific Indonesia Lines</p>
                </div>

                <div class="content">
                    <h2 style="color: #333; margin-top: 0;">Notifikasi Perubahan Jadwal Rotasi</h2>

                    <div class="urgent-box">
                        <p style="margin: 0; font-size: 16px; color: #991b1b;">
                            <strong>SEGERA DITINDAKLANJUTI!</strong><br>
                            Tim IT Pusat telah mengirimkan permintaan perubahan jadwal rotasi untuk kru kapal berikut.
                            Harap segera koordinasikan penggantian/perubahan kru sesuai dengan tanggal yang ditentukan.
                        </p>
                    </div>

                    <div style="text-align: center;">
                        <span class="status-badge">{status_text}</span>
                    </div>

                    <table class="info-table">
                        <tr>
                            <td>Nama Kru</td>
                            <td><strong>{nama}</strong></td>
                        </tr>
                        <tr>
                            <td>Seaman Code</td>
                            <td>{seamancode}</td>
                        </tr>
                        <tr>
                            <td>Jabatan</td>
                            <td>{job}</td>
                        </tr>
                        <tr>
                            <td>Group Rotasi</td>
                            <td>{group_key}</td>
                        </tr>
                        <tr>
                            <td>Kapal Tujuan</td>
                            <td><strong style="color: #dc2626;">{mutation_to}</strong></td>
                        </tr>
                        <tr>
                            <td>Tanggal Kru Ready</td>
                            <td><strong style="color: {status_color}; font-size: 16px;">{tanggal_formatted}</strong></td>
                        </tr>
                        <tr>
                            <td>Status Perubahan</td>
                            <td><strong>{status_data}</strong></td>
                        </tr>
                        <tr>
                            <td>Waktu Notifikasi</td>
                            <td>{datetime.now().strftime("%d %B %Y, %H:%M:%S WIB")}</td>
                        </tr>
                    </table>

                    <div class="action-box">
                        <strong>Tindakan Yang Harus Dilakukan:</strong>
                        <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                            <li>Segera verifikasi ketersediaan kru pengganti</li>
                            <li>Koordinasikan dengan divisi terkait untuk proses pergantian kru</li>
                            <li>Pastikan kru siap pada tanggal yang telah ditentukan</li>
                            <li>Update status di sistem setelah pergantian selesai</li>
                        </ul>
                    </div>

                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{base_url}/" class="button">
                            Lihat Detail di System
                        </a>
                    </div>
                </div>

                <div class="footer">
                    <p><strong>SPM - Ship Personnel Management</strong></p>
                    <p style="margin: 5px 0;">PT Salam Pacific Indonesia Lines</p>
                    <p style="color: #999;">Email otomatis dari sistem. Harap tidak membalas email ini.</p>
                    <p style="color: #999; margin-top: 10px;">
                        &copy; {datetime.now().year} PT Salam Pacific Indonesia Lines. All rights reserved.
                    </p>
                </div>
            </div>
        </body>
        </html>
        """

        # Plain text fallback
        text_body = f"""
{'=' * 80}
SPM - SHIP PERSONNEL MANAGEMENT
PT Salam Pacific Indonesia Lines
{'=' * 80}

NOTIFIKASI PERUBAHAN JADWAL ROTASI - SEGERA DITINDAKLANJUTI!

STATUS: {status_text}

Tim IT Pusat telah mengirimkan permintaan perubahan jadwal rotasi untuk kru kapal.
Harap segera koordinasikan penggantian/perubahan kru sesuai tanggal yang ditentukan.

{'=' * 80}

INFORMASI KRU:
- Nama Kru           : {nama}
- Seaman Code        : {seamancode}
- Jabatan            : {job}
- Group Rotasi       : {group_key}
- Kapal Tujuan       : {mutation_to}
- Tanggal Kru Ready  : {tanggal_formatted}
- Status Perubahan   : {status_data}
- Waktu Notifikasi   : {datetime.now().strftime("%d %B %Y, %H:%M:%S WIB")}

{'=' * 80}

TINDAKAN YANG HARUS DILAKUKAN:
1. Segera verifikasi ketersediaan kru pengganti
2. Koordinasikan dengan divisi terkait untuk proses pergantian kru
3. Pastikan kru siap pada tanggal yang telah ditentukan
4. Update status di sistem setelah pergantian selesai

{'=' * 80}

Akses sistem: {base_url}/

Email otomatis dari sistem. Harap tidak membalas email ini.
(c) {datetime.now().year} PT Salam Pacific Indonesia Lines. All rights reserved.
        """

        # Send email to all recipients
        sent_count = 0
        failed_recipients = []

        for recipient in RECIPIENT_EMAILS:
            recipient = recipient.strip()
            if not recipient:
                continue

            try:
                # Create message
                msg = MIMEMultipart("alternative")
                msg["Subject"] = subject
                msg["From"] = SENDER_EMAIL
                msg["To"] = recipient

                # Attach both plain text and HTML versions
                part1 = MIMEText(text_body, "plain")
                part2 = MIMEText(html_body, "html")
                msg.attach(part1)
                msg.attach(part2)

                # Send email
                with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
                    server.starttls()
                    server.login(SENDER_EMAIL, SENDER_PASSWORD)
                    server.send_message(msg)

                sent_count += 1
                print(f"DONE - Email sent to {recipient}")

            except Exception as e:
                failed_recipients.append(recipient)
                print(f"FAIL - Failed to send email to {recipient}: {str(e)}")

        # Return result
        if sent_count > 0:
            return {
                "success": True,
                "message": f"Email notification sent to {sent_count} recipient(s)",
                "sent_count": sent_count,
                "failed_count": len(failed_recipients),
                "failed_recipients": failed_recipients,
            }
        else:
            return {
                "success": False,
                "message": "Failed to send email to any recipient",
                "sent_count": 0,
                "failed_count": len(failed_recipients),
                "failed_recipients": failed_recipients,
            }

    except Exception as e:
        print(f"FAIL - Error sending rotation change notification: {str(e)}")
        return {
            "success": False,
            "message": f"Error sending notification: {str(e)}",
            "sent_count": 0,
        }
