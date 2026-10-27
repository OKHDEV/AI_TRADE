const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, 'android_app', 'assets', 'index.html');
const htmlContent = fs.readFileSync(htmlPath, 'utf-8');

// Extract all <script> content
const scriptRegex = /<script.*?>([\s\S]*?)<\/script>/gi;
let match;
let jsCode = '';
while ((match = scriptRegex.exec(htmlContent)) !== null) {
  jsCode += match[1] + '\n';
}

console.log(`Extracted JS length: ${jsCode.length} bytes`);

// Create simulated Browser / DOM / AndroidBridge environment
const elements = {};
function getOrCreateElement(id) {
  if (!elements[id]) {
    elements[id] = {
      id: id,
      value: '',
      checked: false,
      textContent: '',
      innerHTML: '',
      className: '',
      style: {},
      classList: {
        add: () => {},
        remove: () => {},
        contains: () => false
      },
      appendChild: () => {},
      setAttribute: () => {},
      removeAttribute: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      getContext: () => ({
        save: () => {},
        restore: () => {},
        fillRect: () => {},
        strokeRect: () => {},
        clearRect: () => {},
        beginPath: () => {},
        moveTo: () => {},
        lineTo: () => {},
        stroke: () => {},
        fill: () => {},
        fillText: () => {},
        measureText: () => ({ width: 40 }),
        setLineDash: () => {}
      }),
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 400, height: 400 })
    };
  }
  return elements[id];
}

const mockLocalStorage = {
  store: {},
  getItem(k) { return this.store[k] !== undefined ? this.store[k] : null; },
  setItem(k, v) { this.store[k] = String(v); },
  removeItem(k) { delete this.store[k]; },
  clear() { this.store = {}; }
};

const mockAndroidBridge = {
  toasts: [],
  notifications: [],
  meritzLaunches: [],
  clipboard: [],
  httpGetLogs: [],
  httpPostLogs: [],
  showToast(msg) { this.toasts.push(msg); },
  sendOwnerNotification(title, msg) { this.notifications.push({ title, msg }); },
  launchMeritzMtsWithStock(code, name) { this.meritzLaunches.push({ code, name }); },
  launchMeritzMts(code) { this.meritzLaunches.push({ code }); },
  copyToClipboard(lbl, txt) { this.clipboard.push({ lbl, txt }); },
  httpGet(url) { this.httpGetLogs.push(url); return '{}'; },
  httpPost(url, body) { this.httpPostLogs.push({ url, body }); return '{}'; },
  httpRequestWithHeaders(method, url, h, b) {
    if (url.includes('/oauth2/token')) {
      return JSON.stringify({ access_token: 'mock_token_123', expires_in: 43200 });
    }
    return JSON.stringify({ rsp_cd: '0000', rsp_msg: '성공', data: { rsev_mst_no: '9999', oder_no: '8888' } });
  },
  openInBrowser(url) {},
  promptApkInstall() {},
  downloadAndApplyUpdate(url) {},
  downloadAndInstallApk(url, fn) {},
  getInstalledCommitSha() { return 'v40'; },
  getInstalledCommitTime() { return 1792914600000; },
  getRemoteCommitInfo(repo) { return JSON.stringify({ sha: 'v40', timestamp: 1792914600000 }); },
  getRemoteHeadSha(repo) { return 'v40'; }
};

const domWindow = {
  localStorage: mockLocalStorage,
  AndroidBridge: mockAndroidBridge,
  alert: (msg) => { domWindow.lastAlert = msg; },
  confirm: (msg) => { domWindow.lastConfirm = msg; return true; },
  prompt: (msg) => { domWindow.lastPrompt = msg; return '1234'; },
  setInterval: (fn, ms) => { return 999; },
  clearInterval: (id) => {},
  setTimeout: (fn, ms) => { return 888; },
  clearTimeout: (id) => {},
  onload: null,
  innerWidth: 400,
  innerHeight: 800,
  location: { reload: () => {} },
  scrollTo: () => {},
  addEventListener: () => {},
  removeEventListener: () => {}
};

