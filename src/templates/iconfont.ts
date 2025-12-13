const sanitizeKey = (value: string): string => value.replace(/[^a-zA-Z0-9_-]/g, "_");

export const buildIconfontJs = (sprite: string, fontName?: string): string => {
  const safeSprite = JSON.stringify(sprite);
  const injectKey = `__iconfont__svg__inject__${sanitizeKey(fontName || "iconfont")}`;

  return `!function(win,doc){var svgSprite=${safeSprite};var script=doc.currentScript||function(){var scripts=doc.getElementsByTagName("script");return scripts[scripts.length-1]}();var shouldInjectCss=script.getAttribute("data-injectcss");var disableInject=script.getAttribute("data-disable-injectsvg");var injectKey=${JSON.stringify(
    injectKey,
  )};if(shouldInjectCss&&!win.__iconfont__svg__cssinject__){win.__iconfont__svg__cssinject__=!0;try{doc.write('<style>.svgfont {display:inline-block;width:1em;height:1em;fill:currentColor;vertical-align:-0.1em;font-size:16px;}</style>')}catch(e){win.console&&win.console.warn(e)}}if(disableInject)return;if(win[injectKey])return;win[injectKey]=!0;function appendSvg(){var div=doc.createElement("div");div.innerHTML=svgSprite;svgSprite=null;var svg=div.getElementsByTagName("svg")[0];if(svg){svg.setAttribute("aria-hidden","true");svg.style.position="absolute";svg.style.width=0;svg.style.height=0;svg.style.overflow="hidden";var body=doc.body;body.firstChild?body.insertBefore(svg,body.firstChild):body.appendChild(svg)}}function ready(fn){if(doc.addEventListener){if(~["complete","loaded","interactive"].indexOf(doc.readyState))setTimeout(fn,0);else{var loadFn=function(){doc.removeEventListener("DOMContentLoaded",loadFn,!1);fn()};doc.addEventListener("DOMContentLoaded",loadFn,!1)}}else if(doc.attachEvent){var done=!1;var init=function(){if(!done){done=!0;fn()}};var polling=function(){try{doc.documentElement.doScroll("left")}catch(e){return setTimeout(polling,50)}init()};polling();doc.onreadystatechange=function(){if(doc.readyState=="complete"){doc.onreadystatechange=null;init()}}}}ready(appendSvg)}(window,document);`;
};
