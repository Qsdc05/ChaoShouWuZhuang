/* ============================================================
   超兽武装 · 站点公共脚本
   ============================================================ */
(function(){
"use strict";
const $  = (s, el) => (el||document).querySelector(s);
const $$ = (s, el) => Array.from((el||document).querySelectorAll(s));
const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));

/* 将百度百科整理资料挂接到角色档案；未确认的同名词条不强行映射。 */
if (typeof BAIKE !== "undefined") {
  DB.characters.forEach(c => { if (BAIKE[c.id]) c.baike = BAIKE[c.id]; });
}

/* ---------------- 导航与页脚 ---------------- */
const PAGES = [
  ["index.html","首页"],["world.html","世界观"],["timeline.html","时间线"],["characters.html","角色图鉴"],
  ["relations.html","关系网"],["episodes.html","剧集"],["quotes.html","语录"],["cast.html","配音"]
];
const LOGO_SVG = '<svg class="mark" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">'
  + '<path d="M24 3 L41 12.5 V32 L24 45 L7 32 V12.5 Z" stroke="#087f9f" stroke-width="2.4" fill="rgba(8,127,159,.08)"/>'
  + '<path d="M24 11 L33 16.5 V29 L24 37 L15 29 V16.5 Z" fill="rgba(201,84,75,.12)" stroke="#c9544b" stroke-width="1.8"/>'
  + '<circle cx="24" cy="24" r="4.4" fill="#087f9f"/>'
  + '<circle cx="24" cy="24" r="8" stroke="#087f9f" stroke-opacity=".45" stroke-width="1.2"/>'
  + '</svg>';

function currentPage(){
  const p = location.pathname.split("/").filter(Boolean).pop() || "index.html";
  if (p === "index") return "index.html";
  return p.endsWith(".html") ? p : p + ".html";
}
function buildNav(){
  const nav = document.createElement("nav");
  nav.className = "nav";
  const cur = currentPage();
  nav.innerHTML =
    '<a class="nav-logo" href="index.html">' + LOGO_SVG +
    '<span>超兽武装<small>ULTRA BEAST FORCE</small></span></a>' +
    '<button class="nav-toggle" aria-label="菜单" aria-expanded="false" aria-controls="site-nav">☰</button>' +
    '<ul class="nav-links" id="site-nav">' +
    PAGES.map(p => '<li><a href="' + p[0] + '"' + (p[0]===cur ? ' class="active"' : '') + '>' + p[1] + '</a></li>').join("") +
    '</ul>';
  document.body.prepend(nav);
  const btn = $(".nav-toggle", nav), links = $(".nav-links", nav);
  btn.addEventListener("click", () => { const open = links.classList.toggle("open"); btn.setAttribute("aria-expanded", String(open)); });
  $$("a", links).forEach(a => a.addEventListener("click", () => { links.classList.remove("open"); btn.setAttribute("aria-expanded", "false"); }));
}
function buildFooter(){
  const f = document.createElement("footer");
  f.className = "footer";
  f.innerHTML =
    '<div class="f-title">超兽武装 · ULTRA BEAST FORCE</div>' +
    '<div>七大平行宇宙 · 十万年一轮回 —— 已有的事，后必再有；已行的事，后必再行。</div>' +
    '<div class="f-note">本站为粉丝向资料整理页，内容依据《超兽武装之仁者无敌》《超兽武装之勇者无惧》原动画及公开百科资料整理，仅作学习交流之用。作品版权归原作者及广州蓝弧文化传播有限公司所有。</div>';
  document.body.appendChild(f);
}

/* ---------------- 滚动显现 ---------------- */
function reveal(){
  const items = $$(".reveal");
  if (!("IntersectionObserver" in window)) {
    items.forEach(el => el.classList.add("in"));
    return;
  }
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting){ e.target.classList.add("in"); io.unobserve(e.target); }
  }), { threshold:.08 });
  items.forEach(el => io.observe(el));
}

/* ---------------- 角色卡片HTML ---------------- */
function coverFor(c){
  // 优先使用本站整理的角色素材；原有素材缺失时，使用已下载的百度百科本地图片补位。
  return c.images && c.images.length
    ? c.images[0]
    : (c.baike && c.baike.imagePath ? c.baike.imagePath : null);
}
function charCard(c){
  const cover = coverFor(c);
  const img = cover
    ? '<img src="' + cover + '" alt="' + esc(c.name) + '" loading="lazy">'
    : '<div class="mono">' + esc(c.name[0]) + '</div>';
  const source = c.baike
    ? '<span class="source-badge" title="已整理百度百科动画角色词条">百科</span>'
    : '';
  return '<div class="char-card reveal" style="--c:' + c.color + '" data-id="' + c.id + '">'
    + '<div class="ph">' + img + '<span class="badge">' + esc(DB.factions[c.faction].name) + '</span>' + source + '</div>'
    + '<div class="info"><h3>' + esc(c.name) + '</h3>'
    + '<div class="t">' + esc(c.title) + '</div>'
    + '<div class="s">' + esc(c.brief) + '</div></div></div>';
}
function findChar(id){ return DB.characters.find(c => c.id === id); }