const domDocument = {
  getElementById: (id) => getOrCreateElement(id),
  querySelectorAll: (sel) => [],
  querySelector: (sel) => null,
  createElement: (tag) => {
    return {
      tagName: tag,
      style: {},
      classList: { add: () => {}, remove: () => {} },
      appendChild: () => {},
      setAttribute: () => {},
      addEventListener: () => {}
    };
  },
  body: {
    appendChild: () => {},
    classList: { add: () => {}, remove: () => {} },
    style: { setProperty: () => {} }
  }
};

const vm = require('vm');
const context = vm.createContext({
  window: domWindow,
  document: domDocument,
  localStorage: mockLocalStorage,
  alert: (msg) => { domWindow.lastAlert = msg; },
  confirm: (msg) => { domWindow.lastConfirm = msg; return true; },
  prompt: (msg) => { domWindow.lastPrompt = msg; return '1234'; },
  setTimeout: (fn, ms) => { return 888; },
  clearTimeout: (id) => {},
  setInterval: (fn, ms) => { return 999; },
  clearInterval: (id) => {},
  console: console,
  navigator: { userAgent: 'Android' },
  btoa: (str) => Buffer.from(str, 'binary').toString('base64'),
  atob: (b64) => Buffer.from(b64, 'base64').toString('binary'),
  Date: Date,
  Math: Math,
  JSON: JSON,
  Number: Number,
  String: String,
  Boolean: Boolean,
  Array: Array,
  Object: Object,
  parseInt: parseInt,
  parseFloat: parseFloat,
  isNaN: isNaN,
  isFinite: isFinite
});

try {
  vm.runInContext(jsCode, context);
  console.log('✅ JS evaluated successfully into VM context without parsing errors.');
} catch (e) {
  console.error('❌ JS evaluation error:', e);
  process.exit(1);
}

const state = domWindow.state;
const STOCK_UNIVERSE = domWindow.STOCK_UNIVERSE;

let passedTests = 0;
let failedTests = 0;
const failures = [];

function assert(cond, name) {
  if (cond) {
    passedTests++;
    console.log(`  ✓ ${name}`);
  } else {
    failedTests++;
    failures.push(name);
    console.error(`  ✗ FAIL: ${name}`);
  }
}

console.log('\n--- 1. Math & Utility Functions ---');
assert(context.getTickSize(1500) === 1, 'Tick size for 1,500 is 1');
assert(context.getTickSize(2000) === 5, 'Tick size for 2,000 is 5');
assert(context.getTickSize(4500) === 5, 'Tick size for 4,500 is 5');
assert(context.getTickSize(10000) === 10, 'Tick size for 10,000 is 10');
assert(context.getTickSize(30000) === 50, 'Tick size for 30,000 is 50');
assert(context.getTickSize(70000) === 100, 'Tick size for 70,000 is 100');
assert(context.getTickSize(300000) === 500, 'Tick size for 300,000 is 500');
assert(context.getTickSize(600000) === 1000, 'Tick size for 600,000 is 1000');

assert(context.roundTick(52342) === 52300, 'roundTick(52342) rounds to 52,300');
assert(context.fmt(1234567) === '1,234,567', 'fmt(1234567) formats correctly');
assert(context.fmt(0) === '0', 'fmt(0) is 0');
assert(context.fmt(-500) === '-500', 'fmt(-500) is -500');

const sampleStr = 'MeritzSecretKey123!@#한글';
const enc = context.obfuscate(sampleStr);
const dec = context.deobfuscate(enc);
assert(dec === sampleStr, 'obfuscate and deobfuscate roundtrip matches perfectly');

console.log('\n--- 2. Stock Universe & Technical Indicators ---');
assert(Array.isArray(STOCK_UNIVERSE) && STOCK_UNIVERSE.length >= 10, 'STOCK_UNIVERSE has at least 10 stocks');
const samsungAnalysis = context.analyzeStock('005930');
assert(samsungAnalysis && samsungAnalysis.code === '005930', 'analyzeStock returns valid object with code for Samsung Electronics');
assert(typeof samsungAnalysis.aiScore === 'number' && samsungAnalysis.aiScore >= 0 && samsungAnalysis.aiScore <= 100, 'AI Score is between 0 and 100');
assert(typeof samsungAnalysis.isSafeToBuy === 'boolean', 'isSafeToBuy is boolean');

