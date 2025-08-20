import { NextRequest, NextResponse } from 'next/server';
import { GoogleSpreadsheet } from 'google-spreadsheet';

export async function GET(request: NextRequest) {
  try {
    // Get the spreadsheet ID from query parameters
    const { searchParams } = new URL(request.url);
    const spreadsheetId = searchParams.get('spreadsheetId');
    const sheetName = searchParams.get('sheetName') || 'Sheet1';

    if (!spreadsheetId) {
      return NextResponse.json(
        { error: 'Spreadsheet ID is required' },
        { status: 400 }
      );
    }

    // Initialize the spreadsheet
    const doc = new GoogleSpreadsheet(spreadsheetId);

    // Authenticate using service account credentials
    // You'll need to set these environment variables
    const serviceAccountEmail = "sheets-bot@vast-bounty-425107-q8.iam.gserviceaccount.com";
    const privateKey = "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDQ8Jw/dOgMGKrb\nT0qe4INwprBanO/FUtdvDpF39bbq6QoUEVVBAVs8redrMUmpb8dApHbEwkA++1TZ\nRrpn03GvKlRBlTx0V1Byk8Xht1iuMA+GRRk7wNi22Ysflf1HYwJE8T+vnQsarA6B\nPeuRUfv5HjvSD6SSojlTBjV/BZ/WgknQMvChcmczhmlj4Y3kc1H49oH/jZHALzSg\nUIvazgO+kVeASY0kKFSrB/m/TpoZfHqGUhx7qiSqUSHJSMjdoBMRTWLnu975TPXU\n41yEx0F3sxEghsKYZHHAnUlKXQgK62G2gBLp1NLQIr8KGj2n/vSRR08fIOXA3/d8\nFHX/VlCPAgMBAAECggEAC62XHhjbq2lpi054Pj8QOainbLke0amarvNigBD0w1Z5\nILwDRtnbjp2ttJkRo+3CdkN6++5bhumnSWmhm5H+5ap5AR1lPp9uuKi3w7DqvPmk\ntH2CNovF0RqBoydP+8B17QKK67bcWwZI3UJnuzyY18iv0ULckPGOQKy1Kr9Wurd9\npAp5uxyLx+K6W/duLAzz/EX5DjoQYuLQXR/OxYwIt1ry9dpFcz9WgoYPwZAXz0t+\noSYci7P1i30Qi7bSuttUrC49ZIzc+UTt5eX3XgOFZkvNzzBK37JUxYRhNb0miF0i\n6lMIcG43al9hAXkxJABaD+TDKMvJ6xqce7hPG0W3SQKBgQDzDRGRC+nJtiDkMKzo\no7LlMixDHuMfMzqZJFu59P73sbfprzILQASTWAWom8UOUv2xBVusVnUs0bvf90+J\nXAtzxLJZgqNc30iAJC3+iPEk1GXbOwxIdUt+3+UXQjn/YRvL48PP60uDX4gWj63f\nwDjSCfMoFKtPZYakhUA9p4OirQKBgQDcEk4wBOp3TP+bPHIRRCrcpsjBRlg3W+FN\nARTEGt4N+tdzNkYIHCKDn2055HBcOXCa6dAXQrv5ffcq+3YbZXs3RSI64+y4vq40\nxruRkAHDVW6cEsI/bo/vdsI1YMyz/jBcV85PMTqybho/Tpb0o/K4EmsSdGnL1CX8\nNb4lyDcjqwKBgQCMtVMnKsN1QJh4IunnYOXvpIVVcmtAo9LX1+G2nWyCj4OOqRuK\nwcwkVUApZczGRyuRsS1qbz807FMdDTshpYUHx6cNBQF4gdeiP8/U3QjmLoStT9kD\nlcxYLlydg3y6KUkDV+AD3g+AhezuSs35jHoYtyPrX1PyCi/RzUbsqq8dnQJ/fKXh\no1ElfG0gWczizuTNYi0ViGNPlAt2kScLnAebvk9VuOwEvpMw+VxTgXbiLVpbbWMB\neitSTP4MAUxsmRfhsmx19uUiL4HRKhNmKgxm8zxwafY2D7ePzxJ07cbmKwzOV39k\nW3aGyImUVEcvOWGjGJ9WBh3pzola+n92M/AzSwKBgQDtEpm/PZIDVPugGnZkuDVz\n8GZN/bJWr5O5fQoB8KOeMj0ENTeuM7rQt7kRvLhwzjsUlPn/ZS7eKIrY30UDxlfk\nOQ36aT7/nMKVtbGVFKXRsfthropU+evYU4TNfHKexfKz0ApJI/y1lcrsSGKJzfoI\nWbrxNSCgP0yxkafArATEig==\n-----END PRIVATE KEY-----\n";


    if (!serviceAccountEmail || !privateKey) {
      return NextResponse.json(
        { error: 'Google service account credentials not configured' },
        { status: 500 }
      );
    }

    await doc.useServiceAccountAuth({
      client_email: serviceAccountEmail,
      private_key: privateKey,
    });

    // Load the document
    await doc.loadInfo();

    // Get the specific sheet
    const sheet = doc.sheetsByTitle[sheetName];
    if (!sheet) {
      return NextResponse.json(
        { error: `Sheet '${sheetName}' not found` },
        { status: 404 }
      );
    }

    // Load the sheet data
    await sheet.loadCells();

    // Extract data from the sheet
    const data: any[] = [];
    const headers: string[] = [];

    // Get headers from first row
    for (let col = 0; col < sheet.columnCount; col++) {
      const cell = sheet.getCell(0, col);
      if (cell.value) {
        headers.push(cell.value.toString());
      }
    }

    // Get data rows
    for (let row = 1; row < sheet.rowCount; row++) {
      const rowData: any = {};
      let hasData = false;

      for (let col = 0; col < sheet.columnCount; col++) {
        const cell = sheet.getCell(row, col);
        if (cell.value) {
          rowData[headers[col]] = cell.value.toString();
          hasData = true;
        } else {
          rowData[headers[col]] = '';
        }
      }

      if (hasData) {
        data.push(rowData);
      }
    }

    return NextResponse.json({
      success: true,
      data,
      headers,
      totalRows: data.length,
      sheetName,
      spreadsheetTitle: doc.title
    });

  } catch (error) {
    console.error('Error fetching Google Sheets data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data from Google Sheets' },
      { status: 500 }
    );
  }
} 