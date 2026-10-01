// Inline scripts run in <head> before first paint. This file must NOT be a client module:
// exports of "use client" files become client references on the server.

/** Inline script that applies the saved theme before first paint (no flash). */
export const themeInitScript = `(function(){try{var m=localStorage.getItem('theme');if(m==='dark')document.documentElement.classList.add('dark')}catch(e){}})();`;

/** Applies the saved language before first paint (direction + hides the page until translated). */
export const langInitScript = `(function(){try{var q=new URLSearchParams(location.search);var l=q.get('lang');if(l==='en'||l==='ar')localStorage.setItem('lang',l);var t=q.get('theme');if(t==='dark'||t==='light')localStorage.setItem('theme',t);document.documentElement.classList.add('reveal-active');setTimeout(function(){if(!document.documentElement.classList.contains('motion-on'))document.documentElement.classList.remove('reveal-active')},3000);if(localStorage.getItem('lang')==='en'){var h=document.documentElement;h.lang='en';h.dir='ltr';h.classList.add('i18n-pending');setTimeout(function(){h.classList.remove('i18n-pending')},1500)}}catch(e){}})();`;