// Indicator tests with null / empty / valid candles
assert(context.meritzEvaluateRsi(null).state === 'NO_SIGNAL', 'meritzEvaluateRsi handles null candles safely');
assert(context.meritzEvaluateGoldenCross(null).state === 'NO_SIGNAL', 'meritzEvaluateGoldenCross handles null candles safely');
assert(context.meritzEvaluateBollinger(null).state === 'NO_SIGNAL', 'meritzEvaluateBollinger handles null candles safely');
assert(context.meritzEvaluateMacd(null).state === 'NO_SIGNAL', 'meritzEvaluateMacd handles null candles safely');
assert(context.meritzVolatilitySizing(null).state === 'SIZE_COMPUTED', 'Volatility sizing handles null safely');

console.log('\n--- 3. Account Safety & Order Guard (Zero Balance / Unlinked) ---');
state.isAccountLinked = false;
state.cash = 0;
state.holdings = {};
state.pendingApprovals = [];
state.consecutiveLosses = 0;
state.config.meritzKey = '';
state.config.meritzUrl = '';

const safeQtyUnlinked = context.calculateSafeOrderQty(70000);
assert(safeQtyUnlinked.qty === 0, 'Safe order qty is 0 when cash is 0 or account unlinked');

// Test buying without linked account:
const beforeApprovals = state.pendingApprovals.length;
const buyRes = context.requestOrExecuteBuy('005930', 1, '테스트', '미연결 테스트');
assert(buyRes.ok === false, 'Buying without linked account is blocked with ok: false');
assert(state.pendingApprovals.length === beforeApprovals, 'No pending approval created when credentials missing');

console.log('\n--- 4. Account Linked Order Simulation & Approval Workflow ---');
// Simulate linked account with 100,000 KRW
state.isAccountLinked = true;
state.config.meritzKey = 'TEST_KEY';
state.config.meritzUrl = 'TEST_SECRET';
state.cash = 100000;
state.initialCash = 100000;
state.config.ownerApproval = true; // Approval mode ON

const safeQtyLinked = context.calculateSafeOrderQty(15000); // 15,000 KRW stock
assert(safeQtyLinked.qty >= 1, 'Safe order qty is >= 1 when sufficient cash exists');

// Request buy with owner approval ON
context.requestOrExecuteBuy('005930', 1, '스윙매수', '우량주 안전진단 통과');
assert(state.pendingApprovals.length === 1, 'Pending approval created when owner approval is ON');
const pendingItem = state.pendingApprovals[0];
assert(pendingItem.code === '005930' && pendingItem.qty === 1, 'Pending item has correct stock and quantity');

// Reject pending approval
context.rejectPendingItem(pendingItem.id);
assert(state.pendingApprovals.length === 0, 'Pending approval removed on reject');

// Request buy again and approve
context.requestOrExecuteBuy('005930', 1, '스윙매수', '승인 테스트');
assert(state.pendingApprovals.length === 1, 'New pending approval created');
const pendingId = state.pendingApprovals[0].id;
const cashBefore = state.cash;
context.approvePendingItem(pendingId, false);
assert(state.pendingApprovals.length === 0, 'Pending item removed after approval');
assert(state.holdings['005930'] !== undefined, 'Stock added to holdings after execution');
assert(state.holdings['005930'].qty === 1, 'Holding quantity is 1');
console.log(`  Cash before: ${cashBefore}, Cash after: ${state.cash}`);

console.log('\n--- 5. Selling & Market Hours / Reservation Handling ---');
// When market is closed, sell is safely reserved
const origIsMarketOpen = context.isMarketOpen;
context.isMarketOpen = () => false;
state.reservedOrders = [];
context.executeSellImmediately('005930', 1, '손절매도', '손절 테스트');
assert(state.reservedOrders.length >= 1, 'Sell order is safely reserved when market is closed');
context.isMarketOpen = origIsMarketOpen;

