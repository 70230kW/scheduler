import { FreeSlot } from '../types';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

function utf8ToBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary);
}

function toBase64Url(str: string): string {
  return utf8ToBase64(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function generateHtmlEmail(
  selfEmail: string,
  slots: FreeSlot[],
  nameMap: Record<string, string>
): string {
  const slotButtons = slots
    .map((slot) => {
      const date = format(slot.start, 'M月d日(EEE)', { locale: ja });
      const start = format(slot.start, 'HH:mm');
      const end = format(slot.end, 'HH:mm');
      const label = `${date} ${start}〜${end}`;
      const names = slot.availableUsers.map((e) => nameMap[e] ?? e).join('・');
      const subject = encodeURIComponent(`【日程承認】${label}`);
      const body = encodeURIComponent(`下記の日程でお願いします。\n\n${label}`);
      const href = `mailto:${selfEmail}?subject=${subject}&body=${body}`;
      return `
    <tr>
      <td style="padding:6px 0;">
        <a href="${href}"
           style="display:inline-block;padding:12px 24px;background:#1a73e8;color:#ffffff;text-decoration:none;border-radius:6px;font-size:14px;font-family:Arial,sans-serif;font-weight:bold;">
          ${label}
        </a>
        ${names ? `<span style="margin-left:10px;font-size:12px;color:#666;">${names} も空き</span>` : ''}
      </td>
    </tr>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;color:#333333;line-height:1.8;max-width:600px;margin:0 auto;padding:20px;">
  <p>お世話になっております。</p>
  <p>ご面談のお時間をいただきたく、下記の候補日程よりご都合のよい日時をお選びください。<br>
  ご希望の日程のボタンをクリックいただくと、承認メールの作成画面が開きます。</p>
  <table cellpadding="0" cellspacing="0" style="margin:24px 0;">
${slotButtons}
  </table>
  <p>ご確認のほど、よろしくお願いいたします。</p>
</body>
</html>`;
}

export async function createGmailDraft(
  accessToken: string,
  to: string,
  subject: string,
  htmlBody: string
): Promise<string> {
  const subjectEncoded = `=?UTF-8?B?${utf8ToBase64(subject)}?=`;
  const bodyBase64 = utf8ToBase64(htmlBody);

  const rawMessage = [
    `To: ${to}`,
    `Subject: ${subjectEncoded}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    bodyBase64,
  ].join('\r\n');

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/drafts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message: { raw: toBase64Url(rawMessage) } }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: { message?: string } }).error?.message ?? `Gmail API error: ${res.status}`);
  }

  const data = await res.json();
  return `https://mail.google.com/mail/#drafts/${data.id}`;
}
