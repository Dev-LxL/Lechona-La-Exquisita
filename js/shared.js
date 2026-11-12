'use strict';
// DEMO only — browser localStorage. No network or real payments.
const KEY='lxl-la-exquisita-demo-v3';
const defaults=[
{id:'p1',name:'Porción de lechona',description:'Presentación de referencia, sujeta a confirmación del negocio.',price:15000,image:'porcion.jpg',active:true},
{id:'p2',name:'Plato de lechona',description:'Fotografía real aportada. Tamaño, contenido y precio por confirmar.',price:22000,image:'combo.jpg',active:true},
{id:'p3',name:'Lechona para compartir',description:'Opción ilustrativa para reuniones. Disponibilidad por confirmar.',price:95000,image:'familiar.jpg',active:true}
];
let state;
try{const data=JSON.parse(localStorage.getItem(KEY));state=data&&Array.isArray(data.products)&&Array.isArray(data.orders)&&data.cart&&typeof data.cart==='object'?data:null;}catch{}
if(!state)state={products:structuredClone(defaults),cart:{},orders:[],sequence:0};
const CONFIG_DEFAULT={brand:'Lechona Tolimense La Exquisita',tagline:'Exquisita tradición',description:'Lechona tolimense para diferentes ocasiones.',address:'Cra. 44 #14-70, barrio La Selva, Santiago de Cali, Colombia',addressConfirmed:false,phone:'+57 316 536 2096',whatsapp:'573165362096',email:'sandra.deviaa@gmail.com',map:'https://www.bing.com/maps?cp=3.4128599365523~-76.52815246582',facebook:'https://www.facebook.com/lechonalaexquisiita',instagram:'',tiktok:'',logoData:'',hoursConfirmed:false,acceptOutsideHours:false,exceptions:'',hours:[{open:false,from:'09:00',to:'20:00'},{open:true,from:'09:00',to:'20:01'},{open:true,from:'09:00',to:'20:00'},{open:true,from:'09:00',to:'20:01'},{open:true,from:'09:00',to:'20:00'},{open:true,from:'09:00',to:'20:01'},{open:true,from:'09:00',to:'20:00'}],deliveryEnabled:true,pickupEnabled:true,minOrder:0,freeFrom:0,deliveryNotes:'Tarifas y cobertura de ejemplo; pendientes de confirmación.',zones:[]};
function normalizeState(){if(!state.config)state.config=structuredClone(CONFIG_DEFAULT);else state.config={...structuredClone(CONFIG_DEFAULT),...state.config};if(!Array.isArray(state.config.zones))state.config.zones=[];if(!Array.isArray(state.config.hours)||state.config.hours.length!==7)state.config.hours=structuredClone(CONFIG_DEFAULT.hours);if(!state.cart||typeof state.cart!=='object')state.cart={};state.products=state.products.map(p=>({...p,price:Number(p.price)||0}));syncGalleryPhotos();}
normalizeState();
function countCart(){return Object.values(state.cart).reduce((a,b)=>a+(Number(b)||0),0)}
function getCartSubtotal(){cartValid();return Object.entries(state.cart).reduce((sum,[id,qty])=>{const p=findProduct(id);return sum+(p?Math.max(0,Number(p.price)||0)*Math.max(0,Number(qty)||0):0);},0)}
function deliveryPrice(zone,subtotal){const c=state.config;if(!c.deliveryEnabled||!zone)return null;const z=c.zones.find(z=>z.active!==false&&z.name===zone);if(!z)return null;if(c.freeFrom>0&&subtotal>=Number(c.freeFrom))return 0;return Number(z.price)||0;}
function validHttpUrl(v){try{const u=new URL(v);return ['https:','http:'].includes(u.protocol)?u.href:'';}catch{return '';}}
// Bootstrap Icons 1.13.2, selección local oficial (MIT), sin fuentes ni CDN.
function uiIcon(name){
 const aliases={closed:'x-circle-fill',pin:'geo-alt',phone:'telephone',mail:'envelope',link:'link-45deg',left:'chevron-left',right:'chevron-right',up:'chevron-up',down:'chevron-down',close:'x-lg',success:'check-circle-fill',info:'info-circle-fill',warning:'exclamation-triangle-fill',error:'x-circle-fill',cart:'cart3'},icon=aliases[name]||name;
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
 for(const [k,v] of Object.entries({viewBox:'0 0 16 16',width:'20',height:'20',fill:'currentColor',class:'bi bi-'+icon,'aria-hidden':'true',focusable:'false'}))svg.setAttribute(k,v);
 svg.innerHTML=BOOTSTRAP_ICONS[icon]||BOOTSTRAP_ICONS['info-circle-fill'];return svg;
}
function syncGalleryPhotos(){
 if(!Array.isArray(state.gallery))state.gallery=[['galeria-1.jpg','Fotografía aportada de lechona'],['galeria-2.jpg','Fotografía aportada de presentación de lechona'],['galeria-3.jpg','Fotografía aportada de lechona tradicional'],['galeria-4.jpg','Fotografía aportada de preparación de lechona']].map(([image,alt],i)=>({id:'original-'+i,image,alt,active:true}));
 for(const p of state.products)if(p.imageData&&!state.gallery.some(g=>g.productId===p.id))state.gallery.push({id:'photo-'+p.id,productId:p.id,alt:'Fotografía de '+p.name,active:true});
}
function galleryImageUrl(g){const p=g.productId?state.products.find(p=>p.id===g.productId):g;return p&&(p.imageData||(!g.productId&&p.image))?productImageUrl(p):'';}
function galleryImages(activeOnly=true){syncGalleryPhotos();const seen=new Set();return state.gallery.filter(g=>{const src=galleryImageUrl(g);if(!src||(activeOnly&&(g.active===false||(g.productId&&!findProduct(g.productId)?.active)))||seen.has(src))return false;seen.add(src);return true;});}
function parseExceptions(text){
 const result=new Map();for(const line of String(text||'').split('\n').map(s=>s.trim()).filter(Boolean)){
  const m=/^(\d{4}-\d{2}-\d{2})\s*\|\s*(cerrado|\d{2}:\d{2}\s*[-–]\s*\d{2}:\d{2})$/i.exec(line);
  if(!m||!validDate(m[1])||result.has(m[1]))return null;
  if(m[2].toLowerCase()==='cerrado')result.set(m[1],{open:false});
  else{const [from,to]=m[2].split(/\s*[-–]\s*/);if(!validHours({from,to}))return null;result.set(m[1],{open:true,from,to});}
 }return result;
}
function validDate(value){const d=new Date(value+'T12:00:00Z');return /^\d{4}-\d{2}-\d{2}$/.test(value)&&!Number.isNaN(d.getTime())&&d.toISOString().slice(0,10)===value;}
function validHours(h){return h&&/^([01]\d|2[0-3]):[0-5]\d$/.test(h.from)&&/^([01]\d|2[0-3]):[0-5]\d$/.test(h.to)&&h.from<h.to;}
function openingStatus(now=new Date()){
 const c=state.config,exceptions=parseExceptions(c.exceptions),unknown={kind:'unknown',title:'Horario por confirmar',detail:'Consulta con el negocio antes de visitarnos.'};
 if(!c.hoursConfirmed||!exceptions||c.hours.some(h=>h.open&&!validHours(h)))return unknown;
 if((c.closedFrom||c.closedUntil)&&(!validDate(c.closedFrom||'')||!validDate(c.closedUntil||'')||c.closedFrom>c.closedUntil))return unknown;
 const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Bogota',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(now),get=t=>parts.find(p=>p.type===t).value;
 const date=get('year')+'-'+get('month')+'-'+get('day'),time=get('hour')+':'+get('minute');
 const hoursAt=d=>{if(c.closedFrom&&d>=c.closedFrom&&d<=c.closedUntil)return {open:false};return exceptions.get(d)||c.hours[(new Date(d+'T12:00:00Z').getUTCDay()+6)%7];};
 const today=hoursAt(date);if(today.open&&time>=today.from&&time<today.to)return {kind:'open',title:'Abierto ahora',detail:'¡Te esperamos!'};
 for(let i=0;i<=370;i++){const day=new Date(date+'T12:00:00Z');day.setUTCDate(day.getUTCDate()+i);const d=day.toISOString().slice(0,10),h=hoursAt(d);if(h.open&&(i>0||time<h.from)){const label=i===0?'hoy':new Intl.DateTimeFormat('es-CO',{timeZone:'UTC',weekday:'long',day:'numeric',month:'short'}).format(day);return {kind:'closed',title:'Cerrado ahora',detail:'Próxima apertura: '+label+', '+h.from+'.'};}}
 return {kind:'closed',title:'Cerrado ahora',detail:'Consulta el próximo horario con el negocio.'};
}
function renderOpeningStatus(){const s=openingStatus();document.querySelectorAll('[data-open-status]').forEach(node=>{if(node.textContent===s.title+s.detail)return;node.className='opening-status is-'+s.kind;const text=el('div');text.append(el('strong','',s.title),el('span','',s.detail));node.replaceChildren(uiIcon(s.kind==='closed'?'closed':'clock'),text);});}
function renderBusinessConfig(){
 const c=state.config;
 document.querySelectorAll('[data-business]').forEach(node=>{const key=node.dataset.business;node.textContent=key==='addressBrief'?String(c.address||'').split(',').slice(0,2).join(','):key==='whatsapp'&&c.whatsapp?'+'+String(c.whatsapp).replace(/\D/g,''):c[key]||'';if(['address','addressBrief'].includes(key)&&c.address&&!c.addressConfirmed)node.textContent+=' (por confirmar)';});
 document.querySelectorAll('[data-logo]').forEach(img=>{img.src=c.logoData||'assets/images/logo-la-exquisita-oficial-sello.png';});
 document.querySelectorAll('[data-social]').forEach(a=>{const key=a.dataset.social,digits=String(c.whatsapp||'').replace(/\D/g,''),raw=key==='whatsapp'?(/^\d{10,15}$/.test(digits)?'https://wa.me/'+digits:''):c[key],url=validHttpUrl(raw),enabled=c.socialEnabled?.[key]!==false;a.hidden=!url||!enabled;if(url&&enabled)a.href=url;else a.removeAttribute('href');});
 document.querySelectorAll('[data-contact]').forEach(a=>{const kind=a.dataset.contact,v=String(c[kind]||''),url=kind==='email'?(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)?'mailto:'+v:''):kind==='phone'?(/\d{7}/.test(v.replace(/\D/g,''))?'tel:'+v.replace(/[^\d+]/g,''):''):validHttpUrl(c.map);a.hidden=!url;if(url)a.href=url;else a.removeAttribute('href');});
 const schedule=$('#business-hours');if(schedule){schedule.replaceChildren();['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'].forEach((d,i)=>{const h=c.hours[i],line=el('div','hours-row');line.append(el('b','',d),el('span','',h.open?`${h.from} – ${h.to}`:'Cerrado'));schedule.append(line);});}
 document.querySelectorAll('[data-hours-note]').forEach(n=>{n.textContent=c.hoursConfirmed?'Horarios confirmados · hora de Colombia':'Horarios iniciales por confirmar · hora de Colombia';});
 document.querySelectorAll('[data-hours-exceptions]').forEach(n=>{n.textContent=[c.exceptions,c.closedFrom&&c.closedUntil?'Cierre temporal: '+c.closedFrom+' al '+c.closedUntil:''].filter(Boolean).join(' · ');n.hidden=!n.textContent;});
 document.querySelectorAll('[data-icon]').forEach(n=>n.replaceChildren(uiIcon(n.dataset.icon)));
 document.querySelectorAll('[data-social] [data-icon]').forEach(n=>{n.dataset.icon=n.closest('[data-social]').dataset.social;n.replaceChildren(uiIcon(n.dataset.icon));});
 renderOpeningStatus();document.querySelectorAll('link[rel=icon]').forEach(link=>{link.href=c.logoData||'assets/images/favicon-la-exquisita.png';});
}
function imageFileToData(file,maxPx=700){return new Promise((resolve,reject)=>{if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>5*1024*1024)return reject(new Error('Usa JPG, PNG o WebP de hasta 5 MB.'));const url=URL.createObjectURL(file),img=new Image;img.onload=()=>{URL.revokeObjectURL(url);try{if(!img.width||!img.height)throw new Error('Imagen no válida.');const ratio=Math.min(1,maxPx/Math.max(img.width,img.height)),canvas=document.createElement('canvas');canvas.width=Math.round(img.width*ratio);canvas.height=Math.round(img.height*ratio);const ctx=canvas.getContext('2d');if(!ctx)throw new Error('No fue posible preparar la imagen en este navegador.');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);resolve(canvas.toDataURL('image/jpeg',.73));}catch(error){reject(error);}};img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('Imagen no válida.'));};img.src=url;});}

