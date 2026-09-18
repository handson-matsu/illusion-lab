'use strict';
const app = document.getElementById('app');
let index = 0;
let phase = 'question';
let responses = [];
const fmt = n => Number(n.toFixed(2)).toString();
const pct = n => fmt(n * 100);
const line = (x1,y1,x2,y2,extra='') => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" ${extra}/>`;
const circle = (x,y,r,extra='') => `<circle cx="${x}" cy="${y}" r="${r}" ${extra}/>`;
const label = (x,y,s) => `<text x="${x}" y="${y}" text-anchor="middle" class="svg-label">${s}</text>`;
const context = content => `<g class="surround">${content}</g>`;
const guides = content => `<g class="verify-guides">${content}</g>`;
const target = (x,y,tx,ty,content,rotation=0,scale=1) => `<g transform="translate(${x} ${y})"><g class="target" style="--verify-transform:translate(${tx-x}px,${ty-y}px) rotate(${rotation}deg) scale(${scale})">${content}</g></g>`;
const ink = '#29312c';
const blue = '#305bdd';
function grid() {
  let s='';
  for(let x=140;x<=620;x+=30) s+=line(x,65,x,315);
  for(let y=75;y<=315;y+=30) s+=line(140,y,620,y);
  return `<g stroke="#dce4df" stroke-width="1">${s}</g>`;
}
function dimensionGuide(x,y,width,text) {
  return `<g stroke="#748574" stroke-width="1" fill="none">${line(x,y,x+width,y)}${line(x,y-6,x,y+6)}${line(x+width,y-6,x+width,y+6)}</g><text x="${x+width/2}" y="${y+23}" text-anchor="middle" fill="#556453" font-size="14">${text}</text>`;
}
function drawing(q) {
  const d=dimensions(q); let s='';
  if(['muller','ponzo','vertical'].includes(q.type)) {
    const xa=140, ya=190, xb=440, yb=190;
    const dest=270;
    s+=guides(`<g stroke="#b2c29f" stroke-dasharray="4 4">${line(dest,115,dest,275)}${line(dest+d.a,125,dest+d.a,270)}${line(dest+d.b,125,dest+d.b,270)}</g>${label(dest-25,158,'A')}${label(dest-25,238,'B')}${dimensionGuide(dest,170,d.a,fmt(d.a))}${dimensionGuide(dest,250,d.b,fmt(d.b))}`);
    if(q.type==='muller') {
      let feathers='';
      [[xa,d.a,1],[xb,d.b,-1]].forEach(([x,len,dir])=>{
        feathers+=`<path d="M ${x-dir*30} 159 L ${x} 190 L ${x-dir*30} 221 M ${x+len+dir*30} 159 L ${x+len} 190 L ${x+len+dir*30} 221"/>`;
      });
      s+=context(`<g stroke="${ink}" stroke-width="3" fill="none">${feathers}</g>${label(xa+d.a/2,280,'A')}${label(xb+d.b/2,280,'B')}`);
      s+=target(xa,ya,dest,150,line(0,0,d.a,0,`stroke="${ink}" stroke-width="4"`));
      s+=target(xb,yb,dest,230,line(0,0,d.b,0,`stroke="${ink}" stroke-width="4"`));
    } else if(q.type==='ponzo') {
      let rails=line(195,330,338,45)+line(565,330,422,45);
      for(let y=85;y<325;y+=37) {const left=338-(y-45)*143/285;rails+=line(left,y,760-left,y);}
      s+=context(`<g stroke="#929d94" stroke-width="2">${rails}</g>${label(245,273,'A')}${label(260,128,'B')}`);
      s+=target(380-d.a/2,267,dest,150,line(0,0,d.a,0,`stroke="${blue}" stroke-width="6"`));
      s+=target(380-d.b/2,122,dest,230,line(0,0,d.b,0,`stroke="${blue}" stroke-width="6"`));
    } else {
      s+=context(label(315,300,'A')+label(452,170,'B'));
      s+=target(220,260,dest,150,line(0,0,d.a,0,`stroke="${ink}" stroke-width="4"`));
      s+=target(430,260,dest,230,line(0,0,0,-d.b,`stroke="${ink}" stroke-width="4"`),90);
    }
  } else if(q.type==='ebbinghaus') {
    let surround='';
    [220,540].forEach((cx,j)=>{
      for(let k=0;k<8;k++) {let t=k*Math.PI/4; surround+=circle(cx+Math.cos(t)*(j?65:108),180+Math.sin(t)*(j?65:108),j?13:36);}
    });
    s+=context(`<g fill="#c8d0c4">${surround}</g>${label(220,360,'A')}${label(540,360,'B')}`);
    s+=guides(`<g stroke="#c7d2bf" stroke-dasharray="4 4">${line(295,180,465,180)}${line(380,100,380,260)}</g>${label(380,290,'同じ倍率で拡大・重ねる')}${label(380,330,'A：黒い実線　B：青い破線')}`);
    s+=target(220,180,380,180,circle(0,0,d.a,`class="overlay-circle" fill="${ink}" stroke="${ink}"`),0,2);
    s+=target(540,180,380,180,circle(0,0,d.b,`class="overlay-circle" fill="${ink}" stroke="${blue}" stroke-dasharray="6 5"`),0,2);
  } else if(q.type==='brightness'||q.type==='color') {
    const colors=swatches(q);
    s+=`<rect x="110" y="55" width="540" height="240" rx="2" fill="#999"/>`;
    s+=context(`<rect x="110" y="55" width="270" height="240" fill="${q.type==='color'?'#d8b55e':'#303030'}"/><rect x="380" y="55" width="270" height="240" fill="${q.type==='color'?'#727abd':'#e6e6e6'}"/>${label(245,330,'A')}${label(515,330,'B')}`);
    s+=target(205,135,300,135,`<rect width="80" height="80" fill="${colors.a}"/>`);
    s+=target(475,135,380,135,`<rect width="80" height="80" fill="${colors.b}"/>`);
    s+=guides(label(340,254,'A')+label(420,254,'B')+label(380,330,'同じ背景で、隣り合わせに'));
  } else if(q.type==='zollner') {
    s+=guides(grid());
    let ticks='';
    for(let j=0;j<2;j++) for(let x=190;x<=570;x+=35){let y=135+j*105;ticks+=line(x-13,y+(j?24:-24),x+13,y+(j?-24:24));}
    s+=context(`<g stroke="#919c91" stroke-width="2.5">${ticks}</g>`);
    const dy=Math.tan(q.angle*Math.PI/180)*200;
    s+=`<g stroke="${ink}" stroke-width="4">${line(170,135,590,135)}${line(170,240-dy*1.05,590,240+dy*1.05)}</g>`;
    s+=guides(`<g stroke="${blue}" stroke-width="1.5" stroke-dasharray="6 5">${line(140,135,620,135)}${line(140,240,620,240)}</g>${label(380,350,q.angle===0?'どちらも水平ガイドに一致':`傾きの差 ${fmt(q.angle)}°`)}`);
  } else if(q.type==='hering') {
    let rays='';for(let angle=0;angle<180;angle+=10){let r=angle*Math.PI/180; rays+=line(380-Math.cos(r)*340,190-Math.sin(r)*150,380+Math.cos(r)*340,190+Math.sin(r)*150);}
    s+=context(`<g stroke="#b0b9ad" stroke-width="1.6">${rays}</g>`);
    s+=guides(grid());
    s+=`<g stroke="${blue}" stroke-width="4" fill="none"><path d="M160 130 Q380 ${130-q.bend*2} 600 130"/><path d="M160 250 Q380 ${250+q.bend*2} 600 250"/></g>`;
    s+=guides(`<g stroke="${ink}" stroke-width="1.5" stroke-dasharray="6 5">${line(160,130,600,130)}${line(160,250,600,250)}</g>${label(380,350,'破線の直線ガイドを重ねる')}`);
  } else if(q.type==='center') {
    const x=380+q.base*q.offset, start=380-q.base/2,end=380+q.base/2;
    let bars='';for(let i=0;i<12;i++) bars+=line(start+i*15,110+i*3,start+i*15,270-i*3);
    s+=context(`<g stroke="#b0baaa" stroke-width="2">${bars}</g>`);
    s+=`<g stroke="${ink}" stroke-width="3">${line(start,190,end,190)}${line(start,179,start,201)}${line(end,179,end,201)}</g>${circle(x,190,7,`fill="${blue}"`)}`;
    s+=guides(`<g stroke="#718365" stroke-dasharray="5 4">${line(380,100,380,265)}</g>${label(380,90,'本当の中心')}${dimensionGuide(start,270,x-start,fmt(x-start))}${dimensionGuide(x,270,end-x,fmt(end-x))}`);
  }
  return `<svg viewBox="0 0 760 380" role="img" aria-label="${promptFor(q)} 比較する図形" xmlns="http://www.w3.org/2000/svg">${s}</svg>`;
}
function swatches(q) {
  const d=dimensions(q);
  const color = v => q.type==='color' ? `hsl(165, 28%, ${v}%)` : `rgb(${v}, ${v}, ${v})`;
  return {a:color(d.a),b:color(d.b)};
}
function evidence(q) {
  const d=dimensions(q), key=answerKey(q), same=key==='same';
  let title=same?'今回は、同じです。':'今回は、同じではありません！';
  let detail='',values=[];
  if(q.metric==='length'||q.metric==='size') {
    const noun=q.metric==='length'?'線の長さ':'円の直径';
    const multiplier=q.metric==='size'?2:1;
    detail=same?`2つの${noun}は、まったく同じです。`:`${q.larger.toUpperCase()}の${noun}は、${q.larger==='a'?'B':'A'}より${pct(q.ratio)}%${q.metric==='length'?'長く':'大きく'}設定されています。`;
    values=[`A：${fmt(d.a*multiplier)}`,`B：${fmt(d.b*multiplier)}`];
  } else if(q.metric==='parallel') {
    title=same?'2本の線は、平行です。':'今回は、平行ではありません！';
    detail=`上の線に対する下の線の傾きは${fmt(q.angle)}°です。`;
    values=[`上：0°`,`下：${fmt(q.angle)}°`];
  } else if(q.metric==='straight') {
    title=same?'どちらも、まっすぐな線です。':'今回は、線が曲がっています。';
    detail=`端点を結ぶ直線からの中央のずれは${fmt(q.bend)}です。`;
    values=[`中央のずれ：${fmt(q.bend)}`];
  } else if(q.metric==='center') {
    title=same?'青い点は、中心です。':`青い点は、中心より${q.offset>0?'右':'左'}です。`;
    detail=`線の全長の${pct(Math.abs(q.offset))}%（${fmt(q.base*Math.abs(q.offset))}）だけ、中心からずれています。`;
    values=[`左端から：${fmt(q.base*(.5+q.offset))}`,`右端から：${fmt(q.base*(.5-q.offset))}`];
  } else if(q.metric==='brightness') {
    detail=same?'中央の四角は、同じRGB値です。':`${q.larger.toUpperCase()}のRGB各成分は、もう一方より${pct(q.ratio)}%高い値です。これは知覚される明るさの比率ではありません。`;
    values=[`A：RGB(${fmt(d.a)}, ${fmt(d.a)}, ${fmt(d.a)})`,`B：RGB(${fmt(d.b)}, ${fmt(d.b)}, ${fmt(d.b)})`];
  } else {
    detail=same?'中央の四角は、同じHSL値です。':`${q.larger.toUpperCase()}のHSL明度は、もう一方より${pct(q.ratio)}%高い値です（${fmt(Math.abs(d.a-d.b))}ポイント差）。知覚される明るさの比率ではありません。`;
    values=[`A：HSL(165, 28%, ${fmt(d.a)}%)`,`B：HSL(165, 28%, ${fmt(d.b)}%)`];
  }
  return `<h2>${title}</h2><p>${detail}</p><div class="measurements">${values.map(v=>`<span class="measurement">${v}</span>`).join('')}</div>${['length','size','center','straight'].includes(q.metric)?'<p class="unit-note">数値は図形内の共通座標単位です。画面サイズに合わせて同じ倍率で表示しています。</p>':''}<p><b>${q.name}</b><br>${q.explanation}</p>`;
}
function renderQuestion(focus=false) {
  const q=QUESTIONS[index];
  phase='question';
  app.innerHTML=`<div class="intro"><div><p class="eyebrow">TRUST YOUR EYES. THEN TEST THEM.</p><h1 tabindex="-1" id="question-title">${promptFor(q)}</h1></div><p class="intro-note">まずは、見えたままに。<br>答えたら、自分の目で確かめよう。</p></div>
  <section class="experiment" aria-labelledby="question-title"><div class="experiment-top"><span class="question-count">QUESTION <strong>${String(index+1).padStart(2,'0')} <span class="total">/ ${QUESTIONS.length}</span></strong></span><span class="phase" id="phase-label">観察する</span></div>
  <div class="figure" id="figure">${drawing(q)}</div><div class="answer-area" id="answer-area"><p class="answer-hint">あなたには、どう見える？</p><div class="answers">${choices(q).map(([key,text])=>`<button class="answer" data-answer="${key}">${text.replace(/^([AB]（[^）]+）)(が.+)$/,'<span class="choice-subject">$1</span><span class="choice-predicate">$2</span>')}</button>`).join('')}</div></div><div id="verification" class="verification" hidden></div></section>
  <div class="journey" aria-label="全${QUESTIONS.length}問中${index+1}問目">${QUESTIONS.map((_,i)=>`<span class="step ${i<index?'done':i===index?'current':''}"></span>`).join('')}</div><div class="under-progress"><span>${index}問 完了</span><span>時間制限なし · 全15問</span></div>
  <div class="flow" aria-hidden="true"><span class="active">01 見る・答える</span><span class="separator">—</span><span>02 VERIFY</span><span class="separator">—</span><span>03 理由を知る</span></div>`;
  app.querySelectorAll('[data-answer]').forEach(button=>button.addEventListener('click',()=>answer(button.dataset.answer)));
  if(focus) document.getElementById('question-title').focus({preventScroll:true});
}
function answer(value) {
  if(phase!=='question')return;
  phase='answered';
  const q=QUESTIONS[index], correct=value===answerKey(q);
  responses.push({id:q.id,answer:value,correct});
  document.getElementById('phase-label').textContent='回答済み';
  document.getElementById('answer-area').innerHTML=`<div class="response"><p class="verdict" role="status">${correct?'正解':'不正解'}</p><button class="primary" id="verify"><span class="en">VERIFY</span><span class="jp">確かめる</span><span class="arrow" aria-hidden="true">↗</span></button></div>`;
  document.getElementById('verify').addEventListener('click',verify);
  document.getElementById('verify').focus({preventScroll:true});
}
function verify() {
  if(phase!=='answered')return;
  phase='verified';
  const q=QUESTIONS[index];
  document.getElementById('figure').classList.add('verified');
  document.getElementById('phase-label').textContent='検証する';
  const verification=document.getElementById('verification');
  verification.innerHTML=evidence(q)+`<div class="verify-actions"><button class="secondary" id="toggle-view" aria-pressed="false">元の図と見比べる</button><button class="primary" id="next">${index===QUESTIONS.length-1?'結果を見る':'NEXT　次の実験へ'}<span aria-hidden="true">→</span></button></div>`;
  verification.hidden=false;
  document.getElementById('answer-area').innerHTML=`<div class="response"><p class="verdict">${responses[index].correct?'正解':'不正解'}<small>あなたの回答：${choices(q).find(([key])=>key===responses[index].answer)[1]}</small></p><span class="eyebrow" style="margin:0">VERIFIED ✓</span></div>`;
  document.getElementById('toggle-view').addEventListener('click',toggleView);
  document.getElementById('next').addEventListener('click',next);
  document.getElementById('next').focus({preventScroll:true});
  const flow=app.querySelector('.flow');flow.innerHTML='<span>01 見る・答える</span><span class="separator">—</span><span>02 VERIFY</span><span class="separator">—</span><span class="active">03 理由を知る</span>';
}
function toggleView() {
  const figure=document.getElementById('figure');
  const verified=figure.classList.toggle('verified');
  document.getElementById('toggle-view').textContent=verified?'元の図と見比べる':'もう一度 VERIFY';
  document.getElementById('toggle-view').setAttribute('aria-pressed',String(!verified));
}
function next() {
  if(phase!=='verified')return;
  index++;
  if(index>=QUESTIONS.length) renderResults();else renderQuestion(true);
  window.scrollTo({top:0,behavior:'instant'});
}
function renderResults() {
  phase='results';
  const score=responses.filter(r=>r.correct).length;
  const mistaken=responses.filter((r,i)=>!r.correct && r.answer==='same' && answerKey(QUESTIONS[i])!=='same').length;
  app.innerHTML=`<section class="result-hero"><p class="eyebrow">EXPERIMENT COMPLETE</p><div class="score">${score}<span> / ${QUESTIONS.length}</span></div><h1 tabindex="-1" id="result-title">15問中${score}問を見抜きました。</h1><p>見え方と、実際のかたち。<br>その違いを確かめることが、この実験のゴールです。</p><button class="primary" id="restart">もう一度、実験する <span aria-hidden="true">↗</span></button></section>
  <h2 class="review-heading">あなたの実験ノート</h2><p class="muted">各問題を開いて、図形と答えを振り返れます。</p><div class="review-stats"><div class="review-stat"><strong>${15-score}<small> 問</small></strong>見え方と答えが一致しなかった問題</div><div class="review-stat"><strong>${mistaken}<small> 問</small></strong>実は違ったのに「同じ」を選んだ問題</div></div>
  <div class="review-list">${QUESTIONS.map((q,i)=>{const r=responses[i];return `<details><summary><span class="review-num">${String(i+1).padStart(2,'0')}</span><span>${q.name}</span><span class="review-status">${r.correct?'正解 ✓':'不正解'}</span></summary><div class="review-body"><p>あなたの回答：${choices(q).find(([key])=>key===r.answer)[1]}<br>正解：${choices(q).find(([key])=>key===answerKey(q))[1]}</p><div class="figure verified">${drawing(q)}</div><button class="secondary review-toggle" aria-pressed="false">元の図と見比べる</button><div class="verification" style="margin-top:16px">${evidence(q)}</div></div></details>`;}).join('')}</div><p class="muted" style="font-size:13px;line-height:1.8;margin-top:24px">これは視覚能力を評価するテストではありません。色や明るさの印象は、画面の設定や周囲の環境によっても変わります。</p>`;
  document.getElementById('restart').addEventListener('click',()=>{index=0;responses=[];renderQuestion(true);window.scrollTo({top:0,behavior:'instant'});});
  app.querySelectorAll('.review-toggle').forEach(button=>button.addEventListener('click',()=>{const verified=button.previousElementSibling.classList.toggle('verified');button.textContent=verified?'元の図と見比べる':'もう一度 VERIFY';button.setAttribute('aria-pressed',String(!verified));}));
  document.getElementById('result-title').focus({preventScroll:true});
}
document.getElementById('help').addEventListener('click',()=>document.getElementById('help-dialog').showModal());
document.getElementById('help-dialog').addEventListener('click',event=>{if(event.target===event.currentTarget){const rect=event.currentTarget.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)event.currentTarget.close();}});
renderQuestion();