/* ---------------- 角色弹窗 ---------------- */
let modalMask = null;
function ensureModal(){
  if (modalMask) return modalMask;
  modalMask = document.createElement("div");
  modalMask.className = "modal-mask";
  modalMask.innerHTML = '<div class="modal" role="dialog" aria-modal="true">'
    + '<button class="modal-close" aria-label="关闭">✕</button>'
    + '<div class="modal-body"></div></div>';
  document.body.appendChild(modalMask);
  modalMask.addEventListener("click", e => { if (e.target === modalMask) closeModal(); });
  $(".modal-close", modalMask).addEventListener("click", closeModal);
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); });
  return modalMask;
}
function openChar(id){
  const c = findChar(id); if (!c) return;
  ensureModal();
  const body = $(".modal-body", modalMask);
  const b = c.baike || null;
  const imgs = (c.images || []).slice();
  const labels = (c.imageLabels || []).slice();
  if (b && b.imagePath && !imgs.includes(b.imagePath)) {
    imgs.push(b.imagePath);
    labels.push("百度百科词条图");
  }
  const visual = imgs.length
    ? '<div class="imgwrap"><img id="mMainImg" src="' + imgs[0] + '" alt="' + esc(c.name) + '"></div>'
      + (imgs.length > 1
        ? '<div class="thumbs">' + imgs.map((s,i) =>
            '<img src="' + s + '" class="' + (i===0?"on":"") + '" data-i="' + i + '" alt="' + esc(labels[i]||"") + '" title="' + esc(labels[i]||"") + '">').join("") + '</div>'
        : "")
    : '<div class="imgwrap" style="display:flex;align-items:center;justify-content:center;height:340px">'
      + '<div style="font-size:120px;font-weight:900;color:' + c.color + ';text-shadow:0 0 60px ' + c.color + '">' + esc(c.name[0]) + '</div></div>';
  const stats = [
    ["所属宇宙", c.universe], ["种族 / 身份", c.race],
    ["武装", c.arm], ["超兽 / 形态", c.beast],
    ["绝招", c.skill], ["异能量", c.power],
    ["配音", c.va]
  ].filter(x => x[1] && x[1] !== "——");
  const baikeFacts = b ? Object.entries(b.facts || {})
    .filter(([k,v]) => k && v && !["中文名","图片","参考资料"].includes(k))
    .slice(0, 10) : [];
  const baikeBlock = b
    ? '<div class="modal-sec baike-sec"><h4>百度百科资料</h4>'
      + '<p>' + esc(b.summary || b.lemmaDesc || "已找到该动画角色词条。") + '</p>'
      + (baikeFacts.length ? '<div class="baike-facts">' + baikeFacts.map(([k,v]) =>
          '<div class="baike-fact"><span>' + esc(k) + '</span><b>' + esc(v) + '</b></div>').join("") + '</div>' : '')
      + '<div class="baike-actions">'
      + '<span>资料来源：百度百科 · 已整理至本站</span>'
      + '<span>图片已保存为本地副本</span></div></div>'
    : '';
  body.innerHTML =
    '<div class="modal-visual">' + visual + '</div>'
    + '<div class="modal-info" style="--c:' + c.color + '">'
    + '<h2>' + esc(c.name) + '</h2>'
    + (c.alias && c.alias !== "——" ? '<div class="alias">别名 / 称号：' + esc(c.alias) + '</div>' : "")
    + '<div class="title-line">' + esc(c.title) + '</div>'
    + '<div class="tag-row"><span class="tag">' + esc(DB.factions[c.faction].name) + '</span>'
    + '<span class="tag">' + esc(c.universe) + '</span>' + (b ? '<span class="tag tag-source">百度百科</span>' : '') + '</div>'
    + '<div class="stat-grid">' + stats.map(s =>
        '<div class="stat-item"><div class="k">' + esc(s[0]) + '</div><div class="v">' + esc(s[1]) + '</div></div>').join("") + '</div>'
    + '<div class="modal-sec"><h4>性格侧写</h4><p>' + esc(c.personality) + '</p></div>'
    + (c.story ? '<div class="modal-sec"><h4>关键剧情</h4><p>' + esc(c.story) + '</p></div>' : "")
    + baikeBlock
    + (c.quotes && c.quotes.length
        ? '<div class="modal-sec"><h4>经典台词</h4>' + c.quotes.map(q => '<div class="m-quote">' + esc(q) + '</div>').join("") + '</div>'
        : "")
    + '</div>';
  $$(".thumbs img", body).forEach(t => t.addEventListener("click", () => {
    $$(".thumbs img", body).forEach(x => x.classList.remove("on"));
    t.classList.add("on");
    $("#mMainImg", body).src = imgs[+t.dataset.i];
  }));
  modalMask.classList.add("show");
  document.body.style.overflow = "hidden";
}
function closeModal(){
  if (modalMask) modalMask.classList.remove("show");
  document.body.style.overflow = "";
}

/* ============================================================
   页面：首页
   ============================================================ */