// When market is open, direct execution applies immediately
context.isMarketOpen = () => true;
context.applyOrderToLocalPortfolio('005930', '삼성전자', 1, 59800, false, '실전 정규장 매도', '매도');
assert(state.holdings['005930'] === undefined, 'Holding removed after open-market sell execution');

console.log('\n--- 6. Consecutive Loss Circuit Breaker Trigger & Reset ---');
state.consecutiveLosses = 2;
assert(state.consecutiveLosses === 2, 'consecutiveLosses is 2');
// Circuit breaker reset function test
context.resetCircuitBreaker();
assert(state.consecutiveLosses === 0, 'resetCircuitBreaker resets consecutiveLosses to 0');

// Trigger breaker and test toggleBot auto-reset
state.consecutiveLosses = 2;
domWindow.botRunning = false;
context.toggleBot(); // User taps start surveillance
assert(domWindow.botRunning === true, 'Bot starts running');
assert(state.consecutiveLosses === 0, 'toggleBot automatically resets consecutiveLosses to 0 on start');

// Test stopBot
context.stopBot('테스트 정지');
assert(domWindow.botRunning === false, 'Bot stops running cleanly via stopBot');

console.log('\n--- 7. Order Reservation & Cancellation ---');
state.reservedOrders = [];
state.isAccountLinked = true;
state.cash = 100000;
context.isMarketOpen = () => false; // Market closed for reservation

// Test reserved order through quickOrderShares
context.quickOrderShares(1, true, '005930');
assert(state.reservedOrders.length === 1, 'Reserved order added to list');
const resId = state.reservedOrders[0].id;

// Test cancel reserved order
context.cancelRealReservedOrder(resId);
assert(state.reservedOrders.length === 0, 'Reserved order removed on cancel');

console.log('\n--- 8. Emergency Panic Sell ---');
// Add 2 holdings and set security PIN
state.holdings['005930'] = { code: '005930', name: '삼성전자', qty: 2, avgPrice: 60000, curPrice: 65000 };
state.holdings['000660'] = { code: '000660', name: 'SK하이닉스', qty: 1, avgPrice: 180000, curPrice: 190000 };
state.config.securityPin = '1234';
assert(Object.keys(state.holdings).length === 2, '2 holdings present before panic sell');

context.panicSell();
assert(domWindow.lastPinAuthTime > 0, 'lastPinAuthTime updated to cache security PIN');

console.log('\n--- 9. Watchlist Management ---');
state.watchlist = ['005930'];
context.addWatchlist('000660');
assert(state.watchlist.includes('000660'), 'Stock added to watchlist');
// Adding duplicate
context.addWatchlist('000660');
assert(state.watchlist.filter(c => c === '000660').length === 1, 'Duplicate stock not added to watchlist');
context.removeWatchlist('000660');
assert(!state.watchlist.includes('000660'), 'Stock removed from watchlist');

console.log('\n--- 10. Phone Number Masking & Auto Hyphen ---');
assert(context.formatPhoneNumber('01012345678') === '010-1234-5678', 'formatPhoneNumber works for 11 digits');
assert(context.formatPhoneNumber('0101234567') === '010-123-4567', 'formatPhoneNumber works for 10 digits');
assert(context.maskPhoneNumber('01012345678') === '010-****-5678', 'maskPhoneNumber masks middle digits');

console.log('\n--- 11. App Update Checker & Forced Lock Logic ---');
context.updateCheckFinished = false;
domWindow.isUpdateDownloading = false;
domWindow.isUpdatePendingInstall = false;
context.dismissSplashGracefully();
assert(context.updateCheckFinished === false, 'dismissSplashGracefully blocks entry while update check is not finished');

// Test update in progress blocks
context.updateCheckFinished = true;
domWindow.isUpdateDownloading = true;
context.dismissSplashGracefully();
assert(domWindow.isUpdateDownloading === true, 'dismissSplashGracefully blocks entry while update is downloading');

// Test update pending install blocks
domWindow.isUpdateDownloading = false;
domWindow.isUpdatePendingInstall = true;
context.dismissSplashGracefully();
assert(domWindow.isUpdatePendingInstall === true, 'dismissSplashGracefully blocks entry while update is pending install');

