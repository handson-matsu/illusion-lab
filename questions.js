/* 図形・正解・検証表示はすべて同じ数値から生成する。
   ratio は基準となる小さい側に対する差。0.08 = 8%。 */
'use strict';
const TUNING = Object.freeze({ ponzo: 0.08, muller: 0.07, circles: 0.10,
  vertical: 0.08, brightness: 0.08, color: 0.08, center: 0.08, angle: 3 });
const QUESTIONS = [
  {id:'ml-equal',type:'muller',name:'ミュラー・リヤー錯視',metric:'length',base:180,larger:'same',ratio:0,
    explanation:'端についた矢羽根の向きが、線の長さの判断に影響します。端点だけを揃えると、矢羽根を含まない線そのものの長さが見えてきます。'},
  {id:'eb-equal',type:'ebbinghaus',name:'エビングハウス錯視',metric:'size',base:34,larger:'same',ratio:0,
    explanation:'同じ円でも、大きな円に囲まれると小さく、小さな円に囲まれると大きく感じられます。周囲を消して中央の円だけを重ねると、輪郭が一致します。'},
  {id:'pz-diff',type:'ponzo',name:'ポンゾ錯視',metric:'length',base:168,larger:'a',ratio:TUNING.ponzo,
    explanation:'奥へ収束する線が遠近感の手がかりになります。上の線は遠くにあるように見え、大きく感じられることがあります。今回はその印象と競うように、下の線を実際に長くしました。'},
  {id:'light-diff',type:'brightness',name:'明るさの対比',metric:'brightness',base:125,larger:'b',ratio:TUNING.brightness,
    explanation:'暗い背景にある灰色は明るく、明るい背景にある灰色は暗く感じられます。今回は明るい背景側の灰色を実際に明るく設定しています。共通の背景で見比べてみてください。'},
  {id:'zo-equal',type:'zollner',name:'ツェルナー錯視',metric:'parallel',angle:0,
    explanation:'長い線を横切る短い斜線が、線全体の傾きの印象に影響します。斜線を消すと、2本の線は方眼の同じ方向に沿っていることが分かります。'},
  {id:'ml-diff',type:'muller',name:'ミュラー・リヤー錯視',metric:'length',base:180,larger:'b',ratio:TUNING.muller,
    explanation:'矢羽根の向きだけでは、実際の長さを判断できません。今回は長く見えやすい左側ではなく、右側の線そのものを少し長くしています。'},
  {id:'center-diff',type:'center',name:'位置と周囲の文脈',metric:'center',base:360,offset:TUNING.center,
    explanation:'片側に集まった線が、図形の重心や中心の印象を変えることがあります。背景を取り除き、両端から等距離の位置を引くと、本当の中心を確認できます。'},
  {id:'he-equal',type:'hering',name:'ヘリング錯視',metric:'straight',bend:0,
    explanation:'放射状の線の上では、まっすぐな2本の線が外側に湾曲して見えることがあります。背景を消し、直線のガイドを重ねると、どちらもまっすぐだと確認できます。'},
  {id:'eb-diff',type:'ebbinghaus',name:'エビングハウス錯視',metric:'size',base:34,larger:'a',ratio:TUNING.circles,
    explanation:'大きな周囲の円に囲まれた左の円を、今回は実際に大きくしました。錯視の印象と寸法の差が競合します。重ねたときに残る外側の輪郭が、その差です。'},
  {id:'color-equal',type:'color',name:'色の対比',metric:'color',base:50,larger:'same',ratio:0,
    explanation:'周囲の色が変わると、中央の色も違って感じられることがあります。中央の2色は同じ指定値です。同じ背景の上で隣り合わせると、境界が消えます。'},
  {id:'pz-equal',type:'ponzo',name:'ポンゾ錯視',metric:'length',base:168,larger:'same',ratio:0,
    explanation:'収束する背景線によって、上の線が遠くにあるように感じられます。背景のない場所へ平行移動し、左端を揃えると、2本は同じ長さです。'},
  {id:'zo-diff',type:'zollner',name:'ツェルナー錯視',metric:'parallel',angle:TUNING.angle,
    explanation:'「斜線のせいで傾いて見えるだけ」と考えても、今回は平行ではありません。片方に実際の傾きを加えています。水平ガイドから離れる距離に注目してください。'},
  {id:'hv-diff',type:'vertical',name:'垂直・水平錯視',metric:'length',base:170,larger:'a',ratio:TUNING.vertical,
    explanation:'垂直の線と水平の線では、長さの感じ方が異なることがあります。今回は水平なAの方を長くしています。Bを回転し、同じ向きに揃えて比べてください。'},
  {id:'light-equal',type:'brightness',name:'明るさの対比',metric:'brightness',base:125,larger:'same',ratio:0,
    explanation:'背景との明るさの差が、中央の灰色の見え方に影響します。背景を共通にすると2つの灰色の境界が消えます。今回は同じRGB値です。'},
  {id:'color-diff',type:'color',name:'色の対比',metric:'color',base:50,larger:'b',ratio:TUNING.color,
    explanation:'同じ色に見えても、指定値まで同じとは限りません。今回はBのHSL明度を高くしています。背景を取り除いても残る色の境界を確かめてください。'}
];
function dimensions(q) {
  return {a:q.base * (q.larger === 'a' ? 1+q.ratio : 1), b:q.base * (q.larger === 'b' ? 1+q.ratio : 1)};
}
function correctAnswer(q) {
  if(q.metric === 'parallel') return q.angle === 0 ? 'same' : 'different';
  if(q.metric === 'straight') return q.bend === 0 ? 'same' : 'different';
  if(q.metric === 'center') return q.offset === 0 ? 'same' : q.offset > 0 ? 'b' : 'a';
  return q.larger;
}
function choices(q) {
  if(q.metric === 'parallel') return [['same','平行'],['different','平行ではない']];
  if(q.metric === 'straight') return [['same','どちらも直線'],['different','曲がっている線がある']];
  if(q.metric === 'center') return [['a','中心より左'],['same','ちょうど中心'],['b','中心より右']];
  if(q.metric === 'color') return [['same','同じ色'],['different','違う色']];
  const word = {length:'長い',size:'大きい',brightness:'明るい'}[q.metric];
  const a = q.type === 'ponzo' ? 'A（下）' : q.type === 'vertical' ? 'A（横）' : 'A（左）';
  const b = q.type === 'ponzo' ? 'B（上）' : q.type === 'vertical' ? 'B（縦）' : 'B（右）';
  return [['a',`${a}が${word}`],['same','同じ'],['b',`${b}が${word}`]];
}
function answerKey(q) { return q.metric === 'color' && q.larger !== 'same' ? 'different' : correctAnswer(q); }
function promptFor(q) {
  return {length:'どちらの線が長い？',size:'どちらの中央の円が大きい？',parallel:'2本の長い線は平行？',straight:'2本の青い線はまっすぐ？',center:'青い点は、横線の中心にある？',brightness:'どちらの中央の四角が明るい？',color:'中央の2つの四角は同じ色？'}[q.metric];
}