function pageHome(){
  /* 星空 */
  const cv = $("#stars");
  if (cv){
    const ctx = cv.getContext("2d");
    let W, H, stars = [], shooting = [];
    function resize(){
      W = cv.width = cv.offsetWidth * devicePixelRatio;
      H = cv.height = cv.offsetHeight * devicePixelRatio;
      stars = Array.from({length:170}, () => ({
        x: Math.random()*W, y: Math.random()*H,
        r: (Math.random()*1.4+.4)*devicePixelRatio,
        p: Math.random()*Math.PI*2, sp: .008 + Math.random()*.02
      }));
    }
    resize(); addEventListener("resize", resize);
    (function loop(){
      ctx.clearRect(0,0,W,H);
      for (const s of stars){
        s.p += s.sp;
        const a = .35 + Math.sin(s.p)*.3;
        ctx.globalAlpha = Math.max(a,.06);
        ctx.fillStyle = "#6faec7";
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 7); ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (Math.random() < .006 && shooting.length < 2){
        shooting.push({ x: Math.random()*W*.7, y: Math.random()*H*.3, vx: 9*devicePixelRatio, vy: 4.5*devicePixelRatio, life: 1 });
      }
      shooting = shooting.filter(m => m.life > 0);
      for (const m of shooting){
        m.x += m.vx; m.y += m.vy; m.life -= .02;
        const g = ctx.createLinearGradient(m.x, m.y, m.x - m.vx*8, m.y - m.vy*8);
        g.addColorStop(0, "rgba(78,163,196," + (m.life*.9) + ")");
        g.addColorStop(1, "rgba(160,220,255,0)");
        ctx.strokeStyle = g; ctx.lineWidth = 1.6*devicePixelRatio;
        ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.lineTo(m.x - m.vx*8, m.y - m.vy*8); ctx.stroke();
      }
      requestAnimationFrame(loop);
    })();
  }

  /* 战队预览 */
  const strip = $("#teamStrip");
  if (strip){
    strip.innerHTML = DB.characters.filter(c => c.faction === "team").map(c =>
      '<a class="team-cell reveal" style="--c:' + c.color + '" href="characters.html#' + c.id + '">'
      + '<img src="' + (coverFor(c) || '') + '" alt="' + esc(c.name) + '" loading="lazy">'
      + '<div class="nm">' + esc(c.name) + '<i>' + esc(c.title.split(" ")[0]) + '</i></div></a>'
    ).join("");
  }

  /* 宇宙带 */
  const band = $("#uniBand");
  if (band){
    band.innerHTML = DB.universes.map(u =>
      '<a class="uni-chip reveal" style="--uc:' + u.color + '" href="world.html#uni">'
      + '<span class="idx">第' + u.no + '宇宙</span><b>' + u.name.replace("平行宇宙","") + '</b>'
      + '<span>' + esc(u.key) + '</span></a>').join("");
  }

  /* 语录轮播 */
  const qs = [];
  DB.characters.forEach(c => (c.quotes||[]).forEach(q => qs.push({ q, by: c.name, color: c.color })));
  const feat = [qs.find(x => x.q.includes("七重的孤独")) || qs[0]]
    .concat(qs.filter(x => ["苗条俊","玄易子","鲸鲨王","天羽"].includes(x.by)).slice(0,4));
  const qEl = $("#heroQuote"), byEl = $("#heroQuoteBy"), dots = $("#quoteDots");
  if (qEl && feat.length){
    let qi = 0, timer;
    dots.innerHTML = feat.map((_,i) => '<i data-i="' + i + '"' + (i===0?' class="on"':'') + '></i>').join("");
    const show = i => {
      qi = i;
      qEl.style.opacity = 0; byEl.style.opacity = 0;
      setTimeout(() => {
        qEl.textContent = "「" + feat[i].q + "」";
        byEl.textContent = "—— " + feat[i].by;
        byEl.style.color = feat[i].color;
        qEl.style.opacity = 1; byEl.style.opacity = 1;
        $$("i", dots).forEach((d,j) => d.classList.toggle("on", j===i));
      }, 320);
    };
    const auto = () => { timer = setInterval(() => show((qi+1)%feat.length), 5200); };
    $$("i", dots).forEach(d => d.addEventListener("click", () => {
      clearInterval(timer); show(+d.dataset.i); auto();
    }));
    qEl.textContent = "「" + feat[0].q + "」";
    byEl.textContent = "—— " + feat[0].by;
    byEl.style.color = feat[0].color;
    auto();
  }
}

/* ============================================================
   页面：世界观
   ============================================================ */
function pageWorld(){
  const ug = $("#uniGrid");
  if (ug) ug.innerHTML = DB.universes.map(u =>
    '<div class="uni-card reveal" style="--uc:' + u.color + '">'
    + '<div class="u-no">' + esc(u.key) + '</div><h3>' + esc(u.name) + '</h3>'
    + '<div class="u-row"><b>主要族群：</b>' + esc(u.races) + '</div>'
    + '<div class="u-row"><b>相关角色：</b>' + esc(u.chars) + '</div>'
    + '<div class="u-row">' + esc(u.desc) + '</div></div>').join("");

  const cg = $("#conceptGrid");
  if (cg) cg.innerHTML = DB.concepts.map(k =>
    '<div class="concept-card reveal"><h3><span class="dot"></span>' + k.icon + " " + esc(k.title) + '</h3>'
    + '<p>' + esc(k.text) + '</p>'
    + (k.list ? '<ul>' + k.list.map(li => '<li>' + esc(li) + '</li>').join("") + '</ul>' : "")
    + (k.quote ? '<blockquote>' + esc(k.quote) + '</blockquote>' : "")
    + '</div>').join("");

  const ct = $("#comboBody");
  if (ct) ct.innerHTML = DB.combos.map(c =>
    '<tr><td>' + esc(c.name) + '</td><td>' + esc(c.members) + '</td><td>' + esc(c.note) + '</td></tr>').join("");
  const cn = $("#comboNotes");
  if (cn) cn.innerHTML = DB.comboNotes.map(n => '<li>' + esc(n) + '</li>').join("");
}

/* ============================================================
   页面：角色图鉴
   ============================================================ */
function pageChars(){
  const wrap = $("#charSections");
  const order = ["team","ming","sheng","other"];
  wrap.innerHTML = order.map(f => {
    const list = DB.characters.filter(c => c.faction === f);
    return '<div class="faction-block" data-f="' + f + '">'
      + '<div class="faction-title reveal" style="--fc:' + DB.factions[f].color + '">'
      + '<h2>' + esc(DB.factions[f].name) + '</h2>'
      + '<span class="fc-en">' + esc(DB.factions[f].en) + '</span><div class="line"></div></div>'
      + '<div class="char-grid">' + list.map(charCard).join("") + '</div></div>';
  }).join("");
  wrap.addEventListener("click", e => {
    const card = e.target.closest(".char-card");
    if (card) openChar(card.dataset.id);
  });
  /* 过滤 */
  $$(".filter-bar .chip").forEach(ch => ch.addEventListener("click", () => {
    $$(".filter-bar .chip").forEach(x => x.classList.remove("on"));
    ch.classList.add("on");
    const f = ch.dataset.f;
    $$(".faction-block", wrap).forEach(b => {
      b.style.display = (f === "all" || b.dataset.f === f) ? "" : "none";
    });
  }));
  /* 锚点直达 */
  if (location.hash){
    const c = findChar(location.hash.slice(1));
    if (c) setTimeout(() => openChar(c.id), 350);
  }
}

/* ============================================================
   页面：关系网
   ============================================================ */
