'use strict';
const galleryAltDrafts=new Map(),driverDrafts=new Map();
function renderAdminProducts(){const root=$('#admin-products');root.replaceChildren();state.products.forEach(p=>{const item=el('div','admin-product-row');const image=el('img');image.src=productImageUrl(p);image.alt='';const desc=el('div','admin-prod-desc');desc.append(el('strong','',p.name),el('small','',money(p.price)+' · DEMO'),el('span',p.active?'tag-enabled':'tag-disabled',p.active?'Habilitado':'Deshabilitado'));const actions=el('div','admin-row-actions');actions.append(button('Editar','admin-secondary',()=>openProduct(p.id)),button(p.active?'Deshabilitar':'Habilitar',p.active?'admin-danger':'admin-primary',()=>{const active=!findProduct(p.id).active;commitChange(()=>{findProduct(p.id).active=active;},active?'Producto habilitado':'Producto deshabilitado');renderAll();}));item.append(image,desc,actions);root.append(item);});}
const statuses=['Recibido','Confirmado','En preparación','Listo para entrega','Asignado a repartidor','En camino','Entregado','Cancelado'];
function dropdown(options,current,change,label){const select=el('select');select.setAttribute('aria-label',label);options.forEach(v=>{const opt=el('option','',v);opt.value=v;select.append(opt);});select.value=current;select.addEventListener('change',e=>change(e.target.value));return select;}
function renderOrders(){const root=$('#admin-orders');root.replaceChildren();root.dataset.pendingEdit=String(driverDrafts.size>0);if(!state.orders.length){root.append(el('p','empty-state','Todavía no existen pedidos de prueba. Crea uno desde «Mi pedido» o carga ejemplos ficticios.'));}state.orders.forEach(o=>{const card=el('article','order-record'),title=el('div','record-title');title.append(el('strong','',o.id+' · '+o.customer),el('span','status-pill',o.status));card.append(title,el('p','',o.items.map(i=>`${i.quantity} × ${i.name}`).join(' · ')),el('p','',`Subtotal de ejemplo: ${money(o.subtotal)} · ${o.delivery==='delivery'?'Domicilio: '+(o.shipping===null?'por confirmar':money(o.shipping)):'Recogida'} · ${o.payment==='wompi'?'Wompi simulado':'Efectivo'}`),el('p','',`Estado del pago: ${o.paymentStatus}`));const controls=el('div','order-controls'),statusBox=el('label','', 'Estado del pedido');statusBox.append(dropdown(statuses,o.status,v=>{commitChange(()=>{const current=state.orders.find(item=>item.id===o.id);current.status=v;current.history.push({status:v,at:new Date().toISOString()});},'Estado de pedido demo actualizado');renderOrders();renderStats();},'Estado de '+o.id));const driverBox=el('label','', 'Repartidor ficticio'),driver=el('input');driver.maxLength=50;driver.placeholder='Ej. Repartidor Demo';driver.value=driverDrafts.get(o.id)??o.driver??'';driver.title='Se guarda al salir del campo. Pulsa Enter para reintentar.';driver.addEventListener('input',()=>{driverDrafts.set(o.id,driver.value);root.dataset.pendingEdit='true';});const saveDriver=()=>{driverDrafts.set(o.id,driver.value);if(commitChange(()=>{state.orders.find(item=>item.id===o.id).driver=driver.value.trim();},'Repartidor de demostración asignado')){driverDrafts.delete(o.id);driver.value=state.orders.find(item=>item.id===o.id).driver;}root.dataset.pendingEdit=String(driverDrafts.size>0);};driver.addEventListener('change',saveDriver);driver.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();saveDriver();}});driverBox.append(driver);controls.append(statusBox,driverBox);if(o.payment==='cash'){const payBox=el('label','', 'Cobro efectivo');payBox.append(dropdown(['Pendiente de recaudo','Cobro registrado (demo)'],o.paymentStatus,v=>{commitChange(()=>{state.orders.find(item=>item.id===o.id).paymentStatus=v;},'Estado del cobro actualizado solo en demo');renderOrders();},'Estado del cobro '+o.id));controls.append(payBox);}card.append(controls,el('small','',`Registro local · ${new Date(o.createdAt).toLocaleString('es-CO')}`));root.append(card);});}
function renderStats(){const orders=state.orders;$('#stat-total').textContent=orders.length;$('#stat-pending').textContent=orders.filter(o=>['Recibido','Confirmado','En preparación','Listo para entrega'].includes(o.status)).length;$('#stat-route').textContent=orders.filter(o=>['Asignado a repartidor','En camino'].includes(o.status)).length;$('#stat-delivered').textContent=orders.filter(o=>o.status==='Entregado').length;$('#orders-tab-count').textContent=orders.length;}
function renderAll(){syncGalleryPhotos();renderAdminProducts();renderOrders();renderStats();renderGalleryAdmin();}
const dialog=$('#product-dialog'),form=$('#product-form');
const upload=$('#product-upload'),photoPreview=$('#product-photo-preview'),photoStatus=$('#photo-status'),photoSource=$('#photo-source');
let pendingPhoto=null,editingOriginalPhoto=null,uploadBusy=false;
function previewProductImage(){
 const p=findProduct(form.elements.id.value),base={image:form.elements.image.value||'porcion.jpg'};
 const imageData=pendingPhoto||editingOriginalPhoto;
 photoPreview.src=productImageUrl({...base,imageData});
 photoSource.textContent=pendingPhoto?'Nueva fotografía seleccionada':editingOriginalPhoto?'Fotografía personalizada guardada':'Imagen de referencia';
 $('#discard-upload').hidden=!pendingPhoto;
 $('#remove-uploaded-photo').hidden=!editingOriginalPhoto&&!pendingPhoto;
}
async function closeProduct(){
 if(uploadBusy){notify('La fotografía todavía se está preparando.','info');return;}
 if(form.dataset.dirty==='true'&&!await confirmAction({title:'¿Descartar cambios sin guardar?',message:'Los cambios escritos y la fotografía nueva no se guardarán.',accept:'Descartar cambios'}))return;
 markFormSaved(form);dialog.close();
}
dialog.addEventListener('cancel',event=>{event.preventDefault();closeProduct();});
function openProduct(id){
 if(uploadBusy)return;
 form.reset();pendingPhoto=null;
 const p=findProduct(id);
 editingOriginalPhoto=p?.imageData||null;
 $('#dialog-title').textContent=p?'Editar producto':'Agregar producto';
 form.elements.id.value=p?p.id:'';
 if(p){form.elements.name.value=p.name;form.elements.description.value=p.description;form.elements.price.value=p.price;form.elements.image.value=p.image;form.elements.active.checked=p.active;}
 else{form.elements.price.value=0;form.elements.active.checked=true;}
 photoStatus.textContent='Puedes conservar la foto o seleccionar una nueva desde tu equipo.';
 const scrollTop=window.scrollY;
 previewProductImage();dialog.style.top=`${scrollTop+24}px`;dialog.showModal();
 window.scrollTo({top:scrollTop,behavior:'instant'});
}
function compressUpload(file){
 return new Promise((resolve,reject)=>{
  if(!['image/jpeg','image/png','image/webp'].includes(file.type))return reject(new Error('Formato no admitido. Usa JPG, PNG o WebP.'));
  if(file.size>5*1024*1024)return reject(new Error('La fotografía supera el máximo de 5 MB.'));
  const url=URL.createObjectURL(file),image=new Image();
  image.onload=()=>{
   URL.revokeObjectURL(url);
   if(image.width<1||image.height<1)return reject(new Error('La imagen no es válida.'));
   try{
    const max=1000,ratio=Math.min(1,max/Math.max(image.width,image.height));
    const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(image.width*ratio));canvas.height=Math.max(1,Math.round(image.height*ratio));
    const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Tu navegador no puede procesar esta imagen.');
    ctx.fillStyle='#ffffff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(image,0,0,canvas.width,canvas.height);
    let data=canvas.toDataURL('image/jpeg',0.76);
    if(data.length>420000){const side=720/Math.max(canvas.width,canvas.height);canvas.width=Math.max(1,Math.round(canvas.width*side));canvas.height=Math.max(1,Math.round(canvas.height*side));ctx.fillStyle='#ffffff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(image,0,0,canvas.width,canvas.height);data=canvas.toDataURL('image/jpeg',0.65);}
    if(data.length>650000)throw new Error('La imagen ocupa demasiado espacio para esta demostración.');
    resolve(data);
   }catch(e){reject(e);}
  };
  image.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('No se pudo abrir la imagen.'));};
  image.src=url;
 });
}
upload.addEventListener('change',async()=>{
 const file=upload.files[0];if(!file)return;
 uploadBusy=true;upload.disabled=true;clearFieldError(upload);photoStatus.textContent='Preparando vista previa...';
 try{pendingPhoto=await compressUpload(file);photoStatus.textContent='Fotografía lista para guardar en este navegador.';previewProductImage();notify('Fotografía preparada. Guarda el producto para aplicarla.','info');}
 catch(error){upload.value='';photoStatus.textContent='Se conserva la imagen anterior.';fieldError(upload,error.message,false);previewProductImage();}
 finally{uploadBusy=false;upload.disabled=false;}
});
form.elements.image.addEventListener('change',()=>{pendingPhoto=null;editingOriginalPhoto=null;upload.value='';previewProductImage();photoStatus.textContent='Se utilizará la imagen de referencia seleccionada.';notify('Imagen de referencia preparada. Guarda el producto para aplicarla.','info');});
$('#discard-upload').addEventListener('click',async()=>{if(!await confirmAction({title:'¿Descartar la fotografía nueva?',message:'La foto nueva pendiente se quitará. Se conservará la fotografía anterior.',accept:'Descartar fotografía'}))return;pendingPhoto=null;upload.value='';previewProductImage();photoStatus.textContent='Se descartó la nueva foto.';upload.focus({preventScroll:true});notify('Fotografía nueva descartada.','info');});
$('#remove-uploaded-photo').addEventListener('click',async()=>{if(!await confirmAction({title:'¿Usar la imagen de referencia?',message:'La fotografía personalizada se reemplazará cuando guardes el producto.',accept:'Usar referencia'}))return;pendingPhoto=null;editingOriginalPhoto=null;upload.value='';form.dataset.dirty='true';clearFieldError(upload);previewProductImage();photoStatus.textContent='Se utilizará la imagen de referencia al guardar.';form.elements.image.focus({preventScroll:true});notify('Cambio de fotografía preparado; falta guardar el producto.','info');});
$('#new-product').addEventListener('click',()=>openProduct());$('#close-product').addEventListener('click',closeProduct);$('#cancel-product').addEventListener('click',closeProduct);
form.addEventListener('submit',e=>{
 e.preventDefault();if(uploadBusy){notify('La foto todavía se está procesando');return;}
 if(!validateForm(form))return;
 const values=new FormData(form),name=String(values.get('name')||'').trim(),price=Number(values.get('price'));
 if(!name)return fieldError(form.elements.name,'Escribe el nombre del producto.');if(!Number.isFinite(price)||price<0||price>99999999)return fieldError(form.elements.price,'Escribe un precio entre 0 y 99999999 COP.');
 const item={name,description:String(values.get('description')||'').trim(),price,image:String(values.get('image')),active:values.get('active')==='on'};
 if(pendingPhoto||editingOriginalPhoto)item.imageData=pendingPhoto||editingOriginalPhoto;
 const previous=structuredClone(state),id=String(values.get('id')||'');
 if(id){const old=findProduct(id);if(!old)return;Object.keys(old).forEach(k=>{if(k==='imageData')delete old[k];});Object.assign(old,item);}
 else{state.products.push({id:'p'+Date.now().toString(36)+Math.random().toString(36).slice(2,6),...item});}
 syncGalleryPhotos();if(!save()){state=previous;return;}
 renderAll();markFormSaved(form);closeProduct();notify(id?'Producto actualizado correctamente · demo':'Producto agregado correctamente · demo','success');
});
const adminTabs=[...document.querySelectorAll('[data-tab]')];
adminTabs.forEach((tab,i)=>{tab.id='admin-tab-'+tab.dataset.tab;tab.setAttribute('aria-controls','tab-'+tab.dataset.tab);tab.tabIndex=i===0?0:-1;const panel=$('#tab-'+tab.dataset.tab);panel.setAttribute('aria-labelledby',tab.id);tab.addEventListener('click',()=>{adminTabs.forEach(t=>{const active=t===tab;t.setAttribute('aria-selected',String(active));t.tabIndex=active?0:-1;$('#tab-'+t.dataset.tab).hidden=!active;});});tab.addEventListener('keydown',e=>{let next;if(e.key==='ArrowRight')next=(i+1)%adminTabs.length;else if(e.key==='ArrowLeft')next=(i+adminTabs.length-1)%adminTabs.length;else if(e.key==='Home')next=0;else if(e.key==='End')next=adminTabs.length-1;if(next!==undefined){e.preventDefault();adminTabs[next].click();adminTabs[next].focus();}});});
$('#seed-orders').addEventListener('click',()=>{
 if(state.orders.length){notify('Ya existen pedidos de prueba.','info');return;}
 const p=state.products[0]||defaults[0],now=new Date().toISOString();
 commitChange(()=>{for(const [i,status] of ['Recibido','En preparación','En camino'].entries()){state.sequence=(state.sequence||0)+1;state.orders.push({id:'DEMO-'+String(state.sequence).padStart(4,'0'),customer:'Cliente ficticio '+(i+1),contact:'',delivery:i?'delivery':'pickup',address:i?'Dirección de ejemplo':'',payment:'cash',paymentStatus:'Pendiente de recaudo',items:[{id:p.id,name:p.name,quantity:i+1,unitPrice:p.price}],subtotal:p.price*(i+1),shipping:null,status,driver:i===2?'Repartidor demo':'',createdAt:now,history:[{status,at:now}]});}},'Se cargaron 3 pedidos ficticios','success');renderAll();
});
$('#reset-demo').addEventListener('click',async()=>{
 if(uploadBusy||brandBusy||galleryBusy){notify('Espera a que termine la preparación de las imágenes antes de restablecer.','info');return;}
 if(!await confirmAction({title:'¿Restablecer la demostración?',message:'Se borrarán los productos personalizados, fotografías cargadas, carrito, pedidos y ajustes locales. Esta acción no se puede deshacer.',accept:'Restablecer demo'}))return;
 if(!commitChange(()=>{state={products:structuredClone(defaults),cart:{},orders:[],sequence:0,config:structuredClone(CONFIG_DEFAULT)};normalizeState();},'Datos de demostración restablecidos','success'))return;
 stagedLogo=null;galleryPhoto=null;galleryAltDrafts.clear();driverDrafts.clear();galleryForm.reset();$('#gallery-upload-preview').hidden=true;businessForm.reset();deliveryForm.reset();hoursForm.reset();renderAll();fillBusiness();renderBusinessConfig();
});
renderAll();