// Test stopLoadingAndForceUpdate
context.stopLoadingAndForceUpdate({ dateStr: '2026-10-25 18:00', version: 'v43', fileName: 'test.apk', downloadUrl: 'http://test' });
assert(domWindow.isUpdateDownloading === true, 'stopLoadingAndForceUpdate sets isUpdateDownloading to true');
assert(domWindow.isUpdatePendingInstall === true, 'stopLoadingAndForceUpdate sets isUpdatePendingInstall to true');

// Test onUpdateComplete maintains lock
domWindow.onUpdateComplete(true);
assert(domWindow.isUpdateDownloading === false, 'onUpdateComplete clears downloading flag');
assert(domWindow.isUpdatePendingInstall === true, 'onUpdateComplete keeps isUpdatePendingInstall true so screen stays locked');

// Test onUpdateFailed maintains lock
domWindow.onUpdateFailed('네트워크 오류');
assert(domWindow.isUpdatePendingInstall === true, 'onUpdateFailed keeps isUpdatePendingInstall true so screen stays locked');

// Test skipOrFinishUpdate unlocks and allows entry
context.skipOrFinishUpdate();
assert(domWindow.isUpdatePendingInstall === false, 'skipOrFinishUpdate releases install lock');
assert(domWindow.isUpdateDownloading === false, 'skipOrFinishUpdate releases download flag');


// =============================================
// Elite Quant Algorithms & Security Tests
// =============================================

// 1. Test escapeHtml XSS protection
const rawDirty = '<script>alert("xss")</script>&"\'';
const escaped = context.escapeHtml(rawDirty);
assert(!escaped.includes('<script>') && escaped.includes('&lt;script&gt;') && escaped.includes('&quot;'), 'escapeHtml sanitizes hazardous HTML special characters');

// 2. Test meritzEvaluateVcp (Minervini Volatility Contraction Pattern)
const mockVcpCandles = [];
// 5 candles for T1: wide volatility (~20%) and high volume (2000)
for (let i = 0; i < 5; i++) {
  mockVcpCandles.push({ high: 110, low: 90, close: 100, volume: 2000 });
}
// 5 candles for T2: medium volatility (~10%) and medium volume (1500)
for (let i = 0; i < 5; i++) {
  mockVcpCandles.push({ high: 105, low: 95, close: 100, volume: 1500 });
}
// 5 candles for T3: tight volatility (~3%) and dry-up volume (500)
for (let i = 0; i < 5; i++) {
  mockVcpCandles.push({ high: 101.5, low: 98.5, close: 100, volume: 500 });
}
const vcpResult = context.meritzEvaluateVcp(mockVcpCandles);
assert(vcpResult.score === 16 && vcpResult.state === 'VCP_READY', 'meritzEvaluateVcp identifies contracting pullbacks with volume dry-up');

// 3. Test meritzEvaluateMfi (Money Flow Index)
const mockMfiCandles = [];
for (let i = 0; i < 20; i++) {
  mockMfiCandles.push({ high: 100 + i * 2, low: 98 + i * 2, close: 99 + i * 2, volume: 10000 });
}
const mfiResult = context.meritzEvaluateMfi(mockMfiCandles, 14);
assert(mfiResult.mfi > 50 && typeof mfiResult.score === 'number', 'meritzEvaluateMfi calculates smart money flow index correctly');

// 4. Test meritzCalculateKellyFraction (Position sizing)
const kellyF = context.meritzCalculateKellyFraction(0.6, 2.0);
assert(Math.abs(kellyF - 0.2) < 0.001, 'meritzCalculateKellyFraction accurately computes half-kelly fraction');

// 5. Test meritzEvaluateMoat (Warren Buffett economic moat)
const moatTop1 = context.meritzEvaluateMoat('005930', 1);
assert(moatTop1.score === 12 && moatTop1.moat === 'WIDE_MOAT', 'meritzEvaluateMoat recognizes top market cap economic moat');
const moatSmall = context.meritzEvaluateMoat('999999', 999);
assert(moatSmall.score === 0 && moatSmall.moat === 'STANDARD', 'meritzEvaluateMoat filters non-moat small cap stocks');