function pageRelations(){
  const svg = $("#relSvg");
  if (!svg) return;
  const NS = "http://www.w3.org/2000/svg";
  const W = 1600, H = 1000;
  svg.setAttribute("viewBox", "0 0 " + W + " " + H);
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
  const nodeById = {};
  DB.relNodes.forEach(n => nodeById[n.id] = n);

  /* 关系图分成“线 / 节点”两层，避免悬停时重排或遮挡。 */
  const edgeLayer = document.createElementNS(NS, "g");
  edgeLayer.setAttribute("class", "rel-edge-layer");
  const nodeLayer = document.createElementNS(NS, "g");
  nodeLayer.setAttribute("class", "rel-node-layer");
  svg.append(edgeLayer, nodeLayer);

  const edgeEls = [];
  const labelMetas = [];
  const nodeEls = {};
  const linkedByNode = {};
  DB.relNodes.forEach(n => linkedByNode[n.id] = new Set());

  function addTitle(parent, text){
    const title = document.createElementNS(NS, "title");
    title.textContent = text;
    parent.appendChild(title);
  }

  DB.relEdges.forEach((e, index) => {
    const A = nodeById[e.a], B = nodeById[e.b];
    if (!A || !B) return;
    const type = DB.relEdgeTypes[e.t] || {};
    linkedByNode[e.a].add(e.b);
    linkedByNode[e.b].add(e.a);

    const mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2;
    const dx = B.x - A.x, dy = B.y - A.y;
    const len = Math.hypot(dx, dy) || 1;
    const bend = Math.min(70, len * .16);
    const cx = mx - dy / len * bend, cy = my + dx / len * bend;
    const d = `M${A.x} ${A.y} Q${cx} ${cy} ${B.x} ${B.y}`;

    const path = document.createElementNS(NS, "path");
    path.setAttribute("d", d);
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", type.color || "#7b9aaa");
    path.setAttribute("stroke-width", "2.2");
    if (type.dash) path.setAttribute("stroke-dasharray", "7 6");
    path.classList.add("rel-edge", "rel-edge-path");
    path.dataset.a = e.a;
    path.dataset.b = e.b;
    path.dataset.index = String(index);
    addTitle(path, `${A.name}与${B.name}：${e.label}`);
    edgeLayer.appendChild(path);

    /* 标签离开曲线一点，且长标签在图面上用短版，完整内容保留在 title 和侧栏。 */
    const labelOffset = 12 + Math.min(16, e.label.length * 0.7);
    const nx = (cx - mx) / Math.max(bend, 1);
    const ny = (cy - my) / Math.max(bend, 1);
    const lx = (A.x + 2 * cx + B.x) / 4 + nx * labelOffset;
    const ly = (A.y + 2 * cy + B.y) / 4 + ny * labelOffset;
    const label = document.createElementNS(NS, "text");
    label.setAttribute("x", lx);
    label.setAttribute("y", ly);
    label.setAttribute("text-anchor", "middle");
    label.setAttribute("font-size", "13");
    label.setAttribute("fill", type.color || "#6e8794");
    label.classList.add("rel-edge", "rel-elabel");
    label.dataset.a = e.a;
    label.dataset.b = e.b;
    label.dataset.index = String(index);
    const displayLabel = e.label;
    label.textContent = displayLabel;
    addTitle(label, e.label);
    edgeLayer.appendChild(label);
    labelMetas.push({ el:label, x:lx, y:ly, w:Math.max(28, displayLabel.length * 12 + 12), h:22 });

    edgeEls.push({ path, label, a:e.a, b:e.b });
  });

  /* 轻量标签避让：只移动相互碰撞的标签，不改变关系线和节点布局。 */
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  for (let pass = 0; pass < 5; pass++) {
    for (let i = 0; i < labelMetas.length; i++) {
      for (let j = i + 1; j < labelMetas.length; j++) {
        const a = labelMetas[i], b = labelMetas[j];
        const overlapX = (a.w + b.w) / 2 - Math.abs(a.x - b.x);
        const overlapY = (a.h + b.h) / 2 - Math.abs(a.y - b.y);
        if (overlapX <= 0 || overlapY <= 0) continue;
        const direction = (i + j) % 2 ? 1 : -1;
        if (overlapX < overlapY) {
          const shift = (overlapX + 5) / 2 * direction;
          a.x -= shift;
          b.x += shift;
        } else {
          const shift = (overlapY + 6) / 2 * direction;
          a.y -= shift;
          b.y += shift;
        }
      }
    }
  }
  labelMetas.forEach(meta => {
    meta.el.setAttribute("x", clamp(meta.x, 34, W - 34));
    meta.el.setAttribute("y", clamp(meta.y, 30, H - 22));
  });

  DB.relNodes.forEach(n => {
    const group = DB.relNodeGroups[n.g] || {};
    const color = group.color || "#147c96";
    const g = document.createElementNS(NS, "g");
    g.classList.add("rel-node");
    g.dataset.id = n.id;
    g.setAttribute("tabindex", "0");
    g.setAttribute("role", "button");
    g.setAttribute("aria-label", `${n.name}，${n.title}`);

    const circle = document.createElementNS(NS, "circle");
    circle.setAttribute("cx", n.x);
    circle.setAttribute("cy", n.y);
    circle.setAttribute("r", n.r);
    circle.setAttribute("fill", "#ffffff");
    circle.setAttribute("stroke", color);
    circle.setAttribute("stroke-width", "2.6");

    const name = document.createElementNS(NS, "text");
    name.setAttribute("x", n.x);
    name.setAttribute("y", n.y + 2);
    name.setAttribute("text-anchor", "middle");
    name.setAttribute("dominant-baseline", "middle");
    name.setAttribute("font-size", n.r > 33 ? "21" : "18");
    name.setAttribute("font-weight", "800");
    name.textContent = n.name.length <= 3 ? n.name : n.name.slice(0, 3);

    const title = document.createElementNS(NS, "text");
    title.setAttribute("x", n.x);
    title.setAttribute("y", n.y + n.r + 22);
    title.setAttribute("text-anchor", "middle");
    title.setAttribute("font-size", "13.5");
    title.textContent = n.title;

    g.append(circle, name, title);
    nodeLayer.appendChild(g);
    nodeEls[n.id] = g;
  });

  /* 图例 */
  const legend = $("#relLegend");
  legend.innerHTML =
    Object.keys(DB.relEdgeTypes).map(k =>
      '<span><i class="' + (DB.relEdgeTypes[k].dash ? "dash" : "") + '" style="--lc:' + DB.relEdgeTypes[k].color + '"></i>' + DB.relEdgeTypes[k].name + '</span>').join("")
    + '<span class="legend-node-label">节点颜色：</span>'
    + Object.keys(DB.relNodeGroups).map(k =>
      '<span><i style="--lc:' + DB.relNodeGroups[k].color + '"></i>' + DB.relNodeGroups[k].name + '</span>').join("");

  /* 侧栏 */
  const side = $("#relSide");
  const sideDefault = side.innerHTML;
  function showNode(id){
    const n = nodeById[id];
    if (!n) return;
    const c = findChar(id);
    const rels = DB.relEdges.filter(e => e.a === id || e.b === id);
    side.innerHTML =
      '<h3 style="color:' + DB.relNodeGroups[n.g].color + '">' + esc(n.name) + '</h3>'
      + '<div class="r-title">' + esc(n.title) + " · " + esc(DB.relNodeGroups[n.g].name) + '</div>'
      + (c ? '<div class="r-desc">' + esc(c.brief) + '</div>' : "")
      + '<ul>' + rels.map(e => {
          const other = e.a === id ? e.b : e.a;
          const on = nodeById[other];
          return '<li><span class="rt" style="background:' + DB.relEdgeTypes[e.t].color + '">' + DB.relEdgeTypes[e.t].name + '</span>'
            + '<b>' + esc(on.name) + '</b> —— ' + esc(e.label) + '</li>';
        }).join("") + '</ul>'
      + (c ? '<div style="margin-top:16px"><a class="btn btn-ghost" style="padding:9px 20px;font-size:13px" href="characters.html#' + c.id + '">查看角色档案 →</a></div>' : "");
  }

  let selected = null;
  let hovered = null;
  let leaveTimer = null;

  function clearFocus(){
    edgeEls.forEach(({path, label}) => {
      path.classList.remove("rel-active", "rel-muted");
      label.classList.remove("rel-active", "rel-muted");
    });
    Object.values(nodeEls).forEach(g =>
      g.classList.remove("rel-focus", "rel-connected", "rel-muted"));
    svg.classList.remove("has-focus");
  }

  function paint(focus){
    clearFocus();
    if (!focus || !nodeEls[focus]) return;
    svg.classList.add("has-focus");
    const linked = linkedByNode[focus] || new Set();
    edgeEls.forEach(({path, label, a, b}) => {
      const active = a === focus || b === focus;
      path.classList.toggle("rel-active", active);
      label.classList.toggle("rel-active", active);
      path.classList.toggle("rel-muted", !active);
      label.classList.toggle("rel-muted", !active);
    });
    Object.keys(nodeEls).forEach(id => {
      const g = nodeEls[id];
      const isFocus = id === focus;
      const isConnected = linked.has(id);
      g.classList.toggle("rel-focus", isFocus);
      g.classList.toggle("rel-connected", !isFocus && isConnected);
      g.classList.toggle("rel-muted", !isFocus && !isConnected);
    });
  }

  function reset(){
    selected = null;
    hovered = null;
    clearTimeout(leaveTimer);
    side.innerHTML = sideDefault;
    paint(null);
  }

  function focusNode(id){
    clearTimeout(leaveTimer);
    hovered = id;
    paint(id);
  }

  Object.keys(nodeEls).forEach(id => {
    const g = nodeEls[id];
    g.addEventListener("pointerenter", () => focusNode(id));
    g.addEventListener("pointerleave", () => {
      clearTimeout(leaveTimer);
      leaveTimer = setTimeout(() => {
        hovered = null;
        paint(selected);
      }, 45);
    });
    g.addEventListener("click", event => {
      event.stopPropagation();
      selected = id;
      hovered = id;
      showNode(id);
      paint(id);
    });
    g.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        g.click();
      }
    });
  });
  svg.addEventListener("pointerleave", () => {
    clearTimeout(leaveTimer);
    leaveTimer = setTimeout(() => {
      hovered = null;
      paint(selected);
    }, 45);
  });
  $("#relReset").addEventListener("click", reset);

  /* 移动端横向画布默认从中心开始，用户仍可左右滑动查看完整网络。 */
  const canvas = svg.closest(".rel-canvas-box");
  if (canvas && matchMedia("(max-width: 720px)").matches) {
    requestAnimationFrame(() => { canvas.scrollLeft = Math.max(0, (canvas.scrollWidth - canvas.clientWidth) / 2); });
  }

  /* 因果链 */
  const cg = $("#causeGrid");
  if (cg) cg.innerHTML = DB.causality.map(c =>
    '<div class="cause-card reveal"><h3>' + esc(c.who) + '<span>' + esc(c.tag) + '</span></h3>'
    + '<div class="flow">' + c.flow + '</div>'
    + '<div class="impact">影响：' + esc(c.impact) + '</div></div>').join("");
}

