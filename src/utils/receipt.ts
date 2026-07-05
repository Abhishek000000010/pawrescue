import html2pdf from 'html2pdf.js';

export interface ReceiptDonation {
  amount: number | string;
  transactionId: string;
  address?: string;
  date: string | number | Date;
}

export interface ReceiptDonor {
  name?: string;
  email?: string;
}

// Builds and downloads the PawNet donation receipt PDF. Shared by the user
// Dashboard and the Admin donations view so the receipt stays identical.
export function downloadReceipt(donation: ReceiptDonation, donor: ReceiptDonor) {
  const svg = (path: string, size = 16) =>
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="display: block;">${path}</svg>`;

  const row = (icon: string, label: string, value: string, valueStyle = '') => `
    <tr>
      <td style="padding: 9px 0; vertical-align: middle; width: 42px;">
        <div style="width: 30px; height: 30px; box-sizing: border-box; padding: 7px; border-radius: 8px; background: #fff2e6; color: #f97316;">${icon}</div>
      </td>
      <td style="padding: 9px 0; vertical-align: middle; white-space: nowrap; font-weight: 700; font-size: 12px; color: #64748b; letter-spacing: 0.3px;">${label}</td>
      <td style="padding: 9px 0 9px 20px; vertical-align: middle; text-align: right; color: #1e293b; font-size: 13px; font-weight: 600; word-break: break-word; ${valueStyle}">${value}</td>
    </tr>`;

  const impactItem = (icon: string, text: string) => `
    <tr>
      <td style="padding-bottom: 16px; vertical-align: middle; width: 46px;">
        <div style="width: 34px; height: 34px; box-sizing: border-box; padding: 9px; border-radius: 50%; background: #fff; color: #f97316; box-shadow: 0 2px 6px rgba(249,115,22,0.15);">${icon}</div>
      </td>
      <td style="padding-bottom: 16px; vertical-align: middle; font-size: 12.5px; color: #7c2d12; font-weight: 600; line-height: 1.35;">${text}</td>
    </tr>`;

  const invoiceHTML = `
    <div style="width: 794px; height: 1110px; font-family: 'Helvetica', 'Arial', sans-serif; color: #333; background: #ffffff; box-sizing: border-box; position: relative; overflow: hidden;">
      <!-- Top accent bar -->
      <div style="height: 8px; background: linear-gradient(90deg, #f97316, #fb923c, #fdba74);"></div>

      <div style="padding: 36px 48px 0 48px;">
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 26px;">
          <img src="/receipt-logo.png" alt="PawNet Rescue" style="height: 96px; object-fit: contain;" />
          <div style="text-align: right;">
            <div style="font-family: 'Georgia', serif; font-style: italic; font-size: 17px; color: #f97316;">Thank you for being their hero.</div>
            <div style="font-size: 11px; color: #94a3b8; margin-top: 4px;">Receipt No. ${donation.transactionId}</div>
          </div>
        </div>

        <!-- Banner -->
        <div style="background: linear-gradient(120deg, #ea580c, #f97316); padding: 26px 34px; border-radius: 18px; color: #fff; margin-bottom: 32px; box-shadow: 0 10px 25px -8px rgba(249,115,22,0.5);">
          <h2 style="margin: 0; font-size: 26px; font-weight: 900; letter-spacing: 1.5px;">DONATION RECEIPT</h2>
          <p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.92;">Thank you for making a difference in a life today.</p>
        </div>

        <!-- Two Columns -->
        <div style="display: flex; gap: 26px; margin-bottom: 30px; align-items: stretch;">
          <!-- Left: Details -->
          <div style="flex: 1.25;">
            <h3 style="margin: 0 0 14px 0; font-size: 13px; font-weight: 800; color: #334155; letter-spacing: 1px;">DONATION DETAILS</h3>
            <div style="background: #f8fafc; border: 1px solid #eef2f7; border-radius: 16px; padding: 12px 22px;">
              <table style="width: 100%; border-collapse: collapse;">
                ${row(svg('<rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/>'), 'Date', new Date(donation.date).toLocaleDateString())}
                ${row(svg('<line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>'), 'Amount', `INR ${donation.amount}`, 'color: #f97316; font-weight: 900; font-size: 15px;')}
                ${row(svg('<rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/>'), 'Transaction ID', donation.transactionId, 'font-size: 11px; word-break: break-all;')}
                ${row(svg('<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>'), 'Donor Name', donor?.name || 'Anonymous')}
                ${row(svg('<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>'), 'Donor Email', donor?.email || 'N/A', 'font-size: 11px;')}
                ${row(svg('<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>'), 'Billing Address', donation.address || 'N/A')}
              </table>
            </div>
          </div>

          <!-- Right: Impact -->
          <div style="flex: 0.9;">
            <h3 style="margin: 0 0 14px 0; font-size: 13px; font-weight: 800; color: #f97316; letter-spacing: 1px;">YOUR IMPACT</h3>
            <div style="background: linear-gradient(160deg, #fff7ed, #ffedd5); border-radius: 16px; padding: 22px 20px;">
              <table style="width: 100%; border-collapse: collapse;">
                ${impactItem(svg('<path d="M17 8c.7-.7 1.69-1 2.5-1a3.5 3.5 0 0 1 0 7H14M12 22v-8"/><path d="M2 15h10"/><path d="M6 11V5a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v6"/>'), 'Nutritious meals for stray cats')}
                ${impactItem(svg('<path d="M11 2v2"/><path d="M5 2v2"/><path d="M5 3H4a2 2 0 0 0-2 2v4a6 6 0 0 0 12 0V5a2 2 0 0 0-2-2h-1"/><path d="M8 15a6 6 0 0 0 12 0v-3"/><circle cx="20" cy="10" r="2"/>'), 'Medical care and vaccinations')}
                ${impactItem(svg('<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>'), 'Safe shelters and foster homes')}
                ${impactItem(svg('<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>'), 'Hope for a better tomorrow')}
              </table>
            </div>
          </div>
        </div>

        <!-- Quote -->
        <div style="background: #fffbf5; border: 1px solid #ffedd5; border-radius: 16px; padding: 26px 34px; text-align: center; margin-bottom: 34px;">
          <div style="font-size: 40px; line-height: 0; color: #fdba74; font-family: Georgia, serif; height: 20px;">&ldquo;</div>
          <div style="font-family: 'Georgia', serif; font-style: italic; font-size: 15px; color: #475569; line-height: 1.65;">
            Thank you for your generous support! Your contribution helps us provide food, medical care, and safe homes for stray animals. You just changed a life.
          </div>
        </div>

        <!-- Signature -->
        <div style="display: flex; justify-content: space-between; align-items: flex-end;">
          <div>
            <div style="font-family: 'Georgia', serif; font-style: italic; font-size: 30px; color: #1e293b;">PawNet Team</div>
            <div style="width: 150px; height: 2px; background: #f97316; margin: 6px 0 6px 0;"></div>
            <div style="font-size: 12px; color: #64748b;">Grateful for your kindness.</div>
          </div>
          <div style="width: 84px; height: 84px; border-radius: 50%; border: 2px dashed #f97316; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 11px; color: #f97316; text-align: center; line-height: 1.3; transform: rotate(-12deg);">
            THANK<br/>YOU
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div style="background: linear-gradient(120deg, #ea580c, #f97316); padding: 20px 48px; display: flex; justify-content: space-between; align-items: center; color: #fff; position: absolute; bottom: 0; left: 0; right: 0;">
        <div style="font-weight: 800; font-size: 16px;">PawNet Rescue</div>
        <div style="font-size: 10px; opacity: 0.9;">Reg. No.: PNR/2026/04/00123</div>
        <div style="text-align: right;">
          <div style="font-weight: 800; font-size: 12px;">Every Paw Matters.</div>
          <div style="font-size: 10px; opacity: 0.9;">Every Life Counts.</div>
        </div>
      </div>
    </div>
  `;

  const element = document.createElement('div');
  element.innerHTML = invoiceHTML;

  html2pdf()
    .set({
      margin: 0,
      filename: `PawNet_Receipt_${donation.transactionId}.pdf`,
      image: { type: 'jpeg', quality: 1 },
      html2canvas: { scale: 2, useCORS: true, windowWidth: 794 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    })
    .from(element)
    .save();
}
