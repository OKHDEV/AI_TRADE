// 메리츠 AI 자동 주식 트레이더 랜딩 웹사이트 인터랙티브 3D 모션 그래픽 엔진
(function() {
  'use strict';

  // 1. 마우스 반응형 3D 커서 조명 스팟라이트
  const glow = document.getElementById('mouseGlow');
  if (glow) {
    window.addEventListener('mousemove', (e) => {
      glow.style.left = e.clientX + 'px';
      glow.style.top = e.clientY + 'px';
    });
  }

  // 2. 3D 입체 스크롤 등장 & 무한 재실행 애니메이션 (Intersection Observer)
  const revealElements = document.querySelectorAll('.reveal-3d');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
        } else {
          // 스크롤 올려서 화면 밖으로 벗어났을 때 클래스를 제거하여
          // 다시 스크롤을 내릴 때 언제든 100% 모션이 다시 재생되도록 보장!
          entry.target.classList.remove('active');
        }
      });
    }, {
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px'
    });

    revealElements.forEach((el) => observer.observe(el));
  } else {
    revealElements.forEach((el) => el.classList.add('active'));
  }

  // 3. 카드 마우스 호버 3D 입체 틸트 (Tilt Effect)
  const tiltCards = document.querySelectorAll('.tilt-card');
  tiltCards.forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const deltaX = (x - centerX) / centerX;
      const deltaY = (y - centerY) / centerY;

      // 입체 회전 각도 제한 (-8도 ~ +8도)
      const rotX = -deltaY * 9;
      const rotY = deltaX * 9;

      card.style.transform = `perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-6px) scale(1.02)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0) scale(1)';
    });
  });

  // 4. 히어로 인터랙티브 3D 주식 차트 + 사이버 퀀트 파티클 엔진
  const canvas = document.getElementById('heroCanvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let width = canvas.width = canvas.parentElement.clientWidth - 44;
    let height = canvas.height = 240;

    window.addEventListener('resize', () => {
      if (canvas && canvas.parentElement) {
        width = canvas.width = canvas.parentElement.clientWidth - 44;
        height = canvas.height = 240;
      }
    });

    // 20개 합성 캔들스틱 데이터
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

    // 공중 부양 퀀트 데이터 파티클 35개
    const particles = [];
    for (let i = 0; i < 35; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 2 + 0.8,
        speed: Math.random() * 0.4 + 0.2,
        alpha: Math.random() * 0.6 + 0.2
      });
    }

    let hoveredIndex = candles.length - 1;
    let animPulse = 0;
    let scanLineX = 0;

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

      const padTop = 32;
      const padBottom = 35;
      const chartH = height - padTop - padBottom;
      const step = width / candles.length;

      const minP = 57500;
      const maxP = 65500;
      const priceToY = (p) => padTop + chartH - ((p - minP) / (maxP - minP)) * chartH;

      // 1. 공중 부양 퀀트 데이터 파티클
      particles.forEach((pt) => {
        pt.y -= pt.speed;
        if (pt.y < 0) {
          pt.y = height;
          pt.x = Math.random() * width;
        }
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(56, 189, 248, ${pt.alpha})`;
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 4;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // 2. 은은한 3D 배경 그리드 라인
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      for (let p = 58000; p <= 65000; p += 2000) {
        const y = priceToY(p);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // 3. 거래량 바 & 캔들스틱 그리기
      candles.forEach((c, i) => {
        const cx = i * step + step / 2;
        const bw = Math.max(3, step * 0.6);
        const isUp = c.c >= c.o;
        const col = isUp ? '#f43f5e' : '#38bdf8';

        // 볼륨 바 (하단)
        const vH = (c.v / 900) * 35;
        ctx.fillStyle = isUp ? 'rgba(244, 63, 94, 0.28)' : 'rgba(56, 189, 248, 0.28)';
        ctx.fillRect(cx - bw / 2, height - vH, bw, vH);

        // 꼬리선
        ctx.strokeStyle = col;
        ctx.lineWidth = 1.3;
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

      // 4. AI 골든크로스 상승 추세 곡선 (네온 발광)
      ctx.beginPath();
      candles.forEach((c, i) => {
        const cx = i * step + step / 2;
        const cy = priceToY(c.c) - 4;
        if (i === 0) ctx.moveTo(cx, cy);
        else ctx.lineTo(cx, cy);
      });
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 12;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // 5. 실시간 AI 스캐닝 레이저 라인 (좌에서 우로 통과)
      scanLineX = (scanLineX + 1.2) % width;
      const grad = ctx.createLinearGradient(scanLineX - 30, 0, scanLineX + 5, 0);
      grad.addColorStop(0, 'rgba(56, 189, 248, 0)');
      grad.addColorStop(0.8, 'rgba(56, 189, 248, 0.15)');
      grad.addColorStop(1, 'rgba(56, 189, 248, 0.45)');
      ctx.fillStyle = grad;
      ctx.fillRect(scanLineX - 30, 0, 35, height);

      // 6. 호버 또는 현재 캔들 십자선 & 펄스 레이더
      const cur = candles[hoveredIndex];
      const hx = hoveredIndex * step + step / 2;
      const hy = priceToY(cur.c);

      ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(hx, 0);
      ctx.lineTo(hx, height);
      ctx.moveTo(0, hy);
      ctx.lineTo(width, hy);
      ctx.stroke();
      ctx.setLineDash([]);

      animPulse = (animPulse + 0.05) % (Math.PI * 2);
      const pr = 4 + Math.sin(animPulse) * 3;
      ctx.beginPath();
      ctx.arc(hx, hy, pr, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 14;
      ctx.fill();
      ctx.shadowBlur = 0;

      // 상단 고대비 정보 텍스트
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 12.5px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`종가: ${cur.c.toLocaleString()}원 (+1,200원, +2.05%) | 거래량: ${(cur.v * 1000).toLocaleString()}주`, 10, 18);

      requestAnimationFrame(drawChart);
    }

    drawChart();
  }

  // 5. 실시간 숫자 카운트업 엔진 (스크롤 올렸다 내릴 때마다 무한 재실행)
  const countElements = document.querySelectorAll('.counter-val');
  if ('IntersectionObserver' in window) {
    const countObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const el = entry.target;
        const target = parseFloat(el.getAttribute('data-target'));
        const suffix = el.getAttribute('data-suffix') || '';
        const decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);

        if (entry.isIntersecting) {
          let start = 0;
          const duration = 1400;
          const startTime = performance.now();

          function updateCounter(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeOut = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
            const currentVal = (start + (target - start) * easeOut).toFixed(decimals);
            el.textContent = currentVal + suffix;

            if (progress < 1) {
              requestAnimationFrame(updateCounter);
            }
          }
          requestAnimationFrame(updateCounter);
        } else {
          // 화면 밖으로 나가면 리셋 -> 다시 스크롤해 들어올 때 0부터 카운트업 재재생!
          el.textContent = (0).toFixed(decimals) + suffix;
        }
      });
    }, { threshold: 0.25 });

    countElements.forEach((el) => countObserver.observe(el));
  }

  // 6. 실시간 시세 티커 동적 갱신
  function updateTickerPrices() {
    const items = document.querySelectorAll('.ticker-item .rate-up');
    items.forEach((item) => {
      const delta = (Math.random() * 0.4 - 0.15).toFixed(2);
      const sign = delta >= 0 ? '+' : '';
      item.textContent = `${sign}${delta}% ▲`;
    });
  }
  setInterval(updateTickerPrices, 3500);

  // 7. 피처 1 인터랙티브 모의 매수 시뮬레이터 (신박한 체험 기능)
  window.simulateHudClick = function(type, btn) {
    if (type === 'buy') {
      btn.style.transform = 'scale(0.92)';
      setTimeout(() => { btn.style.transform = ''; }, 150);

      let toast = document.getElementById('hudBuyToast');
      if (!toast) {
        toast = document.createElement('div');
        toast.id = 'hudBuyToast';
        toast.className = 'hud-live-toast';
        document.body.appendChild(toast);
      }
      toast.innerHTML = `
        <div class="toast-content">
          <span class="toast-icon">⚡</span>
          <div>
            <div class="toast-title">삼성전자 (005930) 1주 체결 완료!</div>
            <div class="toast-sub">체결가: 59,800원 · 메리츠 Open API 초고속 0.02초 직결 완료</div>
          </div>
        </div>
      `;
      toast.classList.add('show');
      clearTimeout(window._toastTimer);
      window._toastTimer = setTimeout(() => {
        toast.classList.remove('show');
      }, 2600);

      const origText = btn.innerHTML;
      btn.innerHTML = '✓ 1주 체결 성공!';
      btn.style.background = 'linear-gradient(135deg, #059669, #10b981)';
      setTimeout(() => {
        btn.innerHTML = origText;
        btn.style.background = '';
      }, 2000);
    } else if (type === 'meritz') {
      let toast = document.getElementById('hudBuyToast');
      if (!toast) {
        toast = document.createElement('div');
        toast.id = 'hudBuyToast';
        toast.className = 'hud-live-toast';
        document.body.appendChild(toast);
      }
      toast.innerHTML = `
        <div class="toast-content">
          <span class="toast-icon">📱</span>
          <div>
            <div class="toast-title">메리츠 SMART 앱 005930 직행</div>
            <div class="toast-sub">스마트폰 설치 시 메리츠증권 공식 호가창으로 다이렉트 이동합니다.</div>
          </div>
        </div>
      `;
      toast.classList.add('show');
      clearTimeout(window._toastTimer);
      window._toastTimer = setTimeout(() => {
        toast.classList.remove('show');
      }, 2600);
    }
  };

  // 8. 피처 2 인터랙티브 60fps 봉차트 터치 & 드래그 탐색 엔진
  const f2Canvas = document.getElementById('dragChartCanvas');
  if (f2Canvas) {
    const f2Ctx = f2Canvas.getContext('2d');
    let f2W = f2Canvas.width = f2Canvas.parentElement.clientWidth || 360;
    let f2H = f2Canvas.height = 130;

    window.addEventListener('resize', () => {
      if (f2Canvas && f2Canvas.parentElement) {
        f2W = f2Canvas.width = f2Canvas.parentElement.clientWidth;
        f2H = f2Canvas.height = 130;
        drawF2Chart();
      }
    });

    const f2Candles = [
      { d: "10/01", o: 56500, c: 57200, h: 57400, l: 56300, v: 9800 },
      { d: "10/02", o: 57200, c: 56900, h: 57500, l: 56700, v: 8400 },
      { d: "10/05", o: 56900, c: 57800, h: 58000, l: 56800, v: 11200 },
      { d: "10/06", o: 57800, c: 58200, h: 58500, l: 57600, v: 13500 },
      { d: "10/07", o: 58200, c: 57900, h: 58400, l: 57700, v: 9100 },
      { d: "10/08", o: 57900, c: 58600, h: 58900, l: 57800, v: 14200 },
      { d: "10/12", o: 58600, c: 58300, h: 58800, l: 58100, v: 8900 },
      { d: "10/13", o: 58300, c: 59100, h: 59400, l: 58200, v: 16800 },
      { d: "10/14", o: 59100, c: 58900, h: 59300, l: 58700, v: 10400 },
      { d: "10/15", o: 58900, c: 59700, h: 60100, l: 58800, v: 21500 },
      { d: "10/16", o: 59700, c: 59400, h: 59900, l: 59200, v: 12300 },
      { d: "10/19", o: 59400, c: 60300, h: 60600, l: 59300, v: 24500 },
      { d: "10/20", o: 60300, c: 60000, h: 60500, l: 59800, v: 13100 },
      { d: "10/21", o: 60000, c: 60800, h: 61200, l: 59900, v: 27800 },
      { d: "10/22", o: 60800, c: 60500, h: 61000, l: 60200, v: 15400 },
      { d: "10/25", o: 58900, c: 59800, h: 60100, l: 58600, v: 14205 }
    ];

    let f2Idx = f2Candles.length - 1;

    function updateF2Hud(idx) {
      const c = f2Candles[idx];
      const dateEl = document.getElementById('feat2Date');
      const closeEl = document.getElementById('feat2Close');
      const detEl = document.getElementById('feat2Details');
      const isUp = c.c >= c.o;
      const diff = c.c - c.o;
      const pct = ((diff / c.o) * 100).toFixed(2);
      const sign = diff >= 0 ? '+' : '';

      if (dateEl) dateEl.textContent = `오늘 ${c.d}`;
      if (closeEl) {
        closeEl.textContent = `${c.c.toLocaleString()}원 (${sign}${diff.toLocaleString()}원, ${sign}${pct}%)`;
        closeEl.style.color = isUp ? '#f87171' : '#38bdf8';
      }
      if (detEl) {
        detEl.textContent = `시가 ${c.o.toLocaleString()} | 고가 ${c.h.toLocaleString()} | 저가 ${c.l.toLocaleString()} | 거래량 ${(c.v * 1000).toLocaleString()}주`;
      }
    }

    function drawF2Chart() {
      f2Ctx.clearRect(0, 0, f2W, f2H);
      const step = f2W / f2Candles.length;
      const padTop = 18;
      const padBot = 22;
      const h = f2H - padTop - padBot;
      const minP = 55800;
      const maxP = 61800;
      const toY = (p) => padTop + h - ((p - minP) / (maxP - minP)) * h;

      // 캔들 및 거래량
      f2Candles.forEach((c, i) => {
        const cx = i * step + step / 2;
        const bw = Math.max(4, step * 0.6);
        const isUp = c.c >= c.o;
        const col = isUp ? '#f43f5e' : '#38bdf8';

        // 거래량 바
        const vh = (c.v / 28000) * 24;
        f2Ctx.fillStyle = isUp ? 'rgba(244,63,94,0.3)' : 'rgba(56,189,248,0.3)';
        f2Ctx.fillRect(cx - bw / 2, f2H - vh, bw, vh);

        // 꼬리선
        f2Ctx.strokeStyle = col;
        f2Ctx.lineWidth = 1.2;
        f2Ctx.beginPath();
        f2Ctx.moveTo(cx, toY(c.h));
        f2Ctx.lineTo(cx, toY(c.l));
        f2Ctx.stroke();

        // 몸통
        const yTop = Math.min(toY(c.o), toY(c.c));
        const bh = Math.max(2, Math.abs(toY(c.o) - toY(c.c)));
        f2Ctx.fillStyle = col;
        f2Ctx.fillRect(cx - bw / 2, yTop, bw, bh);
      });

      // 인터랙티브 십자선
      const cur = f2Candles[f2Idx];
      const hx = f2Idx * step + step / 2;
      const hy = toY(cur.c);

      f2Ctx.strokeStyle = '#38bdf8';
      f2Ctx.setLineDash([2, 2]);
      f2Ctx.lineWidth = 1;
      f2Ctx.beginPath();
      f2Ctx.moveTo(hx, 0); f2Ctx.lineTo(hx, f2H);
      f2Ctx.moveTo(0, hy); f2Ctx.lineTo(f2W, hy);
      f2Ctx.stroke();
      f2Ctx.setLineDash([]);

      // 타겟 펄스 원
      f2Ctx.beginPath();
      f2Ctx.arc(hx, hy, 4, 0, Math.PI * 2);
      f2Ctx.fillStyle = '#fff';
      f2Ctx.shadowColor = '#38bdf8';
      f2Ctx.shadowBlur = 10;
      f2Ctx.fill();
      f2Ctx.shadowBlur = 0;
    }

    function handleMove(e) {
      const rect = f2Canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const x = clientX - rect.left;
      const step = f2W / f2Candles.length;
      const idx = Math.max(0, Math.min(f2Candles.length - 1, Math.floor(x / step)));
      if (idx !== f2Idx) {
        f2Idx = idx;
        updateF2Hud(f2Idx);
        drawF2Chart();
      }
      const hint = document.querySelector('.chart-drag-hint');
      if (hint) hint.style.opacity = '0';
    }

    f2Canvas.addEventListener('mousemove', handleMove);
    f2Canvas.addEventListener('touchmove', handleMove, { passive: true });
    drawF2Chart();
    updateF2Hud(f2Idx);
  }

  // 9. 피처 4 '초보자 쉬운 모드' 탭 전환 시뮬레이터
  window.switchEasyStock = function(tabName, chipEl) {
    const parent = chipEl.parentElement;
    parent.querySelectorAll('.easy-chip').forEach(c => c.classList.remove('active'));
    chipEl.classList.add('active');

    const stockData = {
      top10: { name: "삼성전자 (005930)", tag: "시가총액 1위 · 반도체/AI", price: "59,800원", score: "AI점수 96점 (적극추천)", up: true },
      safety: { name: "현대차 (005380)", tag: "배당수익률 6.2% · 안전 우량주", price: "248,500원", score: "AI점수 92점 (안심매수)", up: true },
      all: { name: "SK하이닉스 (000660)", tag: "HBM3E 독점공급 · 퀀트 모멘텀", price: "189,000원", score: "AI점수 95점 (급등포착)", up: true }
    };

    const d = stockData[tabName] || stockData.top10;
    const card = document.getElementById('easyModeStockCard');
    if (card) {
      card.style.opacity = '0';
      card.style.transform = 'translateY(6px)';
      setTimeout(() => {
        card.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div>
              <div style="font-size:16px; font-weight:900; color:#fff;">${d.name}</div>
              <div style="font-size:12px; color:#94a3b8;">${d.tag}</div>
            </div>
            <div style="text-align:right;">
              <div style="font-size:16px; font-weight:900; color:${d.up ? '#f87171' : '#38bdf8'};">${d.price}</div>
              <div style="font-size:11.5px; color:#4ade80; font-weight:800;">${d.score}</div>
            </div>
          </div>
        `;
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      }, 140);
    }
  };

})();
