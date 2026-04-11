// ============================================================
// UI — Preis-Charts (Canvas)
// ============================================================

function drawChart(coin, color) {
  const canvas = document.getElementById('chart-' + coin);
  if (!canvas) return;

  const ctx     = canvas.getContext('2d');
  const history = G.priceHistory[coin];
  if (!history || history.length < 2) return;

  canvas.width = canvas.offsetWidth || 240;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const min   = Math.min(...history) * 0.98;
  const max   = Math.max(...history) * 1.02;
  const range = max - min || 1;
  const H     = canvas.height;
  const W     = canvas.width;

  // Linie zeichnen
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth   = 2;
  history.forEach((p, i) => {
    const x = (i / (history.length - 1)) * W;
    const y = H - ((p - min) / range) * H * 0.85 - H * 0.05;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.stroke();

  // Gefüllter Bereich (Gradient)
  ctx.lineTo(W, H);
  ctx.lineTo(0, H);
  ctx.closePath();
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, color + '44');
  grad.addColorStop(1, color + '00');
  ctx.fillStyle = grad;
  ctx.fill();
}
