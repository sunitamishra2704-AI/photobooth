import { PostcardData, BorderType } from '../types';
import { VINTAGE_STAMPS } from './stamps';

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}

export async function generatePostcardHD(data: PostcardData): Promise<string> {
  const width = 1800;
  const height = 1200;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  // 1. Draw outer Airmail Border
  const borderWidth = 24;
  drawAirmailBorder(ctx, width, height, borderWidth, data.border);

  // 2. Draw Cream Postcard Body
  const cardX = borderWidth;
  const cardY = borderWidth;
  const cardW = width - borderWidth * 2;
  const cardH = height - borderWidth * 2;

  ctx.fillStyle = '#faf2ed';
  ctx.fillRect(cardX, cardY, cardW, cardH);

  // Paper subtle grain simulation
  ctx.fillStyle = 'rgba(210, 198, 188, 0.2)';
  for (let i = 0; i < 400; i++) {
    const rx = cardX + Math.random() * cardW;
    const ry = cardY + Math.random() * cardH;
    ctx.fillRect(rx, ry, 2, 2);
  }

  // Card outline stroke
  ctx.strokeStyle = '#1e1b18';
  ctx.lineWidth = 4;
  ctx.strokeRect(cardX, cardY, cardW, cardH);

  // 3. Washi Tape Top Left
  ctx.save();
  ctx.translate(cardX + 90, cardY + 2);
  ctx.rotate((-4 * Math.PI) / 180);
  ctx.fillStyle = 'rgba(255, 223, 154, 0.88)';
  ctx.fillRect(-60, -14, 120, 28);
  ctx.strokeStyle = 'rgba(30, 27, 24, 0.25)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(-60, -14, 120, 28);
  ctx.restore();

  // 4. Center Divider line (dashed)
  ctx.save();
  ctx.setLineDash([8, 8]);
  ctx.strokeStyle = '#d3c3b5';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(cardX + cardW * 0.51, cardY + 40);
  ctx.lineTo(cardX + cardW * 0.51, cardY + cardH - 40);
  ctx.stroke();
  ctx.restore();

  // 5. LEFT SIDE: Polaroid Frame
  const polW = cardW * 0.42;
  const polH = cardH * 0.84;
  const polCenterX = cardX + cardW * 0.26;
  const polCenterY = cardY + cardH * 0.5;

  ctx.save();
  ctx.translate(polCenterX, polCenterY);
  ctx.rotate((-1.5 * Math.PI) / 180);

  // Polaroid drop shadow
  ctx.fillStyle = 'rgba(30, 27, 24, 0.18)';
  ctx.fillRect(-polW / 2 + 8, -polH / 2 + 8, polW, polH);

  // Polaroid white body
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-polW / 2, -polH / 2, polW, polH);
  ctx.strokeStyle = '#1e1b18';
  ctx.lineWidth = 3.5;
  ctx.strokeRect(-polW / 2, -polH / 2, polW, polH);

  // Photo Area inside Polaroid
  const photoMargin = 22;
  const photoW = polW - photoMargin * 2;
  const photoH = polH - 120; // leaves polaroid chin
  const photoX = -polW / 2 + photoMargin;
  const photoY = -polH / 2 + photoMargin;

  // Background for photo while loading
  ctx.fillStyle = '#eee7e1';
  ctx.fillRect(photoX, photoY, photoW, photoH);

  try {
    const photoImg = await loadImage(data.photoUrl);
    ctx.save();
    ctx.beginPath();
    ctx.rect(photoX, photoY, photoW, photoH);
    ctx.clip();

    // Apply Filter
    applyCanvasFilter(ctx, data.filter);

    // Cover crop the image
    const imgRatio = photoImg.width / photoImg.height;
    const boxRatio = photoW / photoH;
    let sW, sH, sX, sY;
    if (imgRatio > boxRatio) {
      sH = photoImg.height;
      sW = sH * boxRatio;
      sX = (photoImg.width - sW) / 2;
      sY = 0;
    } else {
      sW = photoImg.width;
      sH = sW / boxRatio;
      sX = 0;
      sY = (photoImg.height - sH) / 2;
    }
    ctx.drawImage(photoImg, sX, sY, sW, sH, photoX, photoY, photoW, photoH);
    ctx.restore();
  } catch {
    // Fallback if image fails to load
    ctx.fillStyle = '#d7ccc8';
    ctx.fillRect(photoX, photoY, photoW, photoH);
    ctx.fillStyle = '#5d4037';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('POSTCARD SNAP', photoX + photoW / 2, photoY + photoH / 2);
  }

  // Photo border
  ctx.strokeStyle = '#1e1b18';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(photoX, photoY, photoW, photoH);

  // Retro Stamp Watermark on photo top-right
  if (data.stampWatermark) {
    ctx.save();
    ctx.fillStyle = '#b71607';
    ctx.fillRect(photoX + photoW - 130, photoY + 14, 116, 28);
    ctx.strokeStyle = '#1e1b18';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(photoX + photoW - 130, photoY + 14, 116, 28);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px "Space Grotesk", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(data.stampWatermark, photoX + photoW - 72, photoY + 33);
    ctx.restore();
  }

  // Polaroid Chin text
  ctx.fillStyle = '#1e1b18';
  ctx.font = 'bold 15px "Space Grotesk", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(data.chinDateText || 'JULY 24 • BOOTH #04', photoX + 4, photoY + photoH + 46);

  ctx.fillStyle = '#b71607';
  ctx.font = 'bold 32px "Caveat", cursive';
  ctx.textAlign = 'right';
  ctx.fillText(data.chinHandwrittenText || 'smiles forever ♡', photoX + photoW - 4, photoY + photoH + 50);

  // Certified retro badge on polaroid corner
  ctx.save();
  ctx.translate(polW / 2 - 10, polH / 2 - 10);
  ctx.rotate((8 * Math.PI) / 180);
  ctx.fillStyle = '#fec736';
  ctx.fillRect(-90, -18, 180, 36);
  ctx.strokeStyle = '#1e1b18';
  ctx.lineWidth = 2;
  ctx.strokeRect(-90, -18, 180, 36);
  ctx.fillStyle = '#1e1b18';
  ctx.font = 'bold 13px "Space Grotesk", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('★ CERTIFIED RETRO ★', 0, 5);
  ctx.restore();

  ctx.restore(); // end polaroid

  // 6. RIGHT SIDE: Postcard Back
  const rightX = cardX + cardW * 0.54;
  const rightW = cardW * 0.43;

  // Postmark Cancellation Rubber Stamp
  const cancelX = rightX + 10;
  const cancelY = cardY + 50;
  drawCancellationMark(ctx, cancelX, cancelY, data.cancellationTitle, data.cancellationLocation, data.cancellationDate);

  // Postage Stamp on the top-right
  const stampW = 120;
  const stampH = 150;
  const stampX = rightX + rightW - stampW - 10;
  const stampY = cardY + 45;

  ctx.save();
  ctx.translate(stampX + stampW / 2, stampY + stampH / 2);
  ctx.rotate((2 * Math.PI) / 180);
  ctx.fillStyle = 'rgba(30, 27, 24, 0.15)';
  ctx.fillRect(-stampW / 2 + 4, -stampH / 2 + 4, stampW, stampH);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-stampW / 2, -stampH / 2, stampW, stampH);
  ctx.strokeStyle = '#1e1b18';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(-stampW / 2, -stampH / 2, stampW, stampH);

  // Perforated stamp edge dots
  ctx.fillStyle = '#faf2ed';
  for (let px = -stampW / 2; px <= stampW / 2; px += 10) {
    ctx.beginPath();
    ctx.arc(px, -stampH / 2, 2.5, 0, Math.PI * 2);
    ctx.arc(px, stampH / 2, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
  for (let py = -stampH / 2; py <= stampH / 2; py += 10) {
    ctx.beginPath();
    ctx.arc(-stampW / 2, py, 2.5, 0, Math.PI * 2);
    ctx.arc(stampW / 2, py, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw Selected Stamp Artwork
  const currentStamp = VINTAGE_STAMPS.find((s) => s.id === data.stampId) || VINTAGE_STAMPS[0];
  try {
    const stampImg = await loadImage(currentStamp.imageUrl);
    ctx.drawImage(stampImg, -stampW / 2 + 6, -stampH / 2 + 6, stampW - 12, stampH - 12);
  } catch {
    ctx.fillStyle = '#fce7d2';
    ctx.fillRect(-stampW / 2 + 6, -stampH / 2 + 6, stampW - 12, stampH - 12);
    ctx.fillStyle = '#b71607';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('POSTAGE', 0, 0);
  }
  ctx.restore();

  // Wavy ink cancellation lines across the stamp
  ctx.save();
  ctx.strokeStyle = 'rgba(183, 22, 7, 0.7)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 4; i++) {
    const wy = stampY + 40 + i * 16;
    ctx.beginPath();
    ctx.moveTo(cancelX + 160, wy);
    for (let wx = cancelX + 160; wx < stampX + stampW + 20; wx += 20) {
      ctx.quadraticCurveTo(wx + 10, wy - 6, wx + 20, wy);
    }
    ctx.stroke();
  }
  ctx.restore();

  // Handwritten Note Area
  const noteBoxY = cardY + 230;
  const noteBoxH = 340;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(rightX, noteBoxY, rightW, noteBoxH);
  ctx.strokeStyle = '#1e1b18';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(rightX, noteBoxY, rightW, noteBoxH);

  // Handwritten note box header
  ctx.strokeStyle = '#e5beb7';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(rightX + 14, noteBoxY + 36);
  ctx.lineTo(rightX + rightW - 14, noteBoxY + 36);
  ctx.stroke();

  ctx.fillStyle = '#5c403b';
  ctx.font = 'bold 14px "Space Grotesk", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('✎ HANDWRITTEN NOTE', rightX + 16, noteBoxY + 25);

  // Message in Caveat cursive
  ctx.fillStyle = '#1e1b18';
  ctx.font = '36px "Caveat", cursive';
  const text = data.noteText || '"Best night ever with the crew! ✨ Don\'t forget this moment."';
  wrapText(ctx, `"${text.replace(/^"|"$/g, '')}"`, rightX + 24, noteBoxY + 80, rightW - 48, 44);

  // Ruled lines below message
  ctx.strokeStyle = 'rgba(30, 27, 24, 0.15)';
  ctx.lineWidth = 1.5;
  for (let lineY = noteBoxY + 230; lineY < noteBoxY + noteBoxH - 15; lineY += 40) {
    ctx.beginPath();
    ctx.moveTo(rightX + 20, lineY);
    ctx.lineTo(rightX + rightW - 20, lineY);
    ctx.stroke();
  }

  // Postcard Recipient Address Lines
  const addressY = noteBoxY + noteBoxH + 40;
  ctx.fillStyle = '#5c403b';
  ctx.font = 'bold 16px "Space Grotesk", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('TO:', rightX, addressY);

  ctx.fillStyle = '#1e1b18';
  ctx.font = 'bold 22px "Space Grotesk", sans-serif';
  ctx.fillText(data.recipientTo || 'The Best Friends Forever', rightX + 60, addressY);

  ctx.strokeStyle = '#1e1b18';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(rightX, addressY + 12);
  ctx.lineTo(rightX + rightW, addressY + 12);
  ctx.stroke();

  const atY = addressY + 70;
  ctx.fillStyle = '#5c403b';
  ctx.font = 'bold 16px "Space Grotesk", sans-serif';
  ctx.fillText('AT:', rightX, atY);

  ctx.fillStyle = '#1e1b18';
  ctx.font = 'bold 22px "Space Grotesk", sans-serif';
  ctx.fillText(data.recipientAt || 'Arcade Lane, Booth #04', rightX + 60, atY);

  ctx.beginPath();
  ctx.moveTo(rightX, atY + 12);
  ctx.lineTo(rightX + rightW, atY + 12);
  ctx.stroke();

  return canvas.toDataURL('image/png', 0.95);
}

function drawAirmailBorder(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  thickness: number,
  borderType: BorderType
) {
  let c1 = '#db3320';
  let c2 = '#00685c';
  let cBg = '#ffffff';

  if (borderType === 'gold') {
    c1 = '#d97706';
    c2 = '#b45309';
    cBg = '#fffbeb';
  } else if (borderType === 'mint') {
    c1 = '#0d9488';
    c2 = '#8b5cf6';
    cBg = '#f0fdfa';
  } else if (borderType === 'coral') {
    c1 = '#f43f5e';
    c2 = '#ea580c';
    cBg = '#fff1f2';
  } else if (borderType === 'noir') {
    c1 = '#18181b';
    c2 = '#52525b';
    cBg = '#ffffff';
  }

  // Draw full pattern background
  ctx.save();
  const patternCanvas = document.createElement('canvas');
  patternCanvas.width = 40;
  patternCanvas.height = 40;
  const pctx = patternCanvas.getContext('2d')!;
  pctx.fillStyle = cBg;
  pctx.fillRect(0, 0, 40, 40);

  // Diagonal stripes
  pctx.fillStyle = c1;
  pctx.beginPath();
  pctx.moveTo(0, 12);
  pctx.lineTo(12, 0);
  pctx.lineTo(0, 0);
  pctx.fill();

  pctx.beginPath();
  pctx.moveTo(0, 40);
  pctx.lineTo(40, 0);
  pctx.lineTo(32, 0);
  pctx.lineTo(0, 32);
  pctx.fill();

  pctx.fillStyle = c2;
  pctx.beginPath();
  pctx.moveTo(0, 20);
  pctx.lineTo(20, 0);
  pctx.lineTo(32, 0);
  pctx.lineTo(0, 32);
  pctx.fill();

  pctx.beginPath();
  pctx.moveTo(20, 40);
  pctx.lineTo(40, 20);
  pctx.lineTo(40, 32);
  pctx.lineTo(32, 40);
  pctx.fill();

  const pattern = ctx.createPattern(patternCanvas, 'repeat');
  if (pattern) {
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, w, h);
  } else {
    ctx.fillStyle = c1;
    ctx.fillRect(0, 0, w, h);
  }
  ctx.restore();
}

function drawCancellationMark(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  title: string,
  location: string,
  date: string
) {
  ctx.save();
  ctx.translate(x + 80, y + 50);
  ctx.rotate((-6 * Math.PI) / 180);

  ctx.strokeStyle = '#b71607';
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 3]);
  ctx.strokeRect(-80, -45, 160, 90);
  ctx.setLineDash([]);

  ctx.fillStyle = '#b71607';
  ctx.font = 'bold 11px "Space Grotesk", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title || 'AIR MAIL • EXPRESS', 0, -25);

  ctx.strokeStyle = '#b71607';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-70, -18);
  ctx.lineTo(70, -18);
  ctx.stroke();

  ctx.font = 'bold 16px "Bricolage Grotesque", sans-serif';
  ctx.fillText(location || 'LOS ANGELES, CA', 0, 5);

  ctx.font = '10px "Space Grotesk", monospace';
  ctx.fillText(date || 'JUL 24 • 1974 • POSTED', 0, 26);

  ctx.restore();
}