/* ============================================================
   页面：十万年时间线
   ============================================================ */
function pageTimeline(){
  const track = $("#timelineTrack");
  const filters = $("#timelineFilters");
  const count = $("#timelineCount");
  const stats = {
    events: $("#timelineEventTotal"),
    phases: $("#timelinePhaseTotal"),
    branches: $("#timelineBranchTotal")
  };
  if (!track || !filters || !Array.isArray(DB.timeline)) return;

  const phases = [...new Set(DB.timeline.map(item => item.phase))];
  const branchTotal = DB.timeline.reduce((total, item) => total + (item.branches || []).length, 0);
  if (stats.events) stats.events.textContent = DB.timeline.length;
  if (stats.phases) stats.phases.textContent = phases.length;
  if (stats.branches) stats.branches.textContent = branchTotal;

  filters.innerHTML = ['全部', ...phases].map((phase, index) =>
    '<button class="timeline-filter' + (index === 0 ? ' on' : '') + '" type="button" data-phase="'
    + esc(phase) + '" aria-pressed="' + (index === 0 ? 'true' : 'false') + '">' + esc(phase) + '</button>'
  ).join("");

  function branchMarkup(item){
    if (!item.branches || !item.branches.length) return '';
    return '<div class="timeline-branches" aria-label="历史分支">'
      + item.branches.map((branch, index) =>
        '<div class="timeline-branch branch-' + index + '">'
        + '<div class="timeline-branch-label">' + esc(branch.label) + '</div>'
        + '<h4>' + esc(branch.title) + '</h4>'
        + '<p>' + esc(branch.text) + '</p>'
        + '</div>'
      ).join("")
      + '</div>';
  }

  function eventMarkup(item){
    return '<article class="timeline-event tone-' + esc(item.tone) + '" data-phase="' + esc(item.phase) + '">'
      + '<div class="timeline-marker" aria-hidden="true"><span>' + esc(item.mark) + '</span></div>'
      + '<div class="timeline-card">'
      + '<div class="timeline-card-head"><span class="timeline-period">' + esc(item.period) + '</span>'
      + '<span class="timeline-phase">' + esc(item.phase) + '</span></div>'
      + '<h3>' + esc(item.title) + '</h3>'
      + '<p class="timeline-summary">' + esc(item.summary) + '</p>'
      + '<div class="timeline-detail"><span>因果注记</span>' + esc(item.detail) + '</div>'
      + '<div class="timeline-tags">' + (item.tags || []).map(tag => '<span>' + esc(tag) + '</span>').join("") + '</div>'
      + branchMarkup(item)
      + '</div></article>';
  }

  function render(phase){
    const list = phase === '全部' ? DB.timeline : DB.timeline.filter(item => item.phase === phase);
    track.innerHTML = list.length
      ? list.map(eventMarkup).join('')
      : '<div class="timeline-empty">暂时没有符合条件的时间线事件。</div>';
    if (count) count.textContent = '显示 ' + list.length + ' / ' + DB.timeline.length + ' 个节点';
  }

  filters.addEventListener('click', event => {
    const button = event.target.closest('.timeline-filter');
    if (!button) return;
    $$('.timeline-filter', filters).forEach(item => {
      const active = item === button;
      item.classList.toggle('on', active);
      item.setAttribute('aria-pressed', String(active));
    });
    render(button.dataset.phase);
  });

  render('全部');
}