window.addEventListener('storage',e=>{if(e.key===KEY){reloadDemo();renderAll();fillBusiness();}});
window.addEventListener('focus',()=>{reloadDemo();renderAll();});

// Configuración de negocio: simulación local, no acceso a sistemas reales.
const businessForm=$('#business-form'),deliveryForm=$('#delivery-config-form'),hoursForm=$('#hours-form');
function fillBusiness(){
 if(businessForm.dataset.dirty!=='true'){
  for(const key of ['brand','tagline','description','address','phone','whatsapp','email','map','facebook','instagram','tiktok'])businessForm.elements[key].value=state.config[key]||'';
  businessForm.elements.addressConfirmed.checked=!!state.config.addressConfirmed;$('#brand-preview').src=state.config.logoData||'assets/images/logo-la-exquisita-oficial-sello.png';
  for(const key of ['facebook','instagram','tiktok','whatsapp'])businessForm.elements['social-'+key].checked=state.config.socialEnabled?.[key]!==false;
 }
 if(deliveryForm.dataset.dirty!=='true'){
  for(const key of ['deliveryEnabled','pickupEnabled'])deliveryForm.elements[key].checked=!!state.config[key];
  for(const key of ['minOrder','freeFrom','deliveryNotes'])deliveryForm.elements[key].value=state.config[key]||'';
  deliveryForm.elements.zones.value=state.config.zones.map(z=>z.name+'|'+z.price).join('\n');
 }
 if(hoursForm.dataset.dirty!=='true'){
  hoursForm.elements.hoursConfirmed.checked=!!state.config.hoursConfirmed;hoursForm.elements.acceptOutsideHours.checked=!!state.config.acceptOutsideHours;hoursForm.elements.exceptions.value=state.config.exceptions||'';
  for(const key of ['closedFrom','closedUntil'])hoursForm.elements[key].value=state.config[key]||'';
  const root=$('#hours-fields');root.replaceChildren();['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'].forEach((day,i)=>{
   const h=state.config.hours[i],row=el('div','hours-admin-row'),title=el('strong','',day),check=el('input');check.type='checkbox';check.name='open-'+i;check.checked=!!h.open;check.setAttribute('aria-label',day+' abierto');
   const from=el('input'),to=el('input');from.type=to.type='time';from.name='from-'+i;to.name='to-'+i;from.value=h.from;to.value=h.to;from.setAttribute('aria-label','Apertura '+day);to.setAttribute('aria-label','Cierre '+day);row.append(title,check,from,to);root.append(row);
  });
 }
 renderGalleryAdmin();
}
let stagedLogo=null,brandBusy=false;
$('#brand-upload').addEventListener('change',async event=>{
 const input=event.target,file=input.files[0];if(!file)return;clearFieldError(input);brandBusy=true;input.disabled=true;businessForm.querySelector('[type=submit]').disabled=true;
 try{stagedLogo=await imageFileToData(file,500);$('#brand-preview').src=stagedLogo;notify('Logo preparado. Guarda la información del negocio para aplicarlo.','info');}
 catch(error){input.value='';fieldError(input,error.message,false);}
 finally{brandBusy=false;input.disabled=false;businessForm.querySelector('[type=submit]').disabled=false;}
});
$('#restore-logo').addEventListener('click',async()=>{
 if(brandBusy){notify('Espera a que termine la preparación del logo.','info');return;}
 if(!await confirmAction({title:'¿Restaurar el logo oficial?',message:'El cambio quedará preparado; debes guardar la información del negocio para aplicarlo.',accept:'Restaurar logo'}))return;
 stagedLogo='';businessForm.dataset.dirty='true';$('#brand-upload').value='';clearFieldError($('#brand-upload'));$('#brand-preview').src='assets/images/logo-la-exquisita-oficial-sello.png';notify('Logo oficial preparado; falta guardar los cambios.','info');
});
businessForm.addEventListener('submit',event=>{
 event.preventDefault();if(brandBusy){notify('Espera a que termine la preparación del logo.','info');return;}
 const next=structuredClone(state.config),data=new FormData(businessForm);
 for(const key of ['brand','tagline','description','address','phone','whatsapp','email','map','facebook','instagram','tiktok'])next[key]=String(data.get(key)||'').trim();
 for(const key of ['map','facebook','instagram','tiktok'])if(next[key]&&!validHttpUrl(next[key]))return fieldError(businessForm.elements[key],'Usa un enlace válido con https:// o http://.');
 if(next.whatsapp&&!/^\d{10,15}$/.test(next.whatsapp))return fieldError(businessForm.elements.whatsapp,'Escribe entre 10 y 15 dígitos, con código de país.');
 if(next.phone&&!/^\d{7,15}$/.test(next.phone.replace(/\D/g,'')))return fieldError(businessForm.elements.phone,'Escribe un teléfono válido de 7 a 15 dígitos.');
 next.addressConfirmed=businessForm.elements.addressConfirmed.checked;next.socialEnabled=Object.fromEntries(['facebook','instagram','tiktok','whatsapp'].map(key=>[key,businessForm.elements['social-'+key].checked]));
 if(stagedLogo!==null)next.logoData=stagedLogo;
 const message=stagedLogo===null?'Contacto, redes y configuración guardados · demo':stagedLogo?'Logo y configuración guardados · demo':'Logo oficial restaurado y configuración guardada · demo';
 if(!commitChange(()=>{state.config=next;},message,'success'))return;
 stagedLogo=null;markFormSaved(businessForm);renderBusinessConfig();
});
deliveryForm.addEventListener('submit',event=>{
 event.preventDefault();const data=new FormData(deliveryForm),zones=[];
 for(const raw of String(data.get('zones')||'').split('\n')){
  if(!raw.trim())continue;const parts=raw.split('|'),name=(parts[0]||'').trim(),priceText=(parts[1]||'').trim(),amount=Number(priceText);
  if(parts.length!==2||!name||!/^\d+(?:\.\d+)?$/.test(priceText)||!Number.isFinite(amount)||amount<0||zones.some(z=>z.name===name))return fieldError(deliveryForm.elements.zones,'Usa una zona por línea: Nombre|precio COP, sin valores negativos ni nombres repetidos.');
  zones.push({name,price:amount,active:true});
 }
 const deliveryEnabled=deliveryForm.elements.deliveryEnabled.checked,pickupEnabled=deliveryForm.elements.pickupEnabled.checked;
 if(!pickupEnabled&&!deliveryEnabled)return fieldError(deliveryForm.elements.deliveryEnabled,'Habilita al menos una modalidad de entrega.');
 if(commitChange(()=>{Object.assign(state.config,{zones,deliveryEnabled,pickupEnabled,minOrder:Number(data.get('minOrder'))||0,freeFrom:Number(data.get('freeFrom'))||0,deliveryNotes:String(data.get('deliveryNotes')||'')});},'Domicilios, tarifas y zonas guardados · demo','success'))markFormSaved(deliveryForm);
});
hoursForm.addEventListener('submit',event=>{
 event.preventDefault();const data=new FormData(hoursForm),hours=[];
 for(let i=0;i<7;i++){const h={open:!!data.get('open-'+i),from:String(data.get('from-'+i)),to:String(data.get('to-'+i))};if(h.open&&!validHours(h))return fieldError(hoursForm.elements[(h.from?'to-':'from-')+i],'Indica apertura y cierre válidos; el cierre debe ser posterior a la apertura.');hours.push(h);}
 const closedFrom=String(data.get('closedFrom')||''),closedUntil=String(data.get('closedUntil')||''),exceptions=String(data.get('exceptions')||'');
 if((closedFrom||closedUntil)&&(!validDate(closedFrom)||!validDate(closedUntil)||closedFrom>closedUntil))return fieldError(hoursForm.elements[!closedFrom?'closedFrom':'closedUntil'],'Indica ambas fechas del cierre en orden correcto.');
 if(!parseExceptions(exceptions))return fieldError(hoursForm.elements.exceptions,'Usa AAAA-MM-DD|cerrado o AAAA-MM-DD|HH:MM-HH:MM, una fecha por línea.');
 if(commitChange(()=>{Object.assign(state.config,{closedFrom,closedUntil,hours,exceptions,hoursConfirmed:hoursForm.elements.hoursConfirmed.checked,acceptOutsideHours:hoursForm.elements.acceptOutsideHours.checked});},'Horario actualizado · demo','success')){markFormSaved(hoursForm);renderBusinessConfig();}
});
function galleryChange(change,message,onSuccess){const saved=commitChange(change,message,'success');if(saved)onSuccess?.();renderGalleryAdmin();return saved;}
function renderGalleryAdmin(){
 const root=$('#gallery-preview');root.replaceChildren();root.dataset.pendingEdit=String(galleryAltDrafts.size>0);const items=galleryImages(false);
 items.forEach((item,index)=>{
  const card=el('div','gallery-admin-card'),image=el('img');image.src=galleryImageUrl(item);image.alt=item.alt||'Fotografía de La Exquisita';
  const label=el('label','','Texto alternativo'),alt=el('input');alt.value=galleryAltDrafts.get(item.id)??item.alt??'';alt.maxLength=160;alt.title='Se guarda al salir del campo. Pulsa Enter para reintentar.';
  alt.addEventListener('input',()=>{galleryAltDrafts.set(item.id,alt.value);root.dataset.pendingEdit='true';});
  const saveAlt=()=>{galleryAltDrafts.set(item.id,alt.value);galleryChange(()=>{state.gallery.find(g=>g.id===item.id).alt=alt.value.trim()||'Fotografía de La Exquisita';},'Texto alternativo actualizado',()=>galleryAltDrafts.delete(item.id));};
  alt.addEventListener('change',saveAlt);alt.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();saveAlt();}});label.append(alt);
  const actions=el('div','admin-row-actions');actions.append(button(item.active===false?'Activar':'Desactivar','admin-secondary',()=>galleryChange(()=>{item.active=item.active===false;},item.active===false?'Imagen activada en la galería':'Imagen desactivada en la galería')));
  for(const [delta,name] of [[-1,'Subir fotografía'],[1,'Bajar fotografía']]){const target=items[index+delta],b=iconButton(delta<0?'up':'down',name,()=>galleryChange(()=>{const i=state.gallery.indexOf(item),j=state.gallery.indexOf(target);[state.gallery[i],state.gallery[j]]=[state.gallery[j],state.gallery[i]];},'Orden de la galería actualizado'),'admin-secondary icon-button');b.disabled=!target;actions.append(b);}
  card.append(image,label,actions);root.append(card);
 });
 if(!items.length)root.append(el('p','empty-state','Agrega una fotografía para comenzar.'));
}
let galleryPhoto=null,galleryBusy=false;
const galleryForm=$('#gallery-form');
$('#gallery-upload').addEventListener('change',async event=>{
 const input=event.target,preview=$('#gallery-upload-preview');galleryPhoto=null;preview.hidden=true;clearFieldError(input);const file=input.files[0];if(!file)return;galleryBusy=true;input.disabled=true;galleryForm.querySelector('[type=submit]').disabled=true;
 try{galleryPhoto=await imageFileToData(file);preview.src=galleryPhoto;preview.hidden=false;notify('Fotografía preparada. Agrega su texto alternativo y guarda para publicarla en la galería demo.','info');}
 catch(error){input.value='';fieldError(input,error.message,false);}
 finally{galleryBusy=false;input.disabled=false;galleryForm.querySelector('[type=submit]').disabled=false;}
});
galleryForm.addEventListener('submit',event=>{
 event.preventDefault();if(galleryBusy){notify('Espera a que termine la preparación de la fotografía.','info');return;}if(!galleryPhoto)return fieldError($('#gallery-upload'),'Selecciona una fotografía válida.');
 if(state.gallery.some(item=>galleryImageUrl(item)===galleryPhoto))return fieldError($('#gallery-upload'),'Esta fotografía ya está en la galería.');
 const item={id:'gallery-'+Date.now().toString(36),imageData:galleryPhoto,alt:galleryForm.elements.alt.value.trim()||'Fotografía de La Exquisita',active:true};
 if(!commitChange(()=>{state.gallery.push(item);},'Imagen guardada correctamente en la galería demo','success'))return;
 galleryPhoto=null;galleryForm.reset();$('#gallery-upload-preview').hidden=true;renderGalleryAdmin();
});
fillBusiness();