function applyCanvasFilter(ctx: CanvasRenderingContext2D, filter: string) {
  switch (filter) {
    case 'golden':
      ctx.filter = 'sepia(0.35) saturate(1.4) contrast(1.1) brightness(1.05)';
      break;
    case 'bw':
      ctx.filter = 'grayscale(1) contrast(1.45) brightness(0.95)';
      break;
    case 'pastel':
      ctx.filter = 'saturate(0.85) contrast(0.95) brightness(1.12) hue-rotate(15deg)';
      break;
    case 'kodak':
      ctx.filter = 'contrast(1.25) saturate(1.35) brightness(1.02) sepia(0.18)';
      break;
    case 'flash':
      ctx.filter = 'contrast(1.3) saturate(1.5) brightness(1.1)';
      break;
    case 'cyan':
      ctx.filter = 'contrast(1.15) hue-rotate(170deg) saturate(0.9) brightness(1.05)';
      break;
    case 'sepia':
      ctx.filter = 'sepia(0.85) contrast(1.1) brightness(0.95)';
      break;
    case 'analog':
      ctx.filter = 'contrast(1.15) saturate(0.7) brightness(0.95) sepia(0.25)';
      break;
    default:
      ctx.filter = 'none';
  }
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const words = text.split(' ');
  let line = '';
  let curY = y;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line, x, curY);
      line = words[n] + ' ';
      curY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, curY);
}
