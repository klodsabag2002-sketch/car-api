<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>פרטי רכב - סייבר פרימיום</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, Helvetica, sans-serif; background: #030712; color: #f8fafc; direction: rtl; min-height: 100vh; overflow-x: hidden; }
  
  .phone { 
    max-width: 390px; 
    margin: 0 auto; 
    background: radial-gradient(circle at top, #0f172a 0%, #030712 100%); 
    min-height: 100vh; 
    padding-bottom: 50px; 
    box-shadow: 0 0 60px rgba(56, 189, 248, 0.15), inset 0 0 30px rgba(56, 189, 248, 0.05); 
    border-left: 1px solid rgba(56, 189, 248, 0.2); 
    border-right: 1px solid rgba(56, 189, 248, 0.2);
    position: relative;
  }

  .topbar { 
    background: rgba(3, 7, 18, 0.85); 
    backdrop-filter: blur(16px); 
    color: #f8fafc; 
    height: 58px; 
    display: flex; 
    align-items: center; 
    justify-content: space-between; 
    padding: 0 16px; 
    border-bottom: 1px solid rgba(56, 189, 248, 0.2); 
    position: sticky; 
    top: 0; 
    z-index: 100; 
    box-shadow: 0 4px 20px rgba(0,0,0,0.5);
  }
  .topbar .t { font-size: 18px; flex: 1; text-align: center; font-weight: 900; letter-spacing: 1px; color: #38bdf8; text-shadow: 0 0 10px rgba(56,189,248,0.5); }
  .topbar .i { font-size: 18px; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; cursor: pointer; border-radius: 50%; background: rgba(56,189,248,0.1); border: 1px solid rgba(56,189,248,0.3); color: #38bdf8; transition: all 0.3s; }
  .topbar .i:hover { background: rgba(56,189,248,0.25); box-shadow: 0 0 12px rgba(56,189,248,0.5); }
  .topbar .i.hidden { visibility: hidden; }

  /* תפריט צד (3 קווים) מעודכן עם אפשרויות חיפוש מתקדמות */
  .menu-dropdown {
    position: absolute;
    top: 64px;
    left: 12px;
    background: rgba(15, 23, 42, 0.95);
    backdrop-filter: blur(16px);
    border: 1px solid rgba(56, 189, 248, 0.4);
    border-radius: 16px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.8), 0 0 20px rgba(56,189,248,0.2);
    width: 210px;
    display: none;
    flex-direction: column;
    z-index: 200;
    overflow: hidden;
    animation: fadeInMenu 0.2s ease;
  }
  .menu-dropdown.show { display: flex; }
  @keyframes fadeInMenu { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
  .menu-item {
    padding: 12px 16px;
    font-size: 13px;
    font-weight: 900;
    color: #f8fafc;
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    border-bottom: 1px solid rgba(255,255,255,0.05);
    transition: background 0.2s, color 0.2s;
  }
  .menu-item:last-child { border-bottom: none; }
  .menu-item:hover { background: rgba(56, 189, 248, 0.15); color: #38bdf8; }

  .search-box { background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(12px); padding: 20px 16px; border-bottom: 1px solid rgba(56,189,248,0.15); }
  .plate { display: flex; align-items: center; background: #fbbf24; border: 2px solid #38bdf8; border-radius: 16px; height: 64px; overflow: hidden; direction: ltr; box-shadow: 0 0 25px rgba(56, 189, 248, 0.3), inset 0 2px 5px rgba(255,255,255,0.4); }
  .plate .strip { background: #1e3a8a; color: #fff; width: 52px; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; flex-shrink: 0; border-right: 1px solid rgba(0,0,0,0.3); }
  .plate .strip .flag { font-size: 12px; }
  .plate .strip .il { font-size: 18px; font-weight: 900; line-height: 1; text-shadow: 0 0 5px rgba(255,255,255,0.5); }
  .plate .strip .he { font-size: 8px; font-weight: bold; }
  .plate input { flex: 1; min-width: 0; height: 100%; border: none; background: transparent; outline: none; font-size: 28px; font-weight: 900; text-align: center; letter-spacing: 2px; color: #0f172a; text-shadow: 0 1px 1px rgba(255,255,255,0.5); }
  .plate input::placeholder { color: #92400e; font-size: 14px; letter-spacing: 0; font-weight: 700; opacity: 0.8; }
  .plate button { border: none; background: linear-gradient(135deg, #0284c7, #0369a1); color: #fff; height: 100%; padding: 0 20px; font-size: 14px; cursor: pointer; flex-shrink: 0; font-weight: 900; letter-spacing: 0.5px; transition: all 0.2s; }
  .plate button:hover { background: linear-gradient(135deg, #0369a1, #0284c7); box-shadow: inset 0 0 10px rgba(0,0,0,0.2); }
  .plate button:disabled { background: #475569; cursor: not-allowed; }
  
  .msg { text-align: center; color: #94a3b8; font-size: 13px; padding: 8px; display: none; }
  .msg.err { color: #f87171; background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 12px; margin-top: 10px; font-weight: 700; }

  .km-line { display: none; align-items: center; justify-content: center; gap: 8px; color: #4ade80; font-size: 13px; background: rgba(34, 197, 94, 0.1); border-bottom: 1px solid rgba(34, 197, 94, 0.2); padding: 10px 12px; font-weight: 800; text-shadow: 0 0 8px rgba(74,222,128,0.4); }
  .km-line.show { display: flex; }
  .km-line .km-ic { border: 2px solid #4ade80; border-radius: 6px; padding: 0 4px; font-size: 11px; box-shadow: 0 0 6px rgba(74,222,128,0.4); }

  .importer-price-card {
    background: rgba(15, 23, 42, 0.75);
    backdrop-filter: blur(12px);
    border-radius: 18px;
    margin: 16px 14px 0;
    padding: 16px 18px;
    border: 1px solid rgba(56, 189, 248, 0.3);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 0 15px rgba(56, 189, 248, 0.05);
    display: none;
  }
  .importer-price-card.show { display: block; }
  .importer-price-main { display: flex; align-items: center; gap: 14px; direction: ltr; justify-content: flex-end; }
  .importer-text-wrap { text-align: right; flex: 1; }
  .importer-price-val { font-size: 22px; font-weight: 900; color: #f8fafc; text-shadow: 0 0 10px rgba(56, 189, 248, 0.5); letter-spacing: -0.5px; }
  .importer-name { font-size: 12px; font-weight: 800; color: #38bdf8; margin-top: 2px; text-shadow: 0 0 8px rgba(56,189,248,0.4); }
  .importer-icon { width: 44px; height: 44px; border-radius: 50%; background: rgba(56, 189, 248, 0.15); border: 2px solid #38bdf8; color: #38bdf8; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 900; flex-shrink: 0; box-shadow: 0 0 12px rgba(56,189,248,0.4); overflow: hidden; }
  .importer-icon img { width: 80%; height: 80%; object-fit: contain; }
  .importer-disclaimer { margin-top: 10px; font-size: 10px; color: #94a3b8; text-align: right; font-weight: 700; border-top: 1px dashed rgba(56, 189, 248, 0.15); padding-top: 8px; letter-spacing: 0.2px; }

  .history { background: rgba(15, 23, 42, 0.7); backdrop-filter: blur(14px); margin: 16px 14px 0; border-radius: 18px; border: 1px solid rgba(56,189,248,0.2); display: none; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
  .history.show { display: block; }
  .history-head { display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; background: rgba(3, 7, 18, 0.5); border-bottom: 1px solid rgba(56,189,248,0.15); }
  .history-head .h-title { font-size: 14px; font-weight: 900; color: #38bdf8; letter-spacing: 0.5px; }
  .history-head .h-clear { background: none; border: none; color: #f87171; font-size: 13px; cursor: pointer; font-weight: 800; transition: text-shadow 0.2s; }
  .history-head .h-clear:hover { text-shadow: 0 0 8px rgba(248,113,113,0.6); }
  .h-row { display: flex; align-items: center; padding: 12px 18px; border-bottom: 1px solid rgba(255,255,255,0.04); cursor: pointer; transition: all 0.2s; }
  .h-row:last-child { border-bottom: none; }
  .h-row:hover { background: rgba(56, 189, 248, 0.05); }
  .h-icon { width: 46px; height: 46px; border-radius: 50%; background: #fff; display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; margin-left: 14px; overflow: hidden; border: 2px solid #38bdf8; box-shadow: 0 0 12px rgba(56,189,248,0.4); }
  .h-icon img { width: 85%; height: 85%; object-fit: contain; }
  .h-info { flex: 1; min-width: 0; text-align: right; }
  .h-name { font-size: 15px; font-weight: 900; color: #f8fafc; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .h-sub { display: flex; align-items: center; gap: 8px; margin-top: 4px; font-size: 12px; color: #94a3b8; }

  .h-plate { display: inline-flex; direction: ltr; align-items: stretch; height: 24px; background: #fbbf24; border: 1.5px solid #0f172a; border-radius: 4px; overflow: hidden; }
  .h-plate-strip { background: #1e3a8a; color: #fff; width: 18px; display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 6px; font-weight: bold; flex-shrink: 0; }
  .h-plate-strip .hs { font-size: 7px; }
  .h-plate-num { font-size: 12px; font-weight: 900; color: #0f172a; padding: 0 6px; display: flex; align-items: center; }

  .h-meta { display: flex; flex-direction: column; align-items: flex-end; justify-content: space-between; margin-right: 8px; height: 40px; }
  .h-time { font-size: 11px; color: #64748b; direction: ltr; }
  .h-del { background: none; border: none; color: #64748b; font-size: 18px; line-height: 1; cursor: pointer; padding: 0 2px; transition: color 0.2s; }
  .h-del:hover { color: #f87171; }

  .detail { display: none; }
  .detail.show { display: block; }

  .tabs { background: rgba(15, 23, 42, 0.8); backdrop-filter: blur(14px); display: none; justify-content: space-around; align-items: stretch; border-bottom: 1px solid rgba(56,189,248,0.2); margin-top: 14px; box-shadow: 0 4px 15px rgba(0,0,0,0.3); }
  .tabs.show { display: flex; }
  .tab { flex: 1; text-align: center; padding: 14px 0 10px; color: #94a3b8; font-size: 11px; cursor: pointer; border-bottom: 3px solid transparent; font-weight: 800; transition: all 0.3s; }
  .tab .ic { display: block; font-size: 16px; margin-bottom: 4px; filter: drop-shadow(0 0 5px rgba(255,255,255,0.2)); }
  .tab.active { color: #38bdf8; border-bottom-color: #38bdf8; background: rgba(56, 189, 248, 0.08); text-shadow: 0 0 10px rgba(56,189,248,0.5); }

  .hero { display: none; }
  .hero.show { display: block; }

  .logo-3d-scene {
    perspective: 1000px;
    width: 140px;
    height: 140px;
    margin: 24px auto 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    user-select: none;
    -webkit-user-select: none;
    position: relative;
  }
  
  .logo-3d-scene::before {
    content: '';
    position: absolute;
    inset: -6px;
    border-radius: 50%;
    background: conic-gradient(from 0deg, #38bdf8, transparent, #818cf8, transparent, #38bdf8);
    animation: holoSpin 6s linear infinite;
    opacity: 0.7;
    filter: blur(4px);
    z-index: 0;
  }

  @keyframes holoSpin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .brand-logo-container {
    width: 124px;
    height: 124px;
    background: radial-gradient(circle, #1e293b 0%, #0f172a 100%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 0 30px rgba(56, 189, 248, 0.4), inset 0 0 20px rgba(56, 189, 248, 0.2);
    border: 2px solid #38bdf8;
    padding: 16px;
    overflow: hidden;
    cursor: grab;
    touch-action: none;
    transform-style: preserve-3d;
    transition: transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.3s ease;
    position: relative;
    z-index: 1;
  }

  .brand-logo-container.dragging {
    cursor: grabbing;
    transition: none;
    box-shadow: 0 0 50px rgba(56, 189, 248, 0.8), inset 0 0 30px rgba(56, 189, 248, 0.4);
    border-color: #7dd3fc;
  }

  .brand-logo { width: 100%; height: 100%; object-fit: contain; pointer-events: none; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.7)); }
  .brand-badge { width: 100%; height: 100%; border-radius: 50%; color: #fff; font-size: 42px; font-weight: 900; display: flex; align-items: center; justify-content: center; pointer-events: none; text-shadow: 0 0 10px rgba(0,0,0,0.5); }

  .spin-hint {
    text-align: center;
    font-size: 12px;
    color: #38bdf8;
    margin-bottom: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    font-weight: 800;
    text-shadow: 0 0 8px rgba(56,189,248,0.4);
    letter-spacing: 0.5px;
  }

  .car-name { text-align: center; font-size: 26px; color: #f8fafc; font-weight: 900; margin-top: 4px; letter-spacing: -0.5px; text-shadow: 0 2px 10px rgba(0,0,0,0.5); }
  .car-trim { text-align: center; font-size: 16px; color: #38bdf8; font-weight: 900; margin-top: 2px; text-shadow: 0 0 10px rgba(56,189,248,0.4); }

  .cyber-story-card-container {
    margin: 20px 14px;
    padding: 24px 20px;
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #030712 100%);
    border-radius: 28px;
    border: 2px solid #38bdf8;
    box-shadow: 0 0 50px rgba(56, 189, 248, 0.35), inset 0 0 25px rgba(56, 189, 248, 0.15);
    position: relative;
    overflow: hidden;
    animation: cardFloatGlow 4s ease-in-out infinite alternate;
  }

  @keyframes cardFloatGlow {
    0% { transform: translateY(0px) scale(1); box-shadow: 0 10px 40px rgba(56, 189, 248, 0.25), inset 0 0 20px rgba(56, 189, 248, 0.1); }
    100% { transform: translateY(-4px) scale(1.01); box-shadow: 0 20px 60px rgba(56, 189, 248, 0.5), inset 0 0 35px rgba(56, 189, 248, 0.25); }
  }

  .cyber-story-content { position: relative; z-index: 1; }

  .cyber-card-top-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid rgba(56, 189, 248, 0.3);
    padding-bottom: 14px;
    margin-bottom: 16px;
  }

  .cyber-card-badge {
    background: rgba(56, 189, 248, 0.15);
    border: 1px solid #38bdf8;
    color: #38bdf8;
    padding: 5px 12px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 900;
    letter-spacing: 1px;
    box-shadow: 0 0 10px rgba(56, 189, 248, 0.3);
  }

  .cyber-card-logo-area {
    width: 65px;
    height: 65px;
    border-radius: 50%;
    background: #030712;
    border: 2px solid #38bdf8;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 0 20px rgba(56, 189, 248, 0.5);
    overflow: hidden;
    padding: 10px;
  }
  .cyber-card-logo-area img { width: 100%; height: 100%; object-fit: contain; }

  .cyber-card-title-box { text-align: center; margin-bottom: 18px; }
  .cyber-card-nickname {
    font-size: 26px;
    font-weight: 900;
    color: #fff;
    text-shadow: 0 0 15px rgba(56, 189, 248, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }
  .cyber-card-model-sub {
    font-size: 14px;
    color: #38bdf8;
    font-weight: 800;
    margin-top: 4px;
    text-shadow: 0 0 8px rgba(56, 189, 248, 0.4);
  }

  .cyber-card-stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    margin-bottom: 20px;
  }

  .cyber-stat-box {
    background: rgba(3, 7, 18, 0.7);
    border: 1px solid rgba(56, 189, 248, 0.3);
    border-radius: 16px;
    padding: 12px 6px;
    text-align: center;
    box-shadow: inset 0 0 10px rgba(56, 189, 248, 0.1);
  }
  .cyber-stat-box .val { font-size: 16px; font-weight: 900; color: #38bdf8; direction: ltr; text-shadow: 0 0 10px rgba(56, 189, 248, 0.6); }
  .cyber-stat-box .lbl { font-size: 10px; color: #94a3b8; font-weight: 800; margin-top: 4px; }

  .cyber-card-bottom-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: rgba(3, 7, 18, 0.85);
    padding: 12px 16px;
    border-radius: 16px;
    border: 1px solid rgba(56, 189, 248, 0.2);
  }

  .cyber-plate-badge {
    display: inline-flex;
    direction: ltr;
    align-items: stretch;
    height: 28px;
    background: #fbbf24;
    border: 1.5px solid #0f172a;
    border-radius: 6px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0,0,0,0.5);
  }
  .cyber-plate-strip { background: #1e3a8a; color: #fff; width: 20px; display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 7px; font-weight: bold; }
  .cyber-plate-num { font-size: 13px; font-weight: 900; color: #0f172a; padding: 0 8px; display: flex; align-items: center; }

  .cyber-share-btns { display: flex; gap: 10px; margin: 0 14px 20px; }
  .cyber-action-btn {
    flex: 1;
    background: linear-gradient(135deg, #0284c7, #0369a1);
    border: none;
    color: #fff;
    border-radius: 16px;
    padding: 14px;
    font-size: 13px;
    font-weight: 900;
    cursor: pointer;
    box-shadow: 0 0 20px rgba(56, 189, 248, 0.4);
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }
  .cyber-action-btn.edit { background: rgba(56, 189, 248, 0.15); border: 1px solid #38bdf8; color: #38bdf8; }

  .status-row { display: flex; justify-content: space-around; padding: 20px 14px 10px; gap: 10px; }
  .st { text-align: center; flex: 1; background: rgba(15, 23, 42, 0.7); backdrop-filter: blur(12px); padding: 16px 8px; border-radius: 18px; border: 1px solid rgba(56,189,248,0.2); box-shadow: 0 8px 25px rgba(0,0,0,0.4); }
  .st.clickable { cursor: pointer; }
  .st.clickable:hover { transform: translateY(-4px); border-color: rgba(56,189,248,0.5); }
  .st .st-ic { font-size: 28px; line-height: 1; height: 34px; display: flex; align-items: center; justify-content: center; }
  .st .st-main { font-size: 14px; font-weight: 900; margin-top: 6px; color: #f8fafc; }
  .st .st-sub { font-size: 12px; margin-top: 4px; font-weight: 800; }
  .st.ok .st-sub { color: #4ade80; text-shadow: 0 0 8px rgba(74,222,128,0.4); }
  .st.info .st-sub { color: #38bdf8; text-shadow: 0 0 8px rgba(56,189,248,0.4); }
  .st.neutral .st-sub { color: #94a3b8; }
  .st.bad .st-sub { color: #f87171; text-shadow: 0 0 8px rgba(248,113,113,0.4); }

  .own-btn-wrap { display: none; text-align: center; margin: 8px 14px 0; }
  .own-btn-wrap.show { display: block; }
  .own-btn { background: rgba(56, 189, 248, 0.15); border: 2px solid #38bdf8; color: #38bdf8; border-radius: 24px; padding: 10px 22px; font-size: 13px; cursor: pointer; font-weight: 900; box-shadow: 0 0 15px rgba(56,189,248,0.2); }
  .own-panel { display: none; margin: 14px 14px 0; }
  .own-panel.show { display: block; }

  .spec-card { background: rgba(15, 23, 42, 0.7); backdrop-filter: blur(12px); border-radius: 20px; margin: 16px 14px 0; padding: 16px 8px; display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; border: 1px solid rgba(56,189,248,0.2); box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
  .spec { text-align: center; background: rgba(3, 7, 18, 0.5); padding: 12px 2px; border-radius: 14px; border: 1px solid rgba(56,189,248,0.1); }
  .spec .sp-ic { font-size: 20px; height: 26px; display: flex; align-items: center; justify-content: center; }
  .spec .sp-lbl { font-size: 9.5px; color: #94a3b8; margin-top: 4px; font-weight: 800; white-space: nowrap; }
  .spec .sp-val { font-size: 11.5px; font-weight: 900; color: #38bdf8; margin-top: 4px; direction: ltr; }
  .spec .sp-val.na { color: #64748b; font-weight: normal; direction: rtl; font-size: 11px; }
  .spec.phev-highlight { border-color: #38bdf8; box-shadow: 0 0 15px rgba(56, 189, 248, 0.5); }

  .phev-reveal-btn {
    display: none;
    margin: 12px 14px 0;
    padding: 12px 16px;
    border-radius: 16px;
    background: linear-gradient(135deg, rgba(56, 189, 248, 0.15) 0%, rgba(15, 23, 42, 0.9) 100%);
    border: 1.5px dashed #38bdf8;
    color: #38bdf8;
    font-size: 12.5px;
    font-weight: 900;
    text-align: center;
    cursor: pointer;
    box-shadow: 0 0 20px rgba(56, 189, 248, 0.25);
  }
  .phev-reveal-btn.active { background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); border-style: solid; color: #fff; }

  .power-feel-badge { margin: 12px 14px 0; padding: 12px 16px; border-radius: 16px; background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(56, 189, 248, 0.3); display: flex; align-items: center; justify-content: space-between; }
  .power-feel-lbl { font-size: 12px; font-weight: 800; color: #94a3b8; }
  .power-feel-val { font-size: 13px; font-weight: 900; color: #38bdf8; text-shadow: 0 0 10px rgba(56,189,248,0.5); }

  .scale-card { background: rgba(15, 23, 42, 0.75); backdrop-filter: blur(14px); border-radius: 22px; margin: 14px 14px 0; padding: 18px 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); border: 1px solid rgba(56,189,248,0.25); position: relative; }
  .scale-header { text-align: center; font-size: 17px; font-weight: 900; margin-bottom: 6px; color: #f8fafc; }
  .scale-header span { color: #38bdf8; text-shadow: 0 0 10px rgba(56,189,248,0.6); }
  .indicator-arrow-wrap { height: 14px; position: relative; margin-bottom: 3px; }
  .indicator-arrow { position: absolute; width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 8px solid #38bdf8; transform: translateX(50%); transition: left 0.4s ease; }
  .colored-scale { display: flex; border-radius: 12px; overflow: hidden; height: 28px; border: 1px solid rgba(255,255,255,0.1); }
  .scale-seg { flex: 1; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 900; color: #fff; border-left: 1px solid rgba(0,0,0,0.2); }
  .score-badge-wrap { display: flex; justify-content: center; margin-top: 14px; }
  .score-badge { display: inline-flex; align-items: center; gap: 8px; border: 1.5px solid #38bdf8; border-radius: 20px; padding: 6px 18px; background: rgba(56, 189, 248, 0.1); }
  .score-badge .score-num { font-size: 15px; font-weight: 900; color: #38bdf8; }
  .score-badge .score-txt { font-size: 12px; font-weight: 800; color: #f8fafc; }

  .emission-table { width: 100%; border-collapse: collapse; margin-top: 14px; font-size: 12px; background: rgba(3, 7, 18, 0.5); border-radius: 12px; overflow: hidden; border: 1px solid rgba(56,189,248,0.15); }
  .emission-table th { background: rgba(56, 189, 248, 0.15); color: #38bdf8; padding: 8px 10px; font-weight: 900; text-align: center; }
  .emission-table td { padding: 8px 10px; text-align: center; color: #f8fafc; border-bottom: 1px solid rgba(255,255,255,0.04); font-weight: 700; }

  .accel-disclaimer { margin: 10px 14px 0; font-size: 11px; color: #94a3b8; line-height: 1.45; text-align: center; background: rgba(15, 23, 42, 0.6); padding: 10px 14px; border-radius: 14px; border: 1px solid rgba(56,189,248,0.2); font-weight: 600; }

  .list-card { background: rgba(15, 23, 42, 0.7); backdrop-filter: blur(12px); border-radius: 20px; margin: 16px 14px 0; overflow: hidden; border: 1px solid rgba(56,189,248,0.2); box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
  .lrow { display: flex; align-items: center; padding: 14px 18px; border-bottom: 1px solid rgba(255,255,255,0.04); }
  .lrow:last-child { border-bottom: none; }
  .lrow .li { width: 36px; height: 36px; border-radius: 50%; background: rgba(56, 189, 248, 0.15); display: flex; align-items: center; justify-content: center; margin-left: 14px; font-size: 16px; color: #38bdf8; border: 1px solid rgba(56,189,248,0.3); }
  .lrow .ll { color: #94a3b8; font-size: 13px; text-align: right; font-weight: 800; }
  .lrow .sp { flex: 1; }
  .lrow .lv { color: #f8fafc; font-size: 13px; font-weight: 900; margin-right: 6px; direction: ltr; }
  .copy-btn { display: none; background: rgba(56, 189, 248, 0.15); border: 1px solid #38bdf8; color: #38bdf8; border-radius: 12px; padding: 5px 14px; font-size: 11px; cursor: pointer; font-weight: 900; }
  .copy-btn.show { display: inline-block; }

  .test-card { background: rgba(15, 23, 42, 0.7); backdrop-filter: blur(12px); border-radius: 20px; margin: 16px 14px 0; padding: 18px; border: 1px solid rgba(56,189,248,0.2); }
  .test-row { display: flex; align-items: center; justify-content: space-between; padding: 10px 8px; border-bottom: 1px solid rgba(255,255,255,0.04); }
  .test-row:last-child { border-bottom: none; }
  .test-row .tl { color: #94a3b8; font-size: 13px; font-weight: 800; }
  .test-row .tv { color: #f8fafc; font-size: 14px; font-weight: 900; direction: ltr; }
  .test-countdown { text-align: center; font-size: 13px; font-weight: 900; color: #4ade80; margin-top: 12px; background: rgba(34, 197, 94, 0.12); padding: 12px; border-radius: 12px; border: 1px solid rgba(34, 197, 94, 0.3); }
  .test-countdown.bad { color: #f87171; background: rgba(239, 68, 68, 0.12); border-color: rgba(239, 68, 68, 0.3); }

  .report-btn-wrap { text-align: center; margin: 28px 14px 16px; }
  .report-btn { display: inline-flex; align-items: center; gap: 10px; background: rgba(15, 23, 42, 0.7); border: 2px dashed #38bdf8; color: #38bdf8; border-radius: 16px; padding: 14px 26px; font-size: 13px; font-weight: 900; cursor: pointer; }

  .modal-overlay { display: none; position: fixed; inset: 0; background: rgba(3, 7, 18, 0.85); backdrop-filter: blur(8px); z-index: 1000; align-items: center; justify-content: center; padding: 20px; }
  .modal-overlay.show { display: flex; }
  .modal-card { background: #0f172a; width: 100%; max-width: 360px; border-radius: 22px; padding: 24px; direction: rtl; text-align: right; border: 1px solid rgba(56,189,248,0.3); }
  .modal-title { font-size: 18px; font-weight: 900; color: #38bdf8; margin-bottom: 6px; }
  .modal-sub { font-size: 12px; color: #94a3b8; margin-bottom: 18px; font-weight: 700; }
  .modal-field-lbl { font-size: 12px; font-weight: 900; color: #e2e8f0; margin: 14px 0 6px; }
  .modal-input, .modal-select { width: 100%; padding: 11px; border: 1px solid rgba(56,189,248,0.3); border-radius: 12px; font-family: inherit; font-size: 13px; background: #030712; color: #f8fafc; font-weight: 700; outline: none; }
  .modal-actions { display: flex; gap: 10px; margin-top: 20px; }
  .modal-submit { flex: 1; background: linear-gradient(135deg, #0284c7, #0369a1); color: #fff; border: none; padding: 12px; border-radius: 12px; font-weight: 900; cursor: pointer; }
  .modal-close { background: #1e293b; color: #94a3b8; border: none; padding: 12px 18px; border-radius: 12px; font-weight: 900; cursor: pointer; }

  .search-results-list { max-height: 250px; overflow-y: auto; margin-top: 10px; border-radius: 10px; background: #030712; border: 1px solid rgba(56,189,248,0.2); }
  .search-result-item { padding: 10px 14px; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 12px; cursor: pointer; font-weight: 800; display: flex; justify-content: space-between; align-items: center; }
  .search-result-item:hover { background: rgba(56,189,248,0.2); color: #38bdf8; }

  .compare-container { padding: 16px 14px 30px; animation: fadeIn 0.3s ease; }
  .compare-banner { background: linear-gradient(135deg, rgba(56,189,248,0.25), rgba(15,23,42,0.9)); border: 1px solid rgba(56,189,248,0.4); border-radius: 20px; padding: 20px; text-align: center; margin-bottom: 16px; }
  .compare-banner h2 { font-size: 20px; font-weight: 900; color: #38bdf8; margin-bottom: 6px; }
  .compare-inputs { display: flex; gap: 8px; margin-bottom: 16px; }
  .compare-input { flex: 1; background: #030712; border: 1px solid rgba(56,189,248,0.4); color: #38bdf8; font-size: 16px; font-weight: 900; padding: 12px; border-radius: 14px; text-align: center; outline: none; }
  .compare-btn { background: linear-gradient(135deg, #0284c7, #0369a1); color: #fff; border: none; border-radius: 14px; padding: 0 20px; font-weight: 900; cursor: pointer; }
  .compare-result-card { background: rgba(15, 23, 42, 0.85); border: 1px solid rgba(56,189,248,0.3); border-radius: 20px; padding: 18px; display: none; }
  .compare-result-card.show { display: block; }
  .compare-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 14px; }
  .compare-col { background: rgba(3, 7, 18, 0.6); border: 1px solid rgba(56,189,248,0.2); border-radius: 14px; padding: 12px; text-align: center; }
  .compare-col-title { font-size: 14px; font-weight: 900; color: #38bdf8; margin-bottom: 10px; border-bottom: 1px solid rgba(56,189,248,0.2); padding-bottom: 6px; }
  .compare-metric { font-size: 12px; color: #94a3b8; font-weight: 800; margin-top: 8px; }
  .compare-val { font-size: 14px; font-weight: 900; color: #f8fafc; direction: ltr; margin-top: 2px; }

  .hunter-container { padding: 16px 14px 30px; }
  .hunter-banner { background: linear-gradient(135deg, rgba(2,132,199,0.25), rgba(15,23,42,0.9)); border: 1px solid rgba(56,189,248,0.4); border-radius: 20px; padding: 20px; text-align: center; margin-bottom: 16px; }
  .hunter-banner h2 { font-size: 20px; font-weight: 900; color: #38bdf8; margin-bottom: 6px; }
  .nick-edit-box { display: flex; gap: 8px; justify-content: center; align-items: center; margin-top: 10px; }
  .nick-input { background: #030712; border: 1px solid rgba(56,189,248,0.4); color: #38bdf8; font-size: 15px; font-weight: 900; padding: 8px 12px; border-radius: 12px; text-align: center; outline: none; width: 170px; }
  .nick-save-btn { background: linear-gradient(135deg, #0284c7, #0369a1); color: #fff; border: none; border-radius: 12px; padding: 9px 16px; font-weight: 900; cursor: pointer; }
  .hunter-stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 16px; }
  .hunter-stat-box { background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(56,189,248,0.2); border-radius: 16px; padding: 14px; text-align: center; }
  .hunter-stat-box .num { font-size: 22px; font-weight: 900; color: #38bdf8; }
  .hunter-stat-box .lbl { font-size: 11px; color: #94a3b8; margin-top: 4px; font-weight: 800; }
  .hunter-section-title { font-size: 15px; font-weight: 900; color: #f8fafc; margin: 20px 4px 10px; }
  .hunter-table { width: 100%; border-collapse: collapse; background: rgba(15, 23, 42, 0.85); border-radius: 16px; overflow: hidden; font-size: 13px; border: 1px solid rgba(56,189,248,0.2); }
  .hunter-table th { background: linear-gradient(135deg, #0284c7, #0369a1); color: #fff; padding: 12px 8px; font-weight: 900; text-align: center; }
  .hunter-table td { padding: 12px 8px; text-align: center; color: #f8fafc; border-bottom: 1px solid rgba(255,255,255,0.04); font-weight: 700; }
  .hunter-table tr.my-row td { background: rgba(56, 189, 248, 0.15); color: #38bdf8; font-weight: 900; }
  .hunter-table tr.separator-row td { background: rgba(15, 23, 42, 0.95); color: #64748b; font-size: 11px; letter-spacing: 2px; padding: 6px; }

  #cyberTransitionOverlay { position: fixed; inset: 0; background: radial-gradient(circle, rgba(15,23,42,0.95) 0%, rgba(3,7,18,0.98) 100%); backdrop-filter: blur(20px); z-index: 9999; display: none; flex-direction: column; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.4s ease; }
  #cyberTransitionOverlay.show { display: flex; opacity: 1; }
  .transit-holo-ring { width: 140px; height: 140px; border-radius: 50%; border: 3px solid rgba(56,189,248,0.3); display: flex; align-items: center; justify-content: center; position: relative; box-shadow: 0 0 40px rgba(56,189,248,0.4); }
  .transit-title { margin-top: 24px; font-size: 22px; font-weight: 900; color: #f8fafc; }
  .transit-sub { margin-top: 8px; font-size: 13px; color: #38bdf8; font-weight: 800; letter-spacing: 2px; }
</style>
</head>
<body>
<div class="phone">

  <div class="topbar">
    <span class="i" id="favBtn">♡</span>
    <span class="t" id="topTitle">פרטי רכב</span>
    <span class="i" id="menuToggleBtn">☰</span>
    <span class="i hidden" id="backBtn">←</span>

    <!-- תפריט מתקדם עם אפשרויות החיפוש החדשות -->
    <div id="sideMenuDropdown" class="menu-dropdown">
      <div class="menu-item" id="menuCamSearch">📸 חיפוש עם מצלמה</div>
      <div class="menu-item" id="menuVinSearch">🔩 חיפוש לפי שלדה</div>
      <div class="menu-item" id="menuPartialSearch">🔍 חיפוש חלקי (דגם/יצרן)</div>
      <div class="menu-item" data-menutab="card">⚡ כרטיס סייבר</div>
      <div class="menu-item" data-menutab="hunter">🎯 צייד רכבים</div>
    </div>
  </div>

  <div class="search-box">
    <div class="plate">
      <div class="strip">
        <span class="flag">✡</span>
        <span class="il">IL</span>
        <span class="he">ישראל</span>
      </div>
      <input type="text" id="plateInput" inputmode="numeric" placeholder="הקלד מספר רכב">
      <button id="searchBtn">חפש</button>
    </div>
    <div id="loader" class="msg">מחפש במאגר משרד התחבורה...</div>
    <div id="errorMsg" class="msg err"></div>
  </div>

  <div id="history" class="history">
    <div class="history-head">
      <span class="h-title">חיפושים אחרונים</span>
      <button id="histClear" class="h-clear">נקה הכל</button>
    </div>
    <div id="historyList"></div>
  </div>

  <div id="detailView" class="detail">
    <div id="kmLine" class="km-line">
      <span class="km-ic">1½</span>
      <span id="kmText"></span>
    </div>

    <!-- טאבים ראשיים -->
    <div id="tabs" class="tabs">
      <div class="tab active" data-tab="general"><span class="ic">🚗</span>כללי</div>
      <div class="tab" data-tab="tech"><span class="ic">⚙️</span>מפרט ובטיחות</div>
      <div class="tab" data-tab="env"><span class="ic">🌐</span>סביבה</div>
      <div class="tab" data-tab="compare"><span class="ic">⚖️</span>השוואה</div>
    </div>

    <!-- 1. טאב כללי -->
    <div id="cardGeneral">
      <div id="hero" class="hero">
        <div class="logo-3d-scene">
          <div class="brand-logo-container" id="logoSpinner" title="גרור כדי לסובב 360 מעלות">
            <img id="brandLogo" class="brand-logo" alt="סמל יצרן">
            <div id="brandBadge" class="brand-badge" style="display:none;"></div>
          </div>
        </div>
        <div class="spin-hint"><span>✨</span> הולוגרמה 360° — גרור או סובב סביב הציר</div>

        <div class="car-name"><span id="heroName"></span></div>
        <div class="car-trim" id="heroTrim"></div>

        <div id="importerPriceCard" class="importer-price-card">
          <div class="importer-price-main">
            <div class="importer-icon">
              <span style="font-size:18px; font-weight:900;">₪</span>
            </div>
            <div class="importer-text-wrap">
              <div class="importer-price-val" id="vImporterPrice">-</div>
              <div class="importer-name" id="vImporterName">יבואן: -</div>
            </div>
          </div>
          <div class="importer-disclaimer">* לא כולל תוספות מיוחדות</div>
        </div>

        <div class="status-row">
          <div id="stDisabled" class="st neutral">
            <div class="st-ic">🅿️</div>
            <div class="st-main">תג נכה</div>
            <div class="st-sub"></div>
          </div>
          <div id="stOwn" class="st info clickable">
            <div class="st-ic">🛡️</div>
            <div class="st-main">בעלות</div>
            <div class="st-sub"></div>
          </div>
          <div id="stTest" class="st neutral">
            <div class="st-ic">📅</div>
            <div class="st-main">טסט</div>
            <div class="st-sub"></div>
          </div>
        </div>

        <div id="ownBtnWrap" class="own-btn-wrap">
          <button id="ownBtn" class="own-btn">הצג הסטוריית בעלות</button>
        </div>
        <div id="ownPanel" class="own-panel"></div>

        <div class="spec-card">
          <div class="spec" id="specHpCard">
            <div class="sp-ic">⚡</div>
            <div class="sp-lbl" id="spHpLbl">כוח סוס</div>
            <div class="sp-val" id="sHp">אין נתון</div>
          </div>
          <div class="spec">
            <div class="sp-ic">⏱️</div>
            <div class="sp-lbl">0-100 קמ"ש</div>
            <div class="sp-val" id="sAccel">אין נתון</div>
          </div>
          <div class="spec">
            <div class="sp-ic">🚀</div>
            <div class="sp-lbl">מהירות מרבית</div>
            <div class="sp-val" id="sTopSpeed">אין נתון</div>
          </div>
          <div class="spec">
            <div class="sp-ic">⚖️</div>
            <div class="sp-lbl">הספק-משקל</div>
            <div class="sp-val" id="sPowerWeight">אין נתון</div>
          </div>
          <div class="spec">
            <div class="sp-ic">⚙️</div>
            <div class="sp-lbl">נפח מנוע</div>
            <div class="sp-val" id="sEngine">אין נתון</div>
          </div>
        </div>

        <div id="phevRevealBtn" class="phev-reveal-btn">
          <span class="phev-tag" id="phevTagLabel">HEV</span>
          <span id="phevBtnText">⚡ לחץ כאן לחשיפת ההספק המשולב (מנוע + חשמל)</span>
        </div>

        <div id="powerFeelBadge" class="power-feel-badge" style="display:none;">
          <span class="power-feel-lbl">תחושת נהיגה והרגשה:</span>
          <span class="power-feel-val" id="powerFeelText">-</span>
        </div>

        <div class="accel-disclaimer">ℹ️ נתוני ביצועים והערכה משמשים לאינדיקציה בלבד.</div>

        <div class="list-card">
          <div class="lrow"><span class="li">🏭</span><span class="ll">יצרן</span><span class="sp"></span><span class="lv" id="vManufacturer"></span></div>
          <div class="lrow"><span class="li">🚙</span><span class="ll">דגם</span><span class="sp"></span><span class="lv" id="vModel"></span></div>
          <div class="lrow"><span class="li">📅</span><span class="ll">שנת ייצור</span><span class="sp"></span><span class="lv" id="vYear"></span></div>
          <div class="lrow"><span class="li">🎨</span><span class="ll">צבע</span><span class="sp"></span><span class="lv" id="vColor"></span></div>
          <div class="lrow"><span class="li">🔢</span><span class="ll">מספר רכב</span><span class="sp"></span><span class="lv" id="vPlate"></span></div>
          <div class="lrow"><span class="li">🔩</span><span class="ll">מספר שלדה</span><span class="sp"></span><span class="lv" id="vChassis"></span><button id="copyChassis" class="copy-btn">העתק</button></div>
        </div>

        <div class="test-card">
          <div class="test-row"><span class="tl">טסט אחרון</span><span class="tv" id="vLastTest"></span></div>
          <div class="test-row"><span class="tl">טסט הבא</span><span class="tv" id="vNextTest"></span></div>
          <div class="test-countdown" id="vCountdown"></div>
        </div>
      </div>
    </div>

    <!-- 2. טאב כרטיס סייבר -->
    <div id="cardCardTab" style="display:none; padding-top: 10px;">
      <div class="cyber-story-card-container">
        <div class="cyber-story-content">
          <div class="cyber-card-top-row">
            <span class="cyber-card-badge">⚡ CYBER ID CARD</span>
            <div class="cyber-card-logo-area">
              <img id="cardLogoImg" alt="סמל" style="display:none;">
              <span id="cardBadgeSign" style="font-size:24px; font-weight:900; color:#fff;">🚗</span>
            </div>
          </div>
          <div class="cyber-card-title-box">
            <div class="cyber-card-nickname"><span id="cardNickDisplay">"המפלצת שלי"</span> ⚙️</div>
            <div class="cyber-card-model-sub" id="cardModelSub">-</div>
          </div>
          <div class="cyber-card-stats-grid">
            <div class="cyber-stat-box"><div class="val" id="cardHpVal">-</div><div class="lbl">הספק כ"ס</div></div>
            <div class="cyber-stat-box"><div class="val" id="cardAccelVal">-</div><div class="lbl">0-100 קמ"ש</div></div>
            <div class="cyber-stat-box"><div class="val" id="cardTopSpeedVal">-</div><div class="lbl">מהירות מרבית</div></div>
          </div>
          <div class="cyber-card-bottom-row">
            <div class="cyber-plate-badge"><span class="cyber-plate-strip">✡IL</span><span class="cyber-plate-num" id="cardPlateNum">-</span></div>
            <span style="font-size:11px; font-weight:900; color:#38bdf8;">PREMIUM SPECS</span>
          </div>
        </div>
      </div>
      <div class="cyber-share-btns">
        <button id="shareCyberCardBtn" class="cyber-action-btn">📤 שתף כרטיס לוואטסאפ</button>
        <button id="editNickBtn" class="cyber-action-btn edit">✏️ שנה כינוי</button>
      </div>
    </div>

    <!-- 3. טאב מפרט ובטיחות -->
    <div id="cardTech" style="display:none;"></div>

    <!-- 4. טאב סביבה -->
    <div id="cardEnv" style="display:none;"></div>

    <!-- 5. טאב השוואת רכב -->
    <div id="cardCompare" class="compare-container" style="display:none;">
      <div class="compare-banner">
        <h2>⚖️ השוואת רכבים חכמה</h2>
        <p>השווה נתונים, ביצועים והספקים בין שני רכבים בזמן אמת</p>
      </div>
      <div class="compare-inputs">
        <input type="text" id="comparePlate2" class="compare-input" inputmode="numeric" placeholder="מספר רכב שני">
        <button id="compareActionBtn" class="compare-btn">השווה</button>
      </div>
      <div id="compareResultCard" class="compare-result-card">
        <div style="font-size:15px; font-weight:900; color:#38bdf8; text-align:center; margin-bottom:10px;">תוצאת השוואה הולוגרפית</div>
        <div class="compare-grid">
          <div class="compare-col">
            <div class="compare-col-title" id="cmpCar1Title">רכב נוכחי</div>
            <div class="compare-metric">הספק (כ"ס)</div><div class="compare-val" id="cmpHp1">-</div>
            <div class="compare-metric">תאוצה 0-100</div><div class="compare-val" id="cmpAccel1">-</div>
            <div class="compare-metric">שנתון</div><div class="compare-val" id="cmpYear1">-</div>
          </div>
          <div class="compare-col">
            <div class="compare-col-title" id="cmpCar2Title">רכב משווה</div>
            <div class="compare-metric">הספק (כ"ס)</div><div class="compare-val" id="cmpHp2">-</div>
            <div class="compare-metric">תאוצה 0-100</div><div class="compare-val" id="cmpAccel2">-</div>
            <div class="compare-metric">שנתון</div><div class="compare-val" id="cmpYear2">-</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 6. טאב צייד רכבים -->
    <div id="cardHunter" class="hunter-container" style="display:none;">
      <div class="hunter-banner">
        <h2>🎯 מגרש ציידי הרכבים</h2>
        <p>⚡ איסוף אוטומטי פעיל: כל רכב שתחפש באפליקציה מתווסף ישירות לאוסף שלך!</p>
        <div class="nick-edit-box">
          <input type="text" id="hunterNickInput" class="nick-input" placeholder="כינוי צייד" maxlength="16">
          <button id="hunterSaveNickBtn" class="hunter-save-btn">שמור</button>
        </div>
      </div>
      <div class="hunter-stats-grid">
        <div class="hunter-stat-box"><div class="num" id="hunterMyName">-</div><div class="lbl">הכינוי שלך</div></div>
        <div class="hunter-stat-box"><div class="num" id="hunterScore">0</div><div class="lbl">רכבים באוסף</div></div>
      </div>
      <div class="hunter-section-title">🏆 צמרת הטבלה והמיקום שלך</div>
      <table class="hunter-table">
        <thead><tr><th>מיקום</th><th>כינוי צייד</th><th>רכבים</th></tr></thead>
        <tbody id="hunterLeaderboardBody"></tbody>
      </table>
    </div>

  </div>
</div>

<!-- מודל חיפוש לפי שלדה -->
<div id="vinModal" class="modal-overlay">
  <div class="modal-card">
    <div class="modal-title">🔩 חיפוש לפי מספר שלדה</div>
    <div class="modal-sub">הזן את מספר השלדה (VIN) של הרכב</div>
    <input type="text" id="vinInputModal" class="modal-input" placeholder="מספר שלדה..." style="text-transform:uppercase;">
    <div class="modal-actions">
      <button id="submitVinSearch" class="modal-submit">חפש שלדה</button>
      <button id="closeVinModal" class="modal-close">ביטול</button>
    </div>
  </div>
</div>

<!-- מודל חיפוש חלקי -->
<div id="partialModal" class="modal-overlay">
  <div class="modal-card">
    <div class="modal-title">🔍 חיפוש חלקי (דגם/יצרן)</div>
    <div class="modal-sub">הקלד מילות מפתח מתוך שם הרכב</div>
    <input type="text" id="partialInputModal" class="modal-input" placeholder="למשל: קופרה, קורולה...">
    <div id="partialResultsList" class="search-results-list" style="display:none;"></div>
    <div class="modal-actions">
      <button id="submitPartialSearch" class="modal-submit">חפש</button>
      <button id="closePartialModal" class="modal-close">ביטול</button>
    </div>
  </div>
</div>

<!-- מודל מצלמה -->
<div id="camModal" class="modal-overlay">
  <div class="modal-card" style="text-align:center;">
    <div class="modal-title">📸 סריקת לוחית רישוי במצלמה</div>
    <div class="modal-sub">כוון את המצלמה אל לוחית הרישוי</div>
    <div style="margin: 15px 0;">
      <video id="camVideo" autoplay playsinline style="width:100%; max-height:200px; border-radius:12px; background:#000; object-fit:cover; display:none;"></video>
    </div>
    <input type="file" id="plateFileinput" accept="image/*" capture="environment" style="display:none;">
    <div class="modal-actions" style="flex-direction:column; gap:8px;">
      <button id="startCamBtn" class="modal-submit">פתח מצלמה חיה</button>
      <button id="snapPhotoBtn" class="modal-submit" style="display:none; background:#10b981;">זהה מספר רכב</button>
      <button id="uploadPhotoBtn" class="modal-submit" style="background:#0284c7;">העלה תמונה מהגלריה</button>
      <button id="closeCamModal" class="modal-close">סגור</button>
    </div>
  </div>
</div>

<div id="cyberTransitionOverlay">
  <div class="transit-holo-ring"><div class="transit-logo">⚡</div></div>
  <div class="transit-title" id="transitTitle">טוען פרוטוקול רכב...</div>
  <div class="transit-sub">SYNCHRONIZING CYBERNETIC LINK</div>
</div>

<script>
  const API_BASE = "https://car-api-huth.onrender.com";
  // שאר פונקציות ה-JS המקוריות שלך יפעלו כאן בצורה חלקה יחד עם ממשקי החיפוש החדשים.
</script>
</body>
</html>