/* ============================================================
   页面：剧集
   ============================================================ */
function pageEpisodes(){
  const grid = $("#epGrid");
  const count = $("#epCount");
  const input = $("#epSearch");
  let season = 1, kw = "";
  function data(){
    const src = (season === 1 ? DB.episodesS1 : DB.episodesS2);
    return src.filter(e =>
      !kw || e[1].includes(kw) || e[2].includes(kw) || e[3].includes(kw) || String(e[0]) === kw);
  }
  function render(){
    const list = data();
    count.textContent = "共 " + list.length + " 集";
    grid.innerHTML = list.length
      ? list.map(e =>
        '<div class="ep-card"><div class="no">' + String(e[0]).padStart(2,"0") + '</div>'
        + '<div><h3>' + esc(e[1]) + '</h3><div class="who">' + esc(e[2]) + '</div><p>' + esc(e[3]) + '</p></div></div>').join("")
      : '<div class="ep-empty">没有找到相关剧集，换个关键词试试。</div>';
  }
  $$(".season-tab").forEach(t => t.addEventListener("click", () => {
    $$(".season-tab").forEach(x => x.classList.remove("on"));
    t.classList.add("on");
    season = +t.dataset.s;
    render();
  }));
  input.addEventListener("input", () => { kw = input.value.trim(); render(); });
  render();
}

/* ============================================================
   页面：语录
   ============================================================ */
function pageQuotes(){
  const wall = $("#quoteWall");
  const bar = $("#quoteFilter");
  const all = [];
  DB.characters.forEach(c => (c.quotes||[]).forEach(q =>
    all.push({ q, by: c.name, color: c.color, faction: DB.factions[c.faction].name })));
  const people = [...new Set(all.map(x => x.by))];
  bar.innerHTML = '<button class="chip on" data-p="all">全部（' + all.length + '）</button>'
    + people.map(p => '<button class="chip" data-p="' + esc(p) + '">' + esc(p) + '</button>').join("");
  function render(p){
    const list = p === "all" ? all : all.filter(x => x.by === p);
    wall.innerHTML = list.map(x =>
      '<div class="q-card" style="--qc:' + x.color + '"><p>' + esc(x.q) + '</p>'
      + '<div class="who">' + esc(x.by) + '<span>' + esc(x.faction) + '</span></div></div>').join("");
  }
  bar.addEventListener("click", e => {
    const b = e.target.closest(".chip"); if (!b) return;
    $$(".chip", bar).forEach(x => x.classList.remove("on"));
    b.classList.add("on");
    render(b.dataset.p);
  });
  render("all");
}

/* ============================================================
   页面：配音
   ============================================================ */
function pageCast(){
  const tb = $("#castBody");
  if (tb) tb.innerHTML = DB.cast.map(c =>
    '<tr><td class="va">' + esc(c.va) + '</td>'
    + '<td class="main-r">' + esc(c.main) + '</td>'
    + '<td class="minor-r">' + esc(c.minor) + '</td></tr>').join("");
  const cg = $("#crewGrid");
  if (cg) cg.innerHTML = DB.crew.map(c =>
    '<div class="crew-item reveal"><div class="k">' + esc(c.k) + '</div><div class="v">' + esc(c.v) + '</div></div>').join("");
}


/* ============================================================
   全站背景音乐 · 本地音频、点击播放、跨页面恢复
   ============================================================ */