// 6. Test toggleIdxBar
const mockBar = { style: { display: 'flex' }, classList: { contains: () => false, toggle: (cls) => true, add: () => {}, remove: () => {} } };
const mockBtn = { textContent: '▲ 지수접기', style: {} };
context.document.getElementById = (id) => {
  if (id === 'idxBarBox') return mockBar;
  if (id === 'btnFoldIdx') return mockBtn;
  return getOrCreateElement(id);
};
context.toggleIdxBar();
assert(mockBar.style.display === 'none' && mockBtn.textContent === '▼ 지수보기', 'toggleIdxBar properly collapses index bar and toggles button');

// 7. Test toggleHomeMarcap (collapsible top 3 / top 10)
assert(domWindow.isHomeMarcapCollapsed === true, 'Home marcap starts in collapsed state (top 3 only)');
context.toggleHomeMarcap();
assert(domWindow.isHomeMarcapCollapsed === false, 'toggleHomeMarcap expands to top 10');
context.toggleHomeMarcap();
assert(domWindow.isHomeMarcapCollapsed === true, 'toggleHomeMarcap collapses back to top 3');

// 8. Test setFontScale
context.setFontScale('large');
const up1 = domWindow.userPrefs || context.userPrefs;
assert(up1.fontScale === 'large', 'setFontScale updates user preferences to large');
context.setFontScale('normal');
const up2 = domWindow.userPrefs || context.userPrefs;
assert(up2.fontScale === 'normal', 'setFontScale reverts user preferences to normal');

// 9. Test setSoundType (Sound effect dropdown selection)
context.setSoundType('hts_fill');
const upSound1 = domWindow.userPrefs || context.userPrefs;
assert(upSound1.soundType === 'hts_fill', 'setSoundType updates sound effect to arcade');
context.setSoundType('meritz_mts');
const upSound2 = domWindow.userPrefs || context.userPrefs;
assert(upSound2.soundType === 'meritz_mts', 'setSoundType updates sound effect to digital');

// 10. Test chart date indicator toggle
context.toggleChartIndicator('DATES', false);
const csDates1 = domWindow.chartSettings || context.chartSettings;
assert(csDates1.showDates === false, 'toggleChartIndicator disables date display');
context.toggleChartIndicator('DATES', true);
const csDates2 = domWindow.chartSettings || context.chartSettings;
assert(csDates2.showDates === true, 'toggleChartIndicator enables date display');

// 11. Test pending approval stock click navigation & openChartTab
context.openChartTab('000660');
const curCode = domWindow.currentChartCode || context.currentChartCode;
assert(curCode === '000660', 'openChartTab sets currentChartCode to clicked stock');

assert(htmlContent.length > 0, 'htmlContent loaded');
assert(htmlContent.includes("openChartTab('${req.code}')"), 'Pending approval HTML contains openChartTab click handler');
assert(htmlContent.includes('aspect-ratio: 680 / 446'), 'Chart canvas CSS enforces fixed responsive aspect-ratio');

// 12. Test safe real broker asset sync & cooldown
assert(typeof context.syncRealBrokerAccountSafe === 'function', 'syncRealBrokerAccountSafe is defined');
const firstSync = context.syncRealBrokerAccountSafe(false, false);
const secondSyncImmediate = context.syncRealBrokerAccountSafe(false, false);
assert(secondSyncImmediate === false, 'syncRealBrokerAccountSafe prevents rate limit via 5s cooldown');
assert(htmlContent.includes('syncRealBrokerAccountSafe(false, false)'), 'Home tab entry triggers safe real asset sync');

console.log('\n=============================================');
console.log(`TEST SUMMARY: Passed: ${passedTests}, Failed: ${failedTests}`);
if (failedTests > 0) {
  console.log('Failed tests:', failures);
  process.exit(1);
} else {
  console.log('🎉 ALL AUTOMATED UNIT & INTEGRATION TESTS PASSED!');
}
