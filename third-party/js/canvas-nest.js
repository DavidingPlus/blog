!function(){function n(n,e,t){return n.getAttribute(e)||t}function e(n){return document.getElementsByTagName(n)}function t(){i=u.width=window.innerWidth||document.documentElement.clientWidth||document.body.clientWidth,a=u.height=window.innerHeight||document.documentElement.clientHeight||document.body.clientHeight}function o(){var n,e,t,u,d,x;l.clearRect(0,0,i,a),y.forEach((function(o,r){for(o.x+=o.xa,o.y+=o.ya,o.xa*=o.x>i||o.x<0?-1:1,o.ya*=o.y>a||o.y<0?-1:1,l.fillRect(o.x-.5,o.y-.5,1,1),e=r+1;e<c.length;e++)null!==(n=c[e]).x&&null!==n.y&&(u=o.x-n.x,d=o.y-n.y,(x=u*u+d*d)<n.max&&(n===w&&x>=n.max/2&&(o.x-=.03*u,o.y-=.03*d),t=(n.max-x)/n.max,l.beginPath(),l.lineWidth=t/2,l.strokeStyle="rgba("+m.c+","+(t+.2)+")",l.moveTo(o.x,o.y),l.lineTo(n.x,n.y),l.stroke()))})),r(o)}var i,a,c,u=document.createElement("canvas"),m=function(){var t=e("script"),o=t.length,i=t[o-1];return{l:o,z:n(i,"zIndex",-1),o:n(i,"opacity",.5),c:n(i,"color","0,0,0"),n:n(i,"count",99)}}(),d="c_n"+m.l,l=u.getContext("2d"),r=window.requestAnimationFrame||window.webkitRequestAnimationFrame||window.mozRequestAnimationFrame||window.oRequestAnimationFrame||window.msRequestAnimationFrame||function(n){window.setTimeout(n,1e3/45)},x=Math.random,w={x:null,y:null,max:2e4};u.id=d,u.style.cssText="position:fixed;top:0;left:0;z-index:"+m.z+";opacity:"+m.o,e("body")[0].appendChild(u),t(),window.onresize=t,window.onmousemove=function(n){n=n||window.event,w.x=n.clientX,w.y=n.clientY},window.onmouseout=function(){w.x=null,w.y=null};for(var y=[],s=0;m.n>s;s++){var f=x()*i,h=x()*a,g=2*x()-1,v=2*x()-1;y.push({x:f,y:h,xa:g,ya:v,max:6e3})}c=y.concat([w]),setTimeout((function(){o()}),100)}();