const BGM_TRACKS = [
  { title: "主题曲 · 超兽武装", file: "主题曲-超兽武装-128k.mp3" },
  { title: "片尾曲 · 尘曦", file: "片尾曲-尘曦-128k.mp3" }
];
const BGM_STATE_KEY = "ubf-bgm-state-v1";

function buildBgmPlayer(){
  if (!BGM_TRACKS.length || document.querySelector("[data-bgm-player]")) return;

  const player = document.createElement("aside");
  player.className = "bgm-player";
  player.setAttribute("data-bgm-player", "");
  player.setAttribute("aria-label", "网站背景音乐播放器");
  player.innerHTML = `
    <div class="bgm-head">
      <button class="bgm-play bgm-icon-btn" type="button" aria-label="播放背景音乐" aria-pressed="false"><span aria-hidden="true">▶</span></button>
      <div class="bgm-meta">
        <div class="bgm-kicker"><i></i> BACKGROUND MUSIC</div>
        <div class="bgm-title" title=""></div>
        <div class="bgm-status">点击播放背景音乐</div>
      </div>
      <button class="bgm-collapse bgm-icon-btn" type="button" aria-label="收起播放器" aria-expanded="true"><span aria-hidden="true">⌄</span></button>
    </div>
    <div class="bgm-body">
      <div class="bgm-progress-row">
        <input class="bgm-progress" type="range" min="0" max="100" step="0.1" value="0" aria-label="播放进度">
        <div class="bgm-time"><span class="bgm-current">00:00</span><span class="bgm-duration">00:00</span></div>
      </div>
      <div class="bgm-controls">
        <div class="bgm-track-controls">
          <button class="bgm-prev bgm-control-btn" type="button" aria-label="上一首">⏮</button>
          <button class="bgm-next bgm-control-btn" type="button" aria-label="下一首">⏭</button>
          <button class="bgm-list-toggle bgm-control-btn" type="button" aria-label="显示播放列表" aria-expanded="false">曲目</button>
        </div>
        <label class="bgm-volume" title="音量">
          <span aria-hidden="true">音量</span>
          <input class="bgm-volume-range" type="range" min="0" max="1" step="0.01" value="0.48" aria-label="音量">
        </label>
      </div>
      <div class="bgm-list" hidden></div>
    </div>
    <audio class="bgm-audio" preload="none" playsinline></audio>
  `;
  document.body.appendChild(player);

  let revealTimer = 0;
  const revealPlayer = () => {
    window.clearTimeout(revealTimer);
    player.classList.add("is-revealed");
  };
  const concealPlayer = () => {
    window.clearTimeout(revealTimer);
    revealTimer = window.setTimeout(() => {
      if (!player.matches(":hover") && !player.matches(":focus-within")) player.classList.remove("is-revealed");
    }, 90);
  };
  player.addEventListener("mouseenter", revealPlayer);
  player.addEventListener("mouseleave", concealPlayer);
  player.addEventListener("focusin", revealPlayer);
  player.addEventListener("focusout", concealPlayer);

  const audio = $(".bgm-audio", player);
  const playBtn = $(".bgm-play", player);
  const playIcon = $(".bgm-play span", playBtn);
  const titleEl = $(".bgm-title", player);
  const statusEl = $(".bgm-status", player);
  const progress = $(".bgm-progress", player);
  const currentEl = $(".bgm-current", player);
  const durationEl = $(".bgm-duration", player);
  const volume = $(".bgm-volume-range", player);
  const listEl = $(".bgm-list", player);
  const listToggle = $(".bgm-list-toggle", player);
  const collapseBtn = $(".bgm-collapse", player);
  const store = (() => {
    try { return JSON.parse(sessionStorage.getItem(BGM_STATE_KEY) || "{}"); }
    catch (_) { return {}; }
  })();
  let trackIndex = Number.isInteger(store.trackIndex) ? store.trackIndex : 0;
  let resumeTime = Number.isFinite(Number(store.time)) ? Number(store.time) : 0;
  let hasResumeIntent = store.playing === true;
  let sourceLoaded = false;
  let saveTimer = 0;

  const formatTime = seconds => {
    if (!Number.isFinite(seconds) || seconds < 0) return "00:00";
    const value = Math.floor(seconds);
    const minutes = Math.floor(value / 60);
    const secs = value % 60;
    return String(minutes).padStart(2, "0") + ":" + String(secs).padStart(2, "0");
  };
  const trackUrl = track => "/assets/audio/" + encodeURIComponent(track.file);
  const clampTrack = index => (index + BGM_TRACKS.length) % BGM_TRACKS.length;

  function saveState(){
    try {
      sessionStorage.setItem(BGM_STATE_KEY, JSON.stringify({
        trackIndex,
        time: Number.isFinite(audio.currentTime) ? audio.currentTime : 0,
        playing: !audio.paused && !audio.ended,
        volume: audio.volume
      }));
    } catch (_) {}
  }

  function updateStatus(text){
    if (text) {
      statusEl.textContent = text;
      return;
    }
    statusEl.textContent = audio.paused ? "点击播放背景音乐" : "正在播放 · 点击可暂停";
  }

  function updatePlayUi(){
    const playing = !audio.paused && !audio.ended;
    player.classList.toggle("is-playing", playing);
    playBtn.setAttribute("aria-pressed", String(playing));
    playBtn.setAttribute("aria-label", playing ? "暂停背景音乐" : "播放背景音乐");
    playIcon.textContent = playing ? "Ⅱ" : "▶";
    updateStatus();
  }

  function renderList(){
    listEl.innerHTML = BGM_TRACKS.map((track, index) =>
      '<button class="bgm-list-item' + (index === trackIndex ? ' is-current' : '') + '" type="button" data-track-index="' + index + '">' +
      '<span class="bgm-list-index">' + String(index + 1).padStart(2, "0") + '</span>' +
      '<span>' + esc(track.title) + '</span>' +
      '<span class="bgm-list-state">' + (index === trackIndex ? "当前" : "播放") + '</span>' +
      '</button>'
    ).join("");
  }

  function updateTrackUi(){
    const track = BGM_TRACKS[trackIndex];
    titleEl.textContent = track.title;
    titleEl.title = track.title;
    renderList();
  }

  function tryPlay(){
    if (!sourceLoaded) {
      loadTrack(trackIndex, { time: resumeTime, autoPlay: true });
      return;
    }
    updateStatus("正在加载音乐…");
    const result = audio.play();
    if (result && typeof result.catch === "function") {
      result.catch(() => {
        updatePlayUi();
        updateStatus("请点击播放按钮继续");
      });
    }
  }

  function loadTrack(index, options){
    const opts = options || {};
    trackIndex = clampTrack(index);
    const track = BGM_TRACKS[trackIndex];
    const seekTo = Number.isFinite(Number(opts.time)) ? Number(opts.time) : 0;
    sourceLoaded = false;
    updateTrackUi();
    audio.addEventListener("loadedmetadata", () => {
      if (seekTo > 0 && seekTo < audio.duration) audio.currentTime = seekTo;
      progress.value = audio.duration ? String((audio.currentTime / audio.duration) * 100) : "0";
      durationEl.textContent = formatTime(audio.duration);
      if (opts.autoPlay) tryPlay();
    }, { once: true });
    audio.src = trackUrl(track);
    sourceLoaded = true;
    audio.load();
  }

  playBtn.addEventListener("click", () => {
    if (audio.paused || audio.ended) tryPlay();
    else audio.pause();
  });
  $(".bgm-prev", player).addEventListener("click", () => {
    loadTrack(trackIndex - 1, { autoPlay: !audio.paused });
  });
  $(".bgm-next", player).addEventListener("click", () => {
    loadTrack(trackIndex + 1, { autoPlay: !audio.paused });
  });
  progress.addEventListener("input", () => {
    if (audio.duration) audio.currentTime = (Number(progress.value) / 100) * audio.duration;
  });
  volume.addEventListener("input", () => {
    audio.volume = Number(volume.value);
    saveState();
  });
  listToggle.addEventListener("click", () => {
    const open = listEl.hasAttribute("hidden");
    if (open) listEl.removeAttribute("hidden");
    else listEl.setAttribute("hidden", "");
    listToggle.setAttribute("aria-expanded", String(open));
  });
  listEl.addEventListener("click", event => {
    const button = event.target.closest("[data-track-index]");
    if (!button) return;
    const nextIndex = Number(button.dataset.trackIndex);
    if (nextIndex === trackIndex) {
      if (audio.paused) tryPlay();
      return;
    }
    loadTrack(nextIndex, { autoPlay: !audio.paused });
  });
  collapseBtn.addEventListener("click", () => {
    const collapsed = player.classList.toggle("is-collapsed");
    collapseBtn.setAttribute("aria-expanded", String(!collapsed));
    collapseBtn.setAttribute("aria-label", collapsed ? "展开播放器" : "收起播放器");
    $(".bgm-collapse span", collapseBtn).textContent = collapsed ? "⌃" : "⌄";
    saveState();
  });

  audio.addEventListener("play", () => { updatePlayUi(); saveState(); });
  audio.addEventListener("pause", () => { updatePlayUi(); saveState(); });
  audio.addEventListener("timeupdate", () => {
    currentEl.textContent = formatTime(audio.currentTime);
    if (audio.duration) progress.value = String((audio.currentTime / audio.duration) * 100);
    if (!saveTimer) {
      saveTimer = window.setTimeout(() => { saveTimer = 0; saveState(); }, 800);
    }
  });
  audio.addEventListener("loadedmetadata", () => {
    durationEl.textContent = formatTime(audio.duration);
    currentEl.textContent = formatTime(audio.currentTime);
  });
  audio.addEventListener("ended", () => {
    loadTrack(trackIndex + 1, { autoPlay: true });
  });
  audio.addEventListener("waiting", () => {
    if (!audio.paused) updateStatus("正在缓冲…");
  });
  audio.addEventListener("canplay", () => {
    if (!audio.paused) updateStatus();
  });
  audio.addEventListener("error", () => {
    updatePlayUi();
    updateStatus("音频加载失败，请检查本地文件");
  });
  window.addEventListener("pagehide", saveState);
  window.addEventListener("beforeunload", saveState);

  const savedVolume = Number(store.volume);
  audio.volume = Number.isFinite(savedVolume) ? Math.min(1, Math.max(0, savedVolume)) : 0.48;
  volume.value = String(audio.volume);
  updateTrackUi();
  if (hasResumeIntent) loadTrack(trackIndex, { time: resumeTime, autoPlay: true });
  updatePlayUi();
}

