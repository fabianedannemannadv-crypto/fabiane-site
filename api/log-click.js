const { google } = require('googleapis');

const SPREADSHEET_ID = process.env.SHEETS_ID;
const SHEET_NAME = 'leads_gclid';

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://fabianedannemann.adv.br');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { gclid, botao, timestamp } = req.body;

    if (!gclid || !botao) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // Converte timestamp UTC para horário de Brasília (GMT-3)
    const dt = new Date(timestamp);
    const brOffset = -3 * 60;
    const brTime = new Date(dt.getTime() + (brOffset - dt.getTimezoneOffset()) * 60000);
    const tsFormatado = brTime.toLocaleString('pt-BR', { hour12: false }).replace(',', '');

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:D`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[tsFormatado, gclid, botao, '']],
      },
    });

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('log-click error:', error);
    return res.status(500).json({ error: 'Internal error' });
  }
};