const $=s=>document.querySelector(s);
const money=n=>new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(n);
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));dismissNotification('storage');return true;}catch{notify('No se pudieron guardar los cambios en este navegador. Revisa el espacio y los permisos; tus datos escritos se conservan.','error',{key:'storage'});return false;}}
function reloadDemo(){try{const fresh=JSON.parse(localStorage.getItem(KEY));if(fresh&&Array.isArray(fresh.products)&&Array.isArray(fresh.orders)&&fresh.cart&&typeof fresh.cart==='object')state=fresh;normalizeState();}catch{}}
let noticeTimer=null,activeNotice=null,noticeQueue=[],confirmationPending=false,fieldErrorSequence=0;
function syncNotificationHost(){
 const host=$('#toast');if(!host)return;
 const modal=[...document.querySelectorAll('dialog[open]')].at(-1),drawer=document.querySelector('.cart-drawer.is-open');
 const parent=modal||drawer||document.body;host.hidden=!activeNotice||modal?.id==='action-confirm';
 if(host.parentNode!==parent){if(drawer&&!modal)drawer.querySelector('.drawer-head').after(host);else if(modal)parent.prepend(host);else parent.append(host);}
}
function notificationPosition(){const header=document.querySelector('header'),bottom=header?.getBoundingClientRect().bottom||0;document.documentElement.style.setProperty('--notice-top',Math.min(innerHeight/3,Math.max(12,bottom+12))+'px');}
function dismissNotification(key){
 if(key)noticeQueue=noticeQueue.filter(n=>n.key!==key);
 if(!activeNotice||(key&&activeNotice.key!==key))return;
 const host=$('#toast'),restore=host?.contains(document.activeElement),focus=activeNotice.focus;
 clearTimeout(noticeTimer);activeNotice=null;if(host){host.hidden=true;host.replaceChildren();host.classList.remove('show');}
 if(restore&&focus?.isConnected)focus.focus({preventScroll:true});
 const next=noticeQueue.shift();if(next)showNotification(next);
}
function showNotification(notice){
 const host=$('#toast');if(!host)return;
 clearTimeout(noticeTimer);activeNotice=notice;syncNotificationHost();notificationPosition();
 host.removeAttribute('role');host.removeAttribute('aria-live');host.hidden=false;host.classList.add('show');
 const card=el('div','toast-card toast-'+notice.type),message=el('p','toast-message',notice.message),close=button('','toast-close',()=>dismissNotification());
 card.dataset.type=notice.type;message.setAttribute('role',notice.type==='error'?'alert':'status');message.setAttribute('aria-live',notice.type==='error'?'assertive':'polite');message.setAttribute('aria-atomic','true');
 close.setAttribute('aria-label','Cerrar notificación');close.append(uiIcon('close'));card.append(uiIcon(notice.type),message,close);host.replaceChildren(card);
 if(!notice.persistent)noticeTimer=setTimeout(()=>dismissNotification(),notice.duration);
}
function notify(message,type='info',options={}){
 if(!['success','info','warning','error'].includes(type))type='info';
 const notice={message:String(message),type,key:options.key||type+':'+message,persistent:options.persistent??type==='error',duration:options.duration||4000,focus:document.activeElement};
 if(activeNotice?.key===notice.key&&activeNotice.message===notice.message&&activeNotice.type===notice.type){if(!activeNotice.persistent){clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>dismissNotification(),notice.duration);}return;}
 if(noticeQueue.some(n=>n.key===notice.key&&n.message===notice.message))return;
 noticeQueue=noticeQueue.filter(n=>n.key!==notice.key);
 if(activeNotice?.persistent){noticeQueue=noticeQueue.slice(-2);noticeQueue.push(notice);return;}
 showNotification(notice);
}
function confirmAction({title='Confirmar acción',message,accept='Confirmar',trigger=document.activeElement}={}){
 if(confirmationPending)return Promise.resolve(false);confirmationPending=true;
 let dialog=$('#action-confirm');if(!dialog){dialog=el('dialog','action-dialog');dialog.id='action-confirm';dialog.setAttribute('role','alertdialog');dialog.setAttribute('aria-modal','true');dialog.setAttribute('aria-labelledby','action-confirm-title');dialog.setAttribute('aria-describedby','action-confirm-description');dialog.addEventListener('keydown',event=>{if(event.key!=='Tab')return;const items=[...dialog.querySelectorAll('button:not([disabled])')].filter(b=>b.getClientRects().length),first=items[0],last=items.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}});document.body.append(dialog);}
 const heading=el('h3','',title);heading.id='action-confirm-title';const description=el('p','',message);description.id='action-confirm-description';
 const cancel=button('Cancelar','admin-secondary',()=>dialog.close('cancel')),confirm=button(accept,'admin-primary',()=>dialog.close('confirm')),actions=el('div','dialog-actions');actions.append(cancel,confirm);dialog.replaceChildren(uiIcon('warning'),heading,description,actions);dialog.returnValue='cancel';dialog.showModal();syncNotificationHost();cancel.focus();
 return new Promise(resolve=>{dialog.addEventListener('close',()=>{confirmationPending=false;syncNotificationHost();if(trigger?.isConnected)trigger.focus({preventScroll:true});resolve(dialog.returnValue==='confirm');},{once:true});});
}
function commitChange(change,message,type='success',options={}){
 const previous=structuredClone(state);
 try{change();if(!save()){state=previous;return false;}}
 catch{state=previous;notify('No fue posible completar la operación. Inténtalo de nuevo.','error');return false;}
 if(message)notify(message,type,options);return true;
}
function iconButton(icon,label,handler,cls=''){const control=button('',cls,handler);control.setAttribute('aria-label',label);control.append(uiIcon(icon));return control;}
function quantityControls(id,qty,onChange,onRemove){const controls=el('div','quantity');controls.dataset.productId=id;controls.setAttribute('role','group');controls.setAttribute('aria-label','Controles de '+(findProduct(id)?.name||'producto'));controls.append(iconButton('dash','Disminuir cantidad',()=>onChange(id,-1)),el('span','',String(qty)),iconButton('plus','Aumentar cantidad',()=>onChange(id,1)));if(onRemove)controls.append(iconButton('trash','Quitar producto',()=>onRemove(id),'remove-item'));return controls;}
function refreshCart(render){const focus=document.activeElement,group=focus?.closest('.quantity'),id=group?.dataset.productId,label=focus?.getAttribute('aria-label');render();if(group&&!focus.isConnected){const groups=[...document.querySelectorAll('.quantity')],same=groups.find(g=>g.dataset.productId===id);const target=(same&&[...same.querySelectorAll('button')].find(b=>b.getAttribute('aria-label')===label))||groups[0]?.querySelector('button')||$('#clear-cart');target?.focus({preventScroll:true});}}
function adjustCart(id,delta,adding=false){
 reloadDemo();const p=findProduct(id);if(!p?.active){notify('Este producto no está disponible.','warning');return false;}
 const old=Number(state.cart[id])||0,q=Math.max(0,Math.min(99,old+delta));if(delta<0&&!old){notify('Este producto ya no está en el carrito.','info');return false;}if(q===old){notify('El límite es de 99 unidades por producto.','warning');return false;}
 return commitChange(()=>{if(q)state.cart[id]=q;else delete state.cart[id];},adding?'Producto agregado al carrito · demo':q?'Cantidad actualizada':'Producto quitado del carrito',adding?'success':'info',{key:'cart-quantity'});
}
function removeCartProduct(id){reloadDemo();if(!Object.hasOwn(state.cart,id)){notify('Este producto ya no está en el carrito.','info');return false;}return commitChange(()=>{delete state.cart[id];},'Producto quitado del carrito','info',{key:'cart-quantity'});}
async function clearCart(){
 if(!countCart()){notify('Tu carrito está vacío.','info');return false;}
 if(!await confirmAction({title:'¿Vaciar el carrito?',message:'Se quitarán todos los productos de este carrito de demostración.',accept:'Vaciar carrito'}))return false;
 reloadDemo();return commitChange(()=>{state.cart={};},'Carrito de demostración vaciado','info');
}
function markFormSaved(form){if(form)delete form.dataset.dirty;}
function clearFieldError(control){
 const id=control.dataset.errorId;if(id){document.getElementById(id)?.remove();const ids=(control.getAttribute('aria-describedby')||'').split(/\s+/).filter(v=>v&&v!==id);if(ids.length)control.setAttribute('aria-describedby',ids.join(' '));else control.removeAttribute('aria-describedby');delete control.dataset.errorId;}
 control.removeAttribute('aria-invalid');
}
function clearFormErrors(form){[...form.elements].forEach(clearFieldError);}
function fieldError(control,message,focus=true){
 if(!control)return false;clearFieldError(control);const error=el('small','field-error',message),id='field-error-'+(++fieldErrorSequence);error.id=id;control.dataset.errorId=id;control.setAttribute('aria-invalid','true');control.setAttribute('aria-describedby',((control.getAttribute('aria-describedby')||'')+' '+id).trim());
 if(['checkbox','radio'].includes(control.type)){(control.closest('label')||control).after(error);}
 else{let wrapper=control.parentElement;if(!wrapper.classList.contains('field-control')){wrapper=el('span','field-control');control.before(wrapper);wrapper.append(control);}wrapper.append(error);}
 if(focus)control.focus();return false;
}
function validateForm(form){
 let first=null;for(const control of [...form.elements]){if(!control.willValidate||!control.getClientRects().length)continue;clearFieldError(control);const v=control.validity,empty=control.required&&typeof control.value==='string'&&!control.value.trim();if(v.valid&&!empty)continue;
  const message=v.valueMissing||empty?'Completa este campo.':v.typeMismatch?(control.type==='email'?'Escribe un correo válido.':'Escribe una URL válida.') :v.rangeUnderflow?'El valor mínimo es '+control.min+'.':v.rangeOverflow?'El valor máximo es '+control.max+'.':v.stepMismatch?'Usa incrementos de '+(control.step||'1')+'.':v.badInput?'Escribe un número válido.':'Revisa el valor de este campo.';
  fieldError(control,message,false);first ||= control;
 }if(first)first.focus();return !first;
}
function initFeedback(){
 const host=$('#toast');if(host){host.hidden=true;host.removeAttribute('role');host.removeAttribute('aria-live');}
 document.querySelectorAll('form').forEach(form=>{form.noValidate=true;});
 document.addEventListener('submit',event=>{const form=event.target;if(form instanceof HTMLFormElement&&!validateForm(form)){event.preventDefault();event.stopImmediatePropagation();}},{capture:true});
 for(const kind of ['input','change'])document.addEventListener(kind,event=>{const control=event.target;if(control.form){control.form.dataset.dirty='true';clearFieldError(control);}});
 document.addEventListener('reset',event=>{if(event.target instanceof HTMLFormElement){clearFormErrors(event.target);markFormSaved(event.target);}});
 document.addEventListener('click',async event=>{const link=event.target.closest?.('a[href]');if(!link||event.defaultPrevented||event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey||link.target==='_blank'||link.hasAttribute('download'))return;const url=new URL(link.href);if(!['http:','https:','file:'].includes(url.protocol)||(url.origin===location.origin&&url.pathname===location.pathname&&url.search===location.search))return;if(!document.querySelector('form[data-dirty=true], [data-pending-edit=true]'))return;event.preventDefault();if(await confirmAction({title:'¿Salir sin guardar?',message:'Hay campos con cambios sin guardar. Si sales, esos cambios no se conservarán.',accept:'Salir sin guardar',trigger:link}))location.assign(link.href);});
 document.addEventListener('close',syncNotificationHost,true);new MutationObserver(syncNotificationHost).observe(document.body,{subtree:true,attributes:true,attributeFilter:['open','class']});
 window.addEventListener('scroll',notificationPosition,{passive:true});window.addEventListener('resize',notificationPosition);const header=document.querySelector('header');if(header)new ResizeObserver(notificationPosition).observe(header);
 document.querySelectorAll('#close-cart,#close-product').forEach(b=>b.replaceChildren(uiIcon('close')));document.querySelector('.menu-toggle')?.replaceChildren(uiIcon('list'));
 const add=$('#new-product');if(add){add.textContent='Agregar producto';add.prepend(uiIcon('plus'));}
}
const findProduct=id=>state.products.find(p=>p.id===id);
function el(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;}
function button(label,cls,handler){const b=el('button',cls,label);b.type='button';b.addEventListener('click',handler);return b;}
function cartValid(){for(const id of Object.keys(state.cart)){const p=findProduct(id);if(!p||!p.active||!Number.isInteger(Number(state.cart[id]))||Number(state.cart[id])<=0)delete state.cart[id];}}

// Solo imágenes locales verificadas o recursos estáticos incluidos en esta demo.
function productImageUrl(p){return typeof p.imageData==='string'&&/^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(p.imageData)?p.imageData:'assets/images/'+(p.image||'porcion.jpg');}

window.addEventListener("storage",e=>{if(e.key===KEY){reloadDemo();renderBusinessConfig();}});document.addEventListener("DOMContentLoaded",renderBusinessConfig);
document.addEventListener('DOMContentLoaded',initFeedback);
