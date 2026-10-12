export type Consent={external:boolean;updated:number};
export function readConsent():Consent|null{try{const c=JSON.parse(localStorage.getItem('bg-consent')||'null');return c&&typeof c.external==='boolean'&&Date.now()-c.updated<180*86400000?c:null;}catch{return null;}}
export function saveConsent(external:boolean){const c={external,updated:Date.now()};localStorage.setItem('bg-consent',JSON.stringify(c));window.dispatchEvent(new Event('bg-consent-changed'));return c;}