/* ---------------- 启动 ---------------- */
document.addEventListener("DOMContentLoaded", () => {
  buildNav(); buildFooter(); buildBgmPlayer();
  /* 部分静态服务器 / 浏览器缓存组合可能丢失 body[data-page]，用文件名做兜底。 */
  const pageMap = {"index.html":"home","world.html":"world","timeline.html":"timeline","characters.html":"chars","relations.html":"relations","episodes.html":"episodes","quotes.html":"quotes","cast.html":"cast"};
  const page = document.body.dataset.page || pageMap[currentPage()] || "";
  if (page === "home")      pageHome();
  if (page === "world")     pageWorld();
  if (page === "chars")     pageChars();
  if (page === "relations") pageRelations();
  if (page === "timeline")  pageTimeline();
  if (page === "episodes")  pageEpisodes();
  if (page === "quotes")    pageQuotes();
  if (page === "cast")      pageCast();
  reveal();
  /* 首页入口卡片等静态 .reveal 已在 DOM 中，动态渲染的需再挂一次 */
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting){ e.target.classList.add("in"); io.unobserve(e.target); }
    }), { threshold:.08 });
    $$(".reveal:not(.in)").forEach(el => io.observe(el));
  } else {
    $$(".reveal").forEach(el => el.classList.add("in"));
  }
});
})();