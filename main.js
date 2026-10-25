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

  // 2. 3D 입체 스크롤 등장 애니메이션 (Intersection Observer)
  const revealElements = document.querySelectorAll('.reveal-3d');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry, idx) => {
        if (entry.isIntersecting) {
          // 살짝 시차(stagger)를 주어 도미노처럼 입체적으로 등장
          setTimeout(() => {
            entry.target.classList.add('active');
          }, (idx % 4) * 100);
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

    // 25개 합성 캔들스틱 데이터
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

    // 공중 부양 퀀트 데이터 파티클 30개
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

  // 5. 실시간 숫자 카운트업 애니메이션 (Counter Engine)
  const countElements = document.querySelectorAll('.counter-val');
  if ('IntersectionObserver' in window) {
    const countObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = parseFloat(el.getAttribute('data-target'));
          const suffix = el.getAttribute('data-suffix') || '';
          const decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
          let start = 0;
          const duration = 1500;
          const startTime = performance.now();

          function updateCounter(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out expo
            const easeOut = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
            const currentVal = (start + (target - start) * easeOut).toFixed(decimals);
            el.textContent = currentVal + suffix;

            if (progress < 1) {
              requestAnimationFrame(updateCounter);
            }
          }

          requestAnimationFrame(updateCounter);
          countObserver.unobserve(el);
        }
      });
    }, { threshold: 0.5 });

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

})();
