// 메리츠 AI 자동 주식 트레이더 랜딩 웹사이트 인터랙티브 엔진
(function() {
  'use strict';

  // 1. 히어로 캔버스 인터랙티브 주식 차트 시뮬레이션
  const canvas = document.getElementById('heroCanvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let width = canvas.width = canvas.parentElement.clientWidth - 40;
    let height = canvas.height = 240;

    window.addEventListener('resize', () => {
      if (canvas && canvas.parentElement) {
        width = canvas.width = canvas.parentElement.clientWidth - 40;
        height = canvas.height = 240;
      }
    });

    // 25개 합성 캔들 데이터 생성 (삼성전자 급등 골든크로스 패턴)
    const candles = [
      { o: 58200, c: 58500, h: 58700, l: 58100, v: 120 },
      { o: 58500, c: 58400, h: 58800, l: 58200, v: 95 },
      { o: 58400, c: 58900, h: 59100, l: 58300, v: 140 },
      { o: 58900, c: 58700, h: 59000, l: 58500, v: 110 },
      { o: 58700, c: 59200, h: 59400, l: 58600, v: 180 },
      { o: 59200, c: 59100, h: 59500, l: 58900, v: 130 },
      { o: 59100, c: 59600, h: 59800, l: 59000, v: 210 },
      { o: 59600, c: 59400, h: 59700, l: 59200, v: 150 },
      { o: 59400, c: 60100, h: 60400, l: 59300, v: 280 },
      { o: 60100, c: 60300, h: 60600, l: 59900, v: 240 },
      { o: 60300, c: 60800, h: 61100, l: 60100, v: 320 },
      { o: 60800, c: 60600, h: 61000, l: 60400, v: 200 },
      { o: 60600, c: 61400, h: 61700, l: 60500, v: 410 },
      { o: 61400, c: 61800, h: 62200, l: 61200, v: 460 },
      { o: 61800, c: 62500, h: 62800, l: 61600, v: 540 },
      { o: 62500, c: 62300, h: 62700, l: 62000, v: 330 },
      { o: 62300, c: 63100, h: 63500, l: 62200, v: 620 },
      { o: 63100, c: 63400, h: 63800, l: 62900, v: 580 },
      { o: 63400, c: 64200, h: 64600, l: 63200, v: 750 },
      { o: 64200, c: 64500, h: 64900, l: 64000, v: 820 }
    ];

    let hoveredIndex = candles.length - 1;
    let animPulse = 0;

    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const step = width / candles.length;
      const idx = Math.floor(x / step);
      if (idx >= 0 && idx < candles.length) {
        hoveredIndex = idx;
      }
    });

    canvas.addEventListener('mouseleave', () => {
      hoveredIndex = candles.length - 1;
    });

    function drawChart() {
      ctx.clearRect(0, 0, width, height);

      const padTop = 30;
      const padBottom = 35;
      const chartH = height - padTop - padBottom;
      const step = width / candles.length;

      const minP = 57500;
      const maxP = 65500;
      const priceToY = (p) => padTop + chartH - ((p - minP) / (maxP - minP)) * chartH;

      // 은은한 그리드
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      for (let p = 58000; p <= 65000; p += 2000) {
        const y = priceToY(p);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // 거래량 바 & 캔들스틱 그리기
      candles.forEach((c, i) => {
        const cx = i * step + step / 2;
        const bw = Math.max(3, step * 0.6);
        const isUp = c.c >= c.o;
        const col = isUp ? '#f43f5e' : '#38bdf8';

        // 볼륨 바 (하단)
        const vH = (c.v / 900) * 35;
        ctx.fillStyle = isUp ? 'rgba(244, 63, 94, 0.25)' : 'rgba(56, 189, 248, 0.25)';
        ctx.fillRect(cx - bw / 2, height - vH, bw, vH);

        // 꼬리선
        ctx.strokeStyle = col;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(cx, priceToY(c.h));
        ctx.lineTo(cx, priceToY(c.l));
        ctx.stroke();

        // 몸통
        const yTop = Math.min(priceToY(c.o), priceToY(c.c));
        const bodyH = Math.max(2, Math.abs(priceToY(c.o) - priceToY(c.c)));
        ctx.fillStyle = col;
        ctx.fillRect(cx - bw / 2, yTop, bw, bodyH);
      });

      // AI 골든크로스 상승 추세 곡선 (네온)
      ctx.beginPath();
      candles.forEach((c, i) => {
        const cx = i * step + step / 2;
        const cy = priceToY(c.c) - 4;
        if (i === 0) ctx.moveTo(cx, cy);
        else ctx.lineTo(cx, cy);
      });
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // 호버 또는 현재 캔들 십자선 & 펄스
      const cur = candles[hoveredIndex];
      const hx = hoveredIndex * step + step / 2;
      const hy = priceToY(cur.c);

      ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(hx, 0);
      ctx.lineTo(hx, height);
      ctx.moveTo(0, hy);
      ctx.lineTo(width, hy);
      ctx.stroke();
      ctx.setLineDash([]);

      // 펄스 레이더
      animPulse = (animPulse + 0.05) % (Math.PI * 2);
      const pr = 4 + Math.sin(animPulse) * 3;
      ctx.beginPath();
      ctx.arc(hx, hy, pr, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.shadowBlur = 0;

      // 상단 고대비 정보 텍스트
      ctx.fillStyle = '#f1f5f9';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`종가: ${cur.c.toLocaleString()}원 (+1,200원, +1.9%) | 거래량: ${cur.v * 1000}주`, 8, 18);

      requestAnimationFrame(drawChart);
    }

    drawChart();
  }

  // 2. 실시간 시세 티커 동적 갱신
  function updateTickerPrices() {
    const items = document.querySelectorAll('.ticker-item .rate-up');
    items.forEach((item) => {
      const delta = (Math.random() * 0.4 - 0.15).toFixed(2);
      const sign = delta >= 0 ? '+' : '';
      item.textContent = `${sign}${delta}% ▲`;
    });
  }
  setInterval(updateTickerPrices, 4000);

  // 3. 알림 토스트 헬퍼
  window.showCopyToast = function(text) {
    const toast = document.createElement('div');
    toast.style.position = 'fixed';
    toast.style.bottom = '24px';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.background = '#0f172a';
    toast.style.border = '1.5px solid #38bdf8';
    toast.style.color = '#fff';
    toast.style.padding = '12px 24px';
    toast.style.borderRadius = '30px';
    toast.style.fontSize = '14px';
    toast.style.fontWeight = '800';
    toast.style.zIndex = '999999';
    toast.style.boxShadow = '0 8px 24px rgba(0,0,0,0.7), 0 0 16px rgba(56,189,248,0.4)';
    toast.innerHTML = text;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.4s';
      setTimeout(() => toast.remove(), 400);
    }, 2400);
  };
})();
