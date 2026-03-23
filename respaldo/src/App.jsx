import { useState, useEffect, useRef } from "react";
import { supabase, hoy } from "./supabaseClient";

// ── TEMA ─────────────────────────────────────────────────────
const C = {
  bg:"#0F0F0F", surface:"#1A1A1A", border:"#2A2A2A",
  accent:"#F59E0B", text:"#F5F5F0", muted:"#777",
  green:"#10B981", red:"#EF4444", orange:"#F97316",
};

// ── DATOS DEMO (solo sin Supabase; en producción no se usan) ───
// const PROY0 = [
//   {id:1,nombre:"Casa Monterrey - Lote 14",activo:true,presupuesto:18000},
//   {id:2,nombre:"Bodega Industrial Norte",activo:true,presupuesto:32000},
//   ...
// ];
// const EMP0 = [ ... ];
// const REG0 = [ ... ];

const $$ = n => "$"+Number(n).toLocaleString("es-MX");

function formatHoras(h){
  const v = Number(h) || 0;
  if(v === 0) return "0h";
  const entero = Math.floor(v);
  const fraccion = v - entero;
  if(entero === 0 && Math.abs(fraccion-0.5)<1e-6) return "30min";
  if(Math.abs(fraccion-0.5)<1e-6) return `${entero}:30`;
  if(Math.abs(fraccion)<1e-6) return `${entero}h`;
  return `${v}h`;
}

// ── COMPONENTES BASE ─────────────────────────────────────────
function Badge({label,color=C.accent}){
  return <span style={{background:color+"22",color,border:`1px solid ${color}44`,borderRadius:4,padding:"2px 7px",fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:.5,whiteSpace:"nowrap"}}>{label}</span>;
}

function Pill({active,onClick,children}){
  return <button onClick={onClick} style={{background:active?C.accent:C.surface,color:active?"#000":C.muted,border:`1px solid ${active?C.accent:C.border}`,borderRadius:20,padding:"6px 14px",fontSize:13,fontWeight:active?700:400,cursor:"pointer"}}>{children}</button>;
}

function Btn({onClick,children,variant="primary",full,disabled}){
  const v={
    primary:{background:disabled?C.border:C.accent,color:disabled?C.muted:"#000",border:"none",fontWeight:800,cursor:disabled?"not-allowed":"pointer"},
    secondary:{background:"none",color:C.muted,border:`1px solid ${C.border}`,cursor:"pointer"},
    ghost:{background:C.surface,color:C.muted,border:`1px solid ${C.border}`,cursor:"pointer"},
    danger:{background:C.red+"11",color:C.red,border:`1px solid ${C.red}44`,cursor:"pointer"},
    warn:{background:C.orange+"22",color:C.orange,border:`1px solid ${C.orange}44`,fontWeight:700,cursor:"pointer"},
  };
  return <button onClick={disabled?undefined:onClick} style={{...v[variant]||v.primary,borderRadius:9,padding:"11px 14px",fontSize:13,width:full?"100%":"auto",fontFamily:"inherit"}}>{children}</button>;
}

function Field({label,value,onChange,placeholder,type="text"}){
  return <div>
    {label&&<div style={{fontSize:12,color:C.muted,marginBottom:6}}>{label}</div>}
    <input value={value} onChange={onChange} placeholder={placeholder} type={type} style={{width:"100%",background:C.bg,border:`1px solid ${C.border}`,borderRadius:8,padding:"12px 14px",color:C.text,fontSize:14,outline:"none",boxSizing:"border-box",fontFamily:"inherit"}}/>
  </div>;
}

function Toggle({value,onChange,opts}){
  return <div style={{display:"flex",gap:8}}>
    {opts.map(o=><button key={String(o.v)} onClick={()=>onChange(o.v)} style={{flex:1,padding:"10px",background:value===o.v?C.accent+"22":C.bg,border:`1px solid ${value===o.v?C.accent:C.border}`,borderRadius:8,color:value===o.v?C.accent:C.muted,fontWeight:value===o.v?700:400,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>{o.l}</button>)}
  </div>;
}

function Sheet({title,onClose,children}){
  return <div style={{position:"fixed",inset:0,background:"#000b",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:200}} onClick={onClose}>
    <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:"20px 20px 0 0",padding:24,width:"100%",maxWidth:420,maxHeight:"88vh",overflowY:"auto",boxSizing:"border-box"}} onClick={e=>e.stopPropagation()}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
        <span style={{fontSize:16,fontWeight:800,color:C.text}}>{title}</span>
        <button onClick={onClose} style={{background:"none",border:"none",color:C.muted,fontSize:24,cursor:"pointer",lineHeight:1,padding:0}}>×</button>
      </div>
      {children}
    </div>
  </div>;
}

function Confirm({msg,onOk,onCancel,okLabel="Eliminar"}){
  return <div style={{position:"fixed",inset:0,background:"#000d",display:"flex",alignItems:"center",justifyContent:"center",zIndex:300,padding:24}}>
    <div style={{background:C.surface,border:`1px solid ${C.red}44`,borderRadius:16,padding:24,width:"100%",maxWidth:300}}>
      <div style={{fontSize:28,textAlign:"center",marginBottom:10}}>⚠️</div>
      <div style={{fontSize:14,color:C.text,textAlign:"center",marginBottom:20,lineHeight:1.5}}>{msg}</div>
      <div style={{display:"flex",gap:10}}>
        <Btn onClick={onCancel} variant="secondary" full>Cancelar</Btn>
        <Btn onClick={onOk} variant="danger" full>{okLabel}</Btn>
      </div>
    </div>
  </div>;
}

function StepDots({current,total}){
  return <div style={{display:"flex",gap:4}}>
    {Array.from({length:total}).map((_,i)=><div key={i} style={{width:i===current?20:6,height:6,borderRadius:3,background:i<=current?C.accent:C.border,transition:"all 0.3s"}}/>)}
  </div>;
}

function HourPicker({value,onChange}){
  return <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
    {Array.from({length:16},(_,i)=>0.5*(i+1)).map(h=>
      <button
        key={h}
        onClick={()=>onChange(h)}
        style={{
          width:40,
          height:34,
          borderRadius:7,
          background:value===h?C.accent:C.bg,
          border:`1px solid ${value===h?C.accent:C.border}`,
          color:value===h?"#000":C.text,
          fontWeight:700,
          fontSize:11,
          cursor:"pointer",
          fontFamily:"inherit"
        }}
      >
        {formatHoras(h)}
      </button>
    )}
  </div>;
}

function ProyectoSelector({proyectos,selec,setSelec,horas,setHoras,extraVisibleIds=[]}){
  const toggle = id => {
    setSelec(p => p.includes(id) ? p.filter(x=>x!==id) : [...p,id]);
    if(selec.includes(id)) setHoras(h=>{const n={...h};delete n[id];return n;});
  };
  const totalH = Object.values(horas).reduce((a,b)=>a+(Number(b)||0),0);
  const diff = 8 - totalH;
  const esJornada = Math.abs(totalH-8)<1e-6;
  const falta = !esJornada && totalH < 8;
  const excede = totalH > 8;
  return <div style={{display:"flex",flexDirection:"column",gap:10}}>
    {proyectos.filter(p=>p.activo || extraVisibleIds.includes(p.id)).map(p=>{
      const sel=selec.includes(p.id);
      return <div key={p.id} style={{background:sel?C.accent+"11":C.surface,border:`1px solid ${sel?C.accent:C.border}`,borderRadius:10,padding:"12px 14px",cursor:"pointer",userSelect:"none"}} onClick={()=>toggle(p.id)}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:18,height:18,borderRadius:4,border:`2px solid ${sel?C.accent:C.border}`,background:sel?C.accent:"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"#000",fontWeight:900,flexShrink:0}}>{sel?"✓":""}</div>
          <span style={{fontSize:13,color:C.text,fontWeight:sel?600:400}}>
            {p.nombre}
            {!p.activo && <span style={{marginLeft:6,fontSize:11,color:C.muted}}>· Cerrado</span>}
          </span>
        </div>
        {sel&&<div style={{marginTop:10,display:"flex",alignItems:"center",gap:8}} onClick={e=>e.stopPropagation()}>
          <span style={{fontSize:12,color:C.muted,flexShrink:0}}>Horas:</span>
          <HourPicker value={horas[p.id]} onChange={h=>setHoras(prev=>({...prev,[p.id]:h}))}/>
        </div>}
      </div>;
    })}
    {selec.length>0&&<div style={{background:C.surface,borderRadius:10,padding:"11px 14px",border:`1px solid ${esJornada?C.green:C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <span style={{fontSize:13,color:C.muted}}>Total del día:</span>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <span style={{fontSize:20,fontWeight:900,color:excede?C.red:esJornada?C.green:C.accent}}>
          {formatHoras(totalH)}
        </span>
        {esJornada && (
          <span style={{fontSize:12,color:C.green,fontWeight:700}}>✓ Jornada completa</span>
        )}
        {falta && (
          <span style={{fontSize:12,color:C.orange,fontWeight:700}}>
            Faltan {formatHoras(Math.max(0,diff))}
          </span>
        )}
        {excede && (
          <span style={{fontSize:12,color:C.red,fontWeight:700}}>Excede jornada</span>
        )}
      </div>
    </div>}
  </div>;
}

// ── PANTALLA INICIO ───────────────────────────────────────────
function PantallaInicio({onSelect}){
  return <div style={{display:"flex",flexDirection:"column",gap:16}}>
    <div style={{textAlign:"center",marginBottom:4}}>
      <div style={{fontSize:11,letterSpacing:3,color:C.accent,fontWeight:700,marginBottom:8,textTransform:"uppercase"}}>Sistema de Registro</div>
      <div style={{fontSize:26,fontWeight:900,color:C.text,lineHeight:1.1}}>¿Quién eres?</div>
      <div style={{fontSize:13,color:C.muted,marginTop:6}}>Selecciona tu perfil para continuar</div>
    </div>
    {[{k:"worker",icon:"👷",title:"Soy trabajador",sub:"Registrar o corregir mis horas"},{k:"admin",icon:"📊",title:"Soy gerente / admin",sub:"Ver reportes y gestionar"}].map(o=>(
      <button key={o.k} onClick={()=>onSelect(o.k)} onMouseEnter={e=>e.currentTarget.style.borderColor=C.accent} onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}
        style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:"20px 16px",display:"flex",alignItems:"center",gap:16,cursor:"pointer",textAlign:"left",width:"100%",fontFamily:"inherit"}}>
        <div style={{fontSize:32}}>{o.icon}</div>
        <div>
          <div style={{color:C.text,fontWeight:700,fontSize:15}}>{o.title}</div>
          <div style={{color:C.muted,fontSize:12,marginTop:2}}>{o.sub}</div>
        </div>
        <div style={{marginLeft:"auto",color:C.accent,fontSize:18}}>→</div>
      </button>
    ))}
  </div>;
}

// ── PANTALLA PIN ──────────────────────────────────────────────
function PantallaPIN({onSuccess,onBack}){
  const [pin,setPin]=useState("");
  const [err,setErr]=useState(false);
  const [shake,setShake]=useState(false);

  const press = d => {
    if(pin.length>=4) return;
    const n=pin+d;
    setPin(n); setErr(false);
    if(n.length===4){
      setTimeout(()=>{
        if(n==="2014") onSuccess();
        else{setShake(true);setErr(true);setTimeout(()=>{setPin("");setShake(false);},700);}
      },200);
    }
  };
  const del = () => { setPin(p=>p.slice(0,-1)); setErr(false); };

  return <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:22,paddingTop:16}}>
    <style>{`@keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-8px)}40%,80%{transform:translateX(8px)}}`}</style>
    <button onClick={onBack} style={{alignSelf:"flex-start",background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:20,padding:0}}>←</button>
    <div style={{textAlign:"center"}}>
      <div style={{fontSize:38,marginBottom:10}}>🔒</div>
      <div style={{fontSize:11,color:C.accent,fontWeight:700,letterSpacing:2,textTransform:"uppercase",marginBottom:6}}>Acceso restringido</div>
      <div style={{fontSize:20,fontWeight:900,color:C.text}}>Ingresa tu PIN</div>
      <div style={{fontSize:13,color:C.muted,marginTop:4}}>Solo gerentes y administradores</div>
    </div>
    <div style={{display:"flex",gap:18,animation:shake?"shake 0.5s ease":"none"}}>
      {[0,1,2,3].map(i=><div key={i} style={{width:16,height:16,borderRadius:"50%",background:err?C.red:pin.length>i?C.accent:"transparent",border:`2px solid ${err?C.red:pin.length>i?C.accent:C.border}`,transition:"all 0.15s"}}/>)}
    </div>
    {err&&<div style={{fontSize:13,color:C.red,fontWeight:700}}>PIN incorrecto, intenta de nuevo</div>}
    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,width:"100%"}}>
      {[1,2,3,4,5,6,7,8,9,"",0,"⌫"].map((d,i)=>(
        <button key={i} onClick={()=>d==="⌫"?del():d!==""?press(String(d)):null} disabled={d===""} style={{height:62,borderRadius:12,background:d===""?"transparent":C.surface,border:d===""?"none":`1px solid ${C.border}`,color:d==="⌫"?C.muted:C.text,fontSize:d==="⌫"?20:22,fontWeight:700,cursor:d===""?"default":"pointer",fontFamily:"inherit"}}>{d}</button>
      ))}
    </div>
  </div>;
}

// ── PANTALLA TRABAJADOR ───────────────────────────────────────
function PantallaTrabajador({proyectos,empleados,registros,onGuardar,onBack,saving,saveError}){
  const [step,setStep]         = useState("s1");
  const [llenador,setLlenador] = useState(null);
  const [target,setTarget]     = useState(null);
  const [selec,setSelec]       = useState([]);
  const [horas,setHoras]       = useState({});
  const [editando,setEditando] = useState(false);
  const [origenS3,setOrigenS3] = useState("s2");

  const esMismo    = llenador && target && llenador.id === target.id;
  const regExist   = target
    ? registros.find(r => r.eid === target.id && r.fecha === hoy() && r.items?.some(it => (Number(it.h)||0) > 0))
    : null;
  const totalH     = Object.values(horas).reduce((a,b) => a + (Number(b)||0), 0);
  const canSend    = selec.length > 0 && selec.every(id => (Number(horas[id])||0) > 0);
  const tieneProgreso = step==="s3" && selec.length>0;
  const [confirmExit,setConfirmExit] = useState(false);

  function elegirLlenador(e){ setLlenador(e); setStep("s2"); }

  function elegirTarget(e){
    setTarget(e);
    const reg = registros.find(r => r.eid === e.id && r.fecha === hoy());
    const tieneHoras = reg && reg.items && reg.items.some(it => (Number(it.h)||0) > 0);
    if(tieneHoras){ setStep("s2b"); }
    else { setSelec([]); setHoras({}); setEditando(false); setOrigenS3("s2"); setStep("s3"); }
  }

  function iniciarEdicion(){
    const ids = regExist.items.map(x => x.pid);
    const hrs = {};
    regExist.items.forEach(x => { hrs[x.pid] = x.h; });
    setSelec(ids); setHoras(hrs); setEditando(true); setOrigenS3("s2b"); setStep("s3");
  }

  function enviar(){
    const items = selec.map(id => ({pid:id, h:Number(horas[id])||0}));
    onGuardar(target.id, llenador.id, items);
    setStep("s4");
  }

  function limpiarFlujo(){
    setStep("s1");
    setLlenador(null);
    setTarget(null);
    setSelec([]);
    setHoras({});
    setEditando(false);
  }

  function goBack(){
    if(step==="s3" && tieneProgreso){
      setConfirmExit(true);
      return;
    }
    if(step==="s1") onBack();
    else if(step==="s2") setStep("s1");
    else if(step==="s2b") setStep("s2");
    else if(step==="s3") setStep(origenS3);
    else { limpiarFlujo(); }
  }

  const titles = {s1:"¿Quién está llenando?",s2:"¿De quién son las horas?",s2b:"Ya registrado hoy",s3:editando?"Editar registro":"¿En qué trabajaste?",s4:"¡Listo!"};
  const dotIdx = step==="s4"?3:step==="s3"?2:step==="s2"||step==="s2b"?1:0;

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>

      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <button onClick={goBack} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:20,padding:0,lineHeight:1}}>←</button>
        <div style={{flex:1}}>
          <div style={{fontSize:11,color:C.accent,fontWeight:700,letterSpacing:2,textTransform:"uppercase"}}>Registro diario</div>
          <div style={{fontSize:17,fontWeight:800,color:C.text}}>{titles[step]}</div>
        </div>
        <StepDots current={dotIdx} total={4}/>
      </div>

      {saveError && (
        <div style={{background:C.red+"22",border:`1px solid ${C.red}66`,borderRadius:8,padding:"8px 10px",fontSize:12,color:C.red,marginBottom:4}}>
          No se pudo guardar. Verifica tu conexión e intenta de nuevo
        </div>
      )}

      {step==="s1" && (
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          <div style={{fontSize:13,color:C.muted,marginBottom:4}}>Selecciona <strong style={{color:C.text}}>tu nombre</strong> — quien tiene el teléfono ahora:</div>
          {empleados.filter(e=>e.activo).map(e => (
            <button key={e.id} onClick={()=>elegirLlenador(e)}
              style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:"12px 16px",color:C.text,cursor:"pointer",textAlign:"left",fontSize:14,display:"flex",alignItems:"center",gap:12,fontFamily:"inherit",width:"100%"}}>
              <div style={{width:34,height:34,borderRadius:"50%",background:C.accent+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,color:C.accent,fontWeight:900,flexShrink:0}}>{e.nombre[0]}</div>
              <span>{e.nombre}</span>
              <span style={{marginLeft:"auto",color:C.accent}}>{"→"}</span>
            </button>
          ))}
        </div>
      )}

      {step==="s2" && (
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          <div style={{background:C.accent+"11",border:`1px solid ${C.accent}33`,borderRadius:10,padding:"10px 14px",fontSize:13,color:C.accent,fontWeight:600}}>
            {"👋 Hola, "}<strong>{llenador ? llenador.nombre : ""}</strong>{". Selecciona de quién registrarás las horas:"}
          </div>
          {empleados.filter(e=>e.activo).map(e => {
            const yaReg  = registros.find(r => r.eid === e.id && r.fecha === hoy() && r.items?.some(it => (Number(it.h)||0) > 0));
            const esTuyo = llenador && e.id === llenador.id;
            return (
              <button key={e.id} onClick={()=>elegirTarget(e)}
                style={{background:C.surface,border:`1px solid ${esTuyo?C.accent+"66":C.border}`,borderRadius:10,padding:"12px 16px",color:C.text,cursor:"pointer",textAlign:"left",fontSize:14,display:"flex",alignItems:"center",gap:12,fontFamily:"inherit",width:"100%"}}>
                <div style={{width:34,height:34,borderRadius:"50%",background:esTuyo?C.accent+"33":C.surface,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,color:esTuyo?C.accent:C.muted,fontWeight:900,flexShrink:0,border:`1px solid ${esTuyo?C.accent+"55":C.border}`}}>{e.nombre[0]}</div>
                <div style={{flex:1}}>
                  <span>{e.nombre}</span>
                  {esTuyo && <span style={{fontSize:11,color:C.accent,fontWeight:700,marginLeft:6}}>{"(Tú)"}</span>}
                </div>
                {yaReg ? (() => {
                  const totalHReg = yaReg.items.reduce((a, x) => a + (Number(x.h)||0), 0);
                  const completo = totalHReg >= 8;
                  if(completo) return <Badge label="✓ 8h" color={C.green}/>;
                  const faltan = 8 - totalHReg;
                  return <Badge label={`Faltan ${formatHoras(faltan)}`} color={C.orange}/>;
                })() : <span style={{color:C.accent}}>{"→"}</span>}
              </button>
            );
          })}
        </div>
      )}

      {step==="s2b" && (
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {!esMismo && (
            <div style={{background:C.orange+"11",border:`1px solid ${C.orange}44`,borderRadius:10,padding:"10px 14px",fontSize:13,color:C.orange}}>
              {"⚠️ Revisando registro de "}<strong>{target ? target.nombre : ""}</strong>
            </div>
          )}
          <div style={{background:C.green+"11",border:`1px solid ${C.green}44`,borderRadius:12,padding:16}}>
            <div style={{fontSize:14,fontWeight:700,color:C.green,marginBottom:8}}>
              {esMismo ? "✅ Ya registraste hoy" : "✅ " + (target ? target.nombre : "") + " ya registró hoy"}
            </div>
            {regExist && regExist.items.map(x => {
              const p = proyectos.find(q => q.id === x.pid);
              return (
                <div key={x.pid} style={{display:"flex",justifyContent:"space-between",fontSize:13,color:C.muted,padding:"4px 0",borderBottom:`1px solid ${C.border}`}}>
                  <span>{p ? p.nombre : "—"}</span>
                  <span style={{color:C.text,fontWeight:700}}>{formatHoras(x.h)}</span>
                </div>
              );
            })}
          </div>
          <div style={{fontSize:13,color:C.muted,textAlign:"center"}}>{"¿Necesitas corregir algo?"}</div>
          <Btn onClick={iniciarEdicion} variant="ghost" full>{"✏️ Editar registro"}</Btn>
          <Btn
            onClick={() => {
              setSelec([]);
              setHoras({});
              setEditando(true);
              setOrigenS3("s2b");
              setStep("s3");
            }}
            variant="warn"
            full
          >
            🔄 Corregir desde cero
          </Btn>
          <Btn onClick={onBack} variant="secondary" full>{"Todo está bien, salir"}</Btn>
        </div>
      )}

      {step==="s3" && (
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {!esMismo && (
            <div style={{background:C.orange+"11",border:`1px solid ${C.orange}44`,borderRadius:10,padding:"10px 14px",fontSize:13,color:C.orange,fontWeight:600}}>
              {"📋 Llenando en nombre de: "}<strong>{target ? target.nombre : ""}</strong>
            </div>
          )}
          <div style={{fontSize:13,color:C.muted}}>
            {editando ? "Corrige las horas de " : "Selecciona proyectos y horas de "}
            <strong style={{color:C.text}}>{target ? target.nombre : ""}</strong>:
          </div>
          <ProyectoSelector proyectos={proyectos} selec={selec} setSelec={setSelec} horas={horas} setHoras={setHoras}/>
          <Btn onClick={enviar} full disabled={!canSend || saving}>
            {saving ? "Guardando..." : (editando ? "Guardar corrección →" : "Enviar registro →")}
          </Btn>
        </div>
      )}

      {step==="s4" && (
        <div style={{textAlign:"center",padding:"16px 0"}}>
          <div style={{fontSize:52,marginBottom:12}}>{editando ? "✏️" : "✅"}</div>
          <div style={{fontSize:22,fontWeight:900,color:C.text,marginBottom:6}}>{editando ? "¡Corregido!" : "¡Registro enviado!"}</div>
          <div style={{fontSize:13,color:C.muted,marginBottom:16}}>
            {"Las horas de "}<strong style={{color:C.text}}>{target ? target.nombre : ""}</strong>{" quedaron guardadas."}
          </div>
          {!esMismo && (
            <div style={{background:C.orange+"11",border:`1px solid ${C.orange}44`,borderRadius:10,padding:"10px 14px",fontSize:12,color:C.orange,marginBottom:16,textAlign:"left"}}>
              {"📋 Registrado por: "}<strong>{llenador ? llenador.nombre : ""}</strong>{" en nombre de "}<strong>{target ? target.nombre : ""}</strong>
            </div>
          )}
          <div style={{background:C.surface,borderRadius:10,padding:14,border:`1px solid ${C.border}`,textAlign:"left",marginBottom:16}}>
            <div style={{fontSize:11,color:C.accent,fontWeight:700,letterSpacing:2,textTransform:"uppercase",marginBottom:10}}>Resumen</div>
            {selec.map(id => {
              const p = proyectos.find(x => x.id === id);
              return (
                <div key={id} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:`1px solid ${C.border}`,fontSize:13}}>
                  <span style={{color:C.muted}}>{p ? p.nombre : "—"}</span>
                  <span style={{color:C.text,fontWeight:700}}>{formatHoras(horas[id])}</span>
                </div>
              );
            })}
            <div style={{display:"flex",justifyContent:"space-between",paddingTop:8}}>
              <span style={{color:C.muted,fontWeight:700}}>Total</span>
              <span style={{color:C.accent,fontWeight:900,fontSize:15}}>{formatHoras(totalH)}</span>
            </div>
          </div>
          <Btn onClick={()=>{
            if(tieneProgreso){
              setConfirmExit(true);
            }else{
              limpiarFlujo();
              onBack();
            }
          }} variant="secondary">
            Volver al inicio
          </Btn>
        </div>
      )}

      {confirmExit && (
        <Confirm
          msg="¿Salir? Perderás el registro que estás llenando"
          okLabel="Salir"
          onOk={()=>{
            setConfirmExit(false);
            limpiarFlujo();
            onBack();
          }}
          onCancel={()=>setConfirmExit(false)}
        />
      )}

    </div>
  );
}

function DiaHistorial({fecha, items, totalDia, costoDia, proyectos, emp}){
  const [abierto, setAbierto] = useState(false);
  const completo = Math.abs(totalDia - 8) < 1e-6;
  const excede = totalDia > 8;
  const col = excede ? C.red : completo ? C.green : C.orange;
  return <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,overflow:"hidden"}}>
    <div onClick={()=>setAbierto(a=>!a)} style={{padding:"12px 14px",display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer"}}>
      <div>
        <div style={{fontSize:13,fontWeight:700,color:C.text}}>{fecha}</div>
        <div style={{fontSize:11,color:C.muted,marginTop:2}}>{items.length} proyecto{items.length!==1?"s":""}</div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <div style={{textAlign:"right"}}>
          <div style={{fontSize:14,fontWeight:900,color:col}}>{formatHoras(totalDia)}</div>
          <div style={{fontSize:11,color:C.muted}}>{$$(costoDia)}</div>
        </div>
        <span style={{color:C.muted,fontSize:14,transition:"transform 0.2s",display:"inline-block",transform:abierto?"rotate(90deg)":"none"}}>›</span>
      </div>
    </div>
    {abierto && items.map(it => {
      const p = proyectos.find(x => x.id === it.pid);
      return <div key={it.pid} style={{padding:"8px 14px",borderTop:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",background:C.bg}}>
        <span style={{fontSize:12,color:C.muted,flex:1,paddingRight:8}}>{p ? p.nombre : "—"}</span>
        <div style={{textAlign:"right",flexShrink:0}}>
          <span style={{fontSize:12,fontWeight:700,color:C.text}}>{formatHoras(Number(it.h)||0)}</span>
          <span style={{fontSize:11,color:C.muted,marginLeft:6}}>{$$((Number(it.h)||0) * emp.tarifa)}</span>
        </div>
      </div>;
    })}
  </div>;
}

// ── PANEL ADMIN ───────────────────────────────────────────────
function PantallaAdmin({proyectos,setProyectos,empleados,setEmpleados,registros,setRegistros,papelera,setPapelera,bonos,setBonos,onBack,saving,saveError,onDataChanged}){
  const [tab,setTab]=useState("reporte");

  // Proyectos
  const [mproy,setMproy]=useState(null);
  const [fproy,setFproy]=useState({nombre:"",activo:true,presupuesto:""});
  const [delProy,setDelProy]=useState(null);
  const [confirmCerrar,setConfirmCerrar]=useState(null);
  // Empleados
  const [memp,setMemp]=useState(null);
  const [femp,setFemp]=useState({nombre:"",activo:true,tarifa:""});
  const [delEmp,setDelEmp]=useState(null);
  // Papelera - borrado permanente
  const [delPerm1,setDelPerm1]=useState(null);
  const [delPerm2,setDelPerm2]=useState(null);
  const [confirmReabrir,setConfirmReabrir]=useState(null);
  const [empHistorial,setEmpHistorial] = useState(null);
  const [errPresupuesto,setErrPresupuesto]=useState("");
  const [errTarifa,setErrTarifa]=useState("");
  const [mBono, setMBono] = useState(false);
  const [fBono, setFBono] = useState({eid:"", pid:"", monto:"", concepto:""});
  const [errBono, setErrBono] = useState("");
  const [mHistorico, setMHistorico] = useState(false);
  const [fHist, setFHist] = useState({eid:"", fecha:"", selec:[], horas:{}});
  const [errHist, setErrHist] = useState("");

  const eliminarEmpleadoConRegistros = (emp) => {
    if(!emp) return;
    setRegistros(prev=>prev.filter(r=>r.eid!==emp.id));
    setBonos(prev=>prev.filter(b=>b.eid!==emp.id));
    setEmpleados(prev=>prev.filter(x=>x.id!==emp.id));
    setDelEmp(null);
    onDataChanged();
  };
  // Corrección admin
  const [mcorr,setMcorr]=useState(null);
  const [cSelec,setCSelec]=useState([]);
  const [cHoras,setCHoras]=useState({});

  // Papelera: purgar expirados (>30 días) en efecto, no en render
  const DIAS = 90;
  const ahora = Date.now();
  const papeleraVigente = papelera.filter(x => ahora - x.deletedAt < DIAS * 864e5);
  useEffect(()=>{
    const ahora = Date.now();
    const papeleraVigente = papelera.filter(x => ahora - x.deletedAt < DIAS * 864e5);
    if(papeleraVigente.length !== papelera.length) setPapelera(papeleraVigente);
  },[papelera]);

  // Mover proyecto a papelera (guarda snapshot de sus registros)
  const moverAPapelera = (p) => {
    const snap = registros.filter(r => r.items.some(it => it.pid === p.id));
    setPapelera(prev=>[...prev,{...p,deletedAt:Date.now(),registrosSnap:snap}]);
    setProyectos(prev=>prev.filter(x=>x.id!==p.id));
    setDelProy(null);
    onDataChanged();
  };

  // Restaurar proyecto desde papelera
  const restaurar = (item) => {
    setProyectos(prev=>[...prev,{id:item.id,nombre:item.nombre,activo:item.activo||true,presupuesto:item.presupuesto}]);
    // restaurar registros que no existan ya
    setRegistros(prev=>{
      let next=[...prev];
      (item.registrosSnap||[]).forEach(snap=>{
        if(!next.find(r=>r.eid===snap.eid && r.fecha===(snap.fecha||hoy())))
          next=[...next,{...snap,fecha:snap.fecha||hoy()}];
      });
      return next;
    });
    setPapelera(prev=>prev.filter(x=>x.id!==item.id));
    onDataChanged();
  };

  // Cerrar: marca activo:false y guarda snapshot de gasto y desglose por trabajador
  const cerrarProyecto = (p) => {
    const rowsDet = [];
    registros.forEach(reg => {
      reg.items.forEach(it => {
        if(it.pid===p.id){
          const e = empleados.find(x=>x.id===reg.eid);
          if(e){
            const llenador = empleados.find(x=>x.id===reg.llenadorId);
            rowsDet.push({
              eid:reg.eid,
              nombre:e.nombre,
              horas:it.h,
              costo:it.h*e.tarifa,
              porTercero:reg.llenadorId!==reg.eid,
              llenador:llenador?llenador.nombre:null,
            });
          }
        }
      });
    });
    const rowsAgrupadas = Object.values(rowsDet.reduce((acc, row) => {
      if(!acc[row.eid]) acc[row.eid] = {...row, horas: 0, costo: 0};
      acc[row.eid].horas += row.horas;
      acc[row.eid].costo += row.costo;
      return acc;
    }, {}));
    const bonosDelProyecto = bonos.filter(b => b.pid === p.id).reduce((a,b) => a + b.monto, 0);
    const gastoReal = rowsAgrupadas.reduce((a,b) => a+b.costo, 0) + bonosDelProyecto;
    const horas     = rowsAgrupadas.reduce((a,b) => a+b.horas, 0);
    const mes = new Date().toLocaleDateString("es-MX",{month:"long",year:"numeric"});
    const cerradoEn = mes.charAt(0).toUpperCase()+mes.slice(1);
    const closedAt = Date.now();
    setProyectos(prev=>prev.map(x=>{
      if(x.id!==p.id) return x;
      const prevHist = Array.isArray(x.trabajadoresSnap)?x.trabajadoresSnap:[];
      const trabajadoresSnap = [...prevHist,...rowsAgrupadas];
      return {...x,activo:false,cerradoEn,gastoReal,horas,trabajadoresSnap,closedAt};
    }));
    onDataChanged();
  };

  // Reabrir: solo vuelve activo:true, limpia snapshot acumulado
  const reabrirProyecto = (p) => {
    setProyectos(prev=>prev.map(x=>x.id===p.id
      ? {...x,activo:true,cerradoEn:null,gastoReal:null,horas:null,trabajadoresSnap:null}
      : x
    ));
    onDataChanged();
  };

  // ── proyectos handlers
  const guardarProy = () => {
    if(!fproy.nombre.trim()) return;
    const presupuestoNum = Number(fproy.presupuesto)||0;
    if(presupuestoNum<=0){
      setErrPresupuesto("El presupuesto no puede ser $0");
      return;
    }
    const d={nombre:fproy.nombre.trim(),activo:fproy.activo,presupuesto:presupuestoNum};
    if(mproy==="nuevo") setProyectos(p=>[...p,{id:(typeof crypto!=="undefined"&&crypto.randomUUID?crypto.randomUUID():String(Date.now())),...d}]);
    else setProyectos(p=>p.map(x=>x.id===mproy?{...x,...d}:x));
    setMproy(null);
    setErrPresupuesto("");
    onDataChanged();
  };

  // ── empleados handlers
  const guardarEmp = () => {
    if(!femp.nombre.trim()) return;
    const tarifaNum = Number(femp.tarifa)||0;
    if(tarifaNum<=0){
      setErrTarifa("La tarifa no puede ser $0");
      return;
    }
    const d={nombre:femp.nombre.trim(),activo:femp.activo,tarifa:tarifaNum};
    if(memp==="nuevo") setEmpleados(e=>[...e,{id:(typeof crypto!=="undefined"&&crypto.randomUUID?crypto.randomUUID():String(Date.now())),...d}]);
    else setEmpleados(e=>e.map(x=>x.id===memp?{...x,...d}:x));
    setMemp(null);
    setErrTarifa("");
    onDataChanged();
  };

  // ── corrección
  const abrirCorr = eid => {
    const reg=registros.find(r=>r.eid===eid && r.fecha===hoy());
    const ids=reg?.items.map(x=>x.pid)||[];
    const hrs={};reg?.items.forEach(x=>{hrs[x.pid]=x.h;});
    setCSelec(ids);setCHoras(hrs);setMcorr(eid);
  };
  const guardarCorr = () => {
    const items = cSelec
      .map(id => ({pid:id, h:Number(cHoras[id])||0}))
      .filter(it => it.h > 0);
    setRegistros(prev => {
      const existe = prev.find(r => r.eid===mcorr && r.fecha===hoy());
      if(items.length === 0) {
        // Si no hay items, eliminar el registro si existía
        return existe ? prev.filter(r => !(r.eid===mcorr && r.fecha===hoy())) : prev;
      }
      if(existe)
        return prev.map(r => (r.eid===mcorr && r.fecha===hoy()) ? {...r, items} : r);
      return [...prev, {eid:mcorr, llenadorId:mcorr, fecha:hoy(), items}];
    });
    setMcorr(null);
    onDataChanged();
  };

  const guardarBono = () => {
    if(!fBono.eid || !fBono.pid) { setErrBono("Selecciona trabajador y proyecto"); return; }
    const montoNum = Number(fBono.monto)||0;
    if(montoNum <= 0) { setErrBono("El monto debe ser mayor a $0"); return; }
    const id = (typeof crypto!=="undefined"&&crypto.randomUUID?crypto.randomUUID():String(Date.now()));
    setBonos(prev => [{id, eid:fBono.eid, pid:fBono.pid, monto:montoNum, concepto:fBono.concepto.trim()||"Bono", fecha:hoy()}, ...prev]);
    setMBono(false);
    setFBono({eid:"", pid:"", monto:"", concepto:""});
    setErrBono("");
    onDataChanged();
  };

  const guardarHistorico = () => {
    if(!fHist.eid) { setErrHist("Selecciona un trabajador"); return; }
    if(!fHist.fecha) { setErrHist("Selecciona una fecha"); return; }
    if(fHist.fecha === hoy()) { setErrHist("Para registrar hoy usa el flujo normal de trabajadores"); return; }
    const items = fHist.selec
      .map(id => ({pid:id, h:Number(fHist.horas[id])||0}))
      .filter(it => it.h > 0);
    if(items.length === 0) { setErrHist("Agrega al menos un proyecto con horas"); return; }
    setRegistros(prev => {
      const existe = prev.find(r => r.eid===fHist.eid && r.fecha===fHist.fecha);
      if(existe) return prev.map(r => (r.eid===fHist.eid && r.fecha===fHist.fecha) ? {...r, items, llenadorId:fHist.eid} : r);
      return [...prev, {eid:fHist.eid, llenadorId:fHist.eid, fecha:fHist.fecha, items}];
    });
    setMHistorico(false);
    setFHist({eid:"", fecha:"", selec:[], horas:{}});
    setErrHist("");
    onDataChanged();
  };

  const eliminarBono = (id) => {
    setBonos(prev => prev.filter(b => b.id !== id));
    onDataChanged();
  };

  // ── cálculos
  const [vistaReporte,setVistaReporte] = useState("hoy");
  const hoyStr = hoy();
  const activos=empleados.filter(e=>e.activo);
  const pendientes=activos.filter(e=>!registros.find(r=>r.eid===e.id && r.fecha===hoyStr && r.items?.some(it=>(Number(it.h)||0)>0)));
  const proxies=registros.filter(r=>r.llenadorId!==r.eid && r.fecha===hoyStr && r.items?.some(it=>(Number(it.h)||0)>0));
  const registrosVista = vistaReporte === "hoy"
    ? registros.filter(r => r.fecha === hoyStr)
    : registros;

  const reporte=proyectos.filter(p=>p.activo).map(p=>{
    const rows=[];
    registrosVista.forEach(reg=>{
      reg.items.forEach(it=>{
        if(it.pid===p.id){
          const e=empleados.find(x=>x.id===reg.eid);
          if(e) rows.push({e,h:it.h,costo:it.h*e.tarifa,porTercero:reg.llenadorId!==reg.eid,llenador:empleados.find(x=>x.id===reg.llenadorId)});
        }
      });
    });
    const rowsFinales = vistaReporte === "acumulado"
      ? Object.values(rows.reduce((acc, row) => {
          const key = row.e.id;
          if(!acc[key]) acc[key] = {...row, h: 0, costo: 0};
          acc[key].h += row.h;
          acc[key].costo += row.costo;
          return acc;
        }, {}))
      : rows;
    const totalH=rowsFinales.reduce((a,b)=>a+b.h,0);
    const totalC=rowsFinales.reduce((a,b)=>a+b.costo,0);
    const bonosProyecto = (vistaReporte === "hoy"
      ? bonos.filter(b => b.pid === p.id && b.fecha === hoyStr)
      : bonos.filter(b => b.pid === p.id)
    ).reduce((a,b) => a + b.monto, 0);
    const totalCConBonos = totalC + bonosProyecto;
    const pct = p.presupuesto ? Math.round((totalCConBonos/p.presupuesto)*100) : 0;
    return{...p,rows:rowsFinales,totalH,totalC:totalCConBonos,pct,bonosProyecto};
  });

  const totalHorasDia=registrosVista.reduce((a,r)=>a+r.items.reduce((b,x)=>b+x.h,0),0);
  const totalCostoDia=registrosVista.reduce((a,r)=>{
    const e=empleados.find(x=>x.id===r.eid);
    return a+r.items.reduce((b,x)=>b+(x.h*(e?.tarifa||0)),0);
  },0);
  const proyectosActivosIds = new Set(proyectos.filter(p => p.activo).map(p => p.id));
  const totalBonosDia = (vistaReporte === "hoy"
    ? bonos.filter(b => b.fecha === hoyStr && proyectosActivosIds.has(b.pid))
    : bonos.filter(b => proyectosActivosIds.has(b.pid))
  ).reduce((a,b) => a + b.monto, 0);

  if(empHistorial) {
    const emp = empleados.find(e => e.id === empHistorial.id) || empHistorial;
    const hoy45 = new Date();
    const dias = Array.from({length:90}, (_,i) => {
      const d = new Date(hoy45);
      d.setDate(d.getDate() - i);
      const y = d.getFullYear();
      const m = String(d.getMonth()+1).padStart(2,'0');
      const day = String(d.getDate()).padStart(2,'0');
      return `${y}-${m}-${day}`;
    });
    const diasConRegistro = dias.map(fecha => {
      const reg = registros.find(r => r.eid === emp.id && r.fecha === fecha);
      const items = reg?.items?.filter(it => (Number(it.h)||0) > 0) || [];
      return { fecha, items };
    }).filter(d => d.items.length > 0);

    const formatFecha = f => {
      const [y,m,d] = f.split("-");
      const meses = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
      return `${Number(d)} ${meses[Number(m)-1]} ${y}`;
    };

    const totalHoras = diasConRegistro.reduce((a,d) => a + d.items.reduce((b,it) => b+(Number(it.h)||0), 0), 0);
    const totalCosto = diasConRegistro.reduce((a,d) => a + d.items.reduce((b,it) => b+(Number(it.h)||0)*emp.tarifa, 0), 0);
    const totalBonos90 = bonos.filter(b => b.eid === emp.id && dias.includes(b.fecha)).reduce((a,b) => a+b.monto, 0);

    return <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <button onClick={()=>setEmpHistorial(null)} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:20,padding:0}}>←</button>
        <div style={{flex:1}}>
          <div style={{fontSize:11,color:C.accent,fontWeight:700,letterSpacing:2,textTransform:"uppercase"}}>Historial</div>
          <div style={{fontSize:17,fontWeight:800,color:C.text}}>{emp.nombre}</div>
        </div>
        <div style={{width:36,height:36,borderRadius:"50%",background:C.accent+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,color:C.accent,fontWeight:900}}>{emp.nombre[0]}</div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
        <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:"12px 10px",textAlign:"center"}}>
          <div style={{fontSize:20,fontWeight:900,color:C.accent}}>{formatHoras(totalHoras)}</div>
          <div style={{fontSize:10,color:C.muted,marginTop:2}}>Horas totales (90 días)</div>
        </div>
        <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:"12px 10px",textAlign:"center"}}>
          <div style={{fontSize:20,fontWeight:900,color:C.accent}}>{$$(totalCosto + totalBonos90)}</div>
          <div style={{fontSize:10,color:C.muted,marginTop:2}}>Costo total (90 días)</div>
        </div>
        <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:"12px 10px",textAlign:"center"}}>
          <div style={{fontSize:20,fontWeight:900,color:C.accent}}>{$$(totalBonos90)}</div>
          <div style={{fontSize:10,color:C.muted,marginTop:2}}>Bonos (90 días)</div>
        </div>
      </div>

      {diasConRegistro.length === 0 && (
        <div style={{textAlign:"center",padding:"40px 0",color:C.muted,fontSize:13}}>Sin registros en los últimos 90 días.</div>
      )}

      {diasConRegistro.map(({fecha, items}) => {
        const totalDia = items.reduce((a,it) => a+(Number(it.h)||0), 0);
        const costoDia = totalDia * emp.tarifa;
        return <DiaHistorial key={fecha} fecha={formatFecha(fecha)} items={items} totalDia={totalDia} costoDia={costoDia} proyectos={proyectos} emp={emp}/>;
      })}
    </div>;
  }

  return <div style={{display:"flex",flexDirection:"column"}}>
    {/* topbar */}
    <div style={{background:C.surface,borderBottom:`1px solid ${C.border}`,padding:"13px 16px",display:"flex",alignItems:"center",gap:12,borderRadius:"12px 12px 0 0",margin:"-20px -20px 16px -20px"}}>
      <button onClick={onBack} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:20,padding:0}}>←</button>
      <div>
        <div style={{fontSize:11,color:C.accent,fontWeight:700,letterSpacing:2,textTransform:"uppercase"}}>Panel Admin</div>
        <div style={{fontSize:15,fontWeight:800,color:C.text}}>Dashboard</div>
      </div>
      {(pendientes.length>0||proxies.length>0)&&<div style={{marginLeft:"auto",display:"flex",flexDirection:"column",alignItems:"flex-end",gap:3}}>
        {pendientes.length>0&&<div style={{background:C.orange+"22",border:`1px solid ${C.orange}44`,borderRadius:20,padding:"3px 9px",fontSize:11,fontWeight:700,color:C.orange}}>⚠️ {pendientes.length} sin registrar</div>}
        {proxies.length>0&&<div style={{background:C.red+"22",border:`1px solid ${C.red}44`,borderRadius:20,padding:"3px 9px",fontSize:11,fontWeight:700,color:C.red}}>👤 {proxies.length} por tercero</div>}
      </div>}
    </div>

    {saveError && (
      <div style={{background:C.red+"22",border:`1px solid ${C.red}66`,borderRadius:8,padding:"8px 10px",fontSize:12,color:C.red,marginBottom:12,marginTop:-8}}>
        No se pudo guardar. Verifica tu conexión e intenta de nuevo
      </div>
    )}

    {/* tabs */}
    <div style={{display:"flex",gap:6,marginBottom:16}}>
      {[{id:"reporte",l:"📋 Reporte"},{id:"proyectos",l:"🏗️ Proyectos"},{id:"empleados",l:"👷 Empleados"},{id:"cierre",l:"📅 Cierre"}].map(t=>(
        <button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,padding:"8px 2px",background:tab===t.id?C.accent:C.surface,border:`1px solid ${tab===t.id?C.accent:C.border}`,borderRadius:8,color:tab===t.id?"#000":C.muted,fontWeight:tab===t.id?800:400,fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>{t.l}</button>
      ))}
    </div>

    {/* ── TAB REPORTE ── */}
    {tab==="reporte"&&<div style={{display:"flex",flexDirection:"column",gap:14}}>

      {/* alerta pendientes */}
      {pendientes.length>0&&<div style={{background:C.orange+"0f",border:`1px solid ${C.orange}44`,borderRadius:12,padding:"12px 14px"}}>
        <div style={{fontSize:12,fontWeight:800,color:C.orange,marginBottom:8}}>⚠️ NO REGISTRARON HOY</div>
        {pendientes.map(e=><div key={e.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
          <span style={{fontSize:13,color:C.muted}}>{e.nombre}</span>
          <button onClick={()=>abrirCorr(e.id)} style={{background:C.orange+"22",border:`1px solid ${C.orange}44`,borderRadius:6,padding:"4px 10px",color:C.orange,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>+ Registrar</button>
        </div>)}
      </div>}

      {/* alerta registros por tercero */}
      {proxies.length>0&&<div style={{background:C.red+"0f",border:`1px solid ${C.red}44`,borderRadius:12,padding:"12px 14px"}}>
        <div style={{fontSize:12,fontWeight:800,color:C.red,marginBottom:8}}>👤 REGISTROS POR TERCERO</div>
        {proxies.map(r=>{
          const emp=empleados.find(e=>e.id===r.eid);
          const llenador=empleados.find(e=>e.id===r.llenadorId);
          return <div key={r.eid} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5,fontSize:13}}>
            <div>
              <span style={{color:C.text,fontWeight:600}}>{emp?.nombre}</span>
              <span style={{color:C.muted}}> — llenado por </span>
              <span style={{color:C.red,fontWeight:600}}>{llenador?.nombre}</span>
            </div>
            <button onClick={()=>abrirCorr(r.eid)} style={{background:C.red+"22",border:`1px solid ${C.red}44`,borderRadius:6,padding:"4px 10px",color:C.red,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Revisar</button>
          </div>;
        })}
      </div>}

      {/* KPIs */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        {[
          {l:vistaReporte==="hoy"?"Horas registradas":"Total horas",v:formatHoras(totalHorasDia),c:C.accent},
          {l:vistaReporte==="hoy"?"Costo M.O. hoy":"Costo M.O. total",v:$$(totalCostoDia + totalBonosDia),c:C.accent},
          {l:"Proyectos activos",v:String(proyectos.filter(p=>p.activo).length),c:C.green},
          {l:"Sin registrar",v:String(pendientes.length),c:pendientes.length>0?C.orange:C.green},
        ].map(k=><div key={k.l} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:"12px 10px",textAlign:"center"}}>
          <div style={{fontSize:20,fontWeight:900,color:k.c}}>{k.v}</div>
          <div style={{fontSize:10,color:C.muted,marginTop:2,lineHeight:1.3}}>{k.l}</div>
        </div>)}
      </div>

      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:4,gap:8}}>
        <div style={{fontSize:11,color:C.muted,letterSpacing:2,textTransform:"uppercase",fontWeight:700}}>Desglose por proyecto</div>
        <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
          <Btn onClick={()=>{setFBono({eid:"",pid:"",monto:"",concepto:""});setErrBono("");setMBono(true);}} variant="ghost">+ Bono</Btn>
          <Btn onClick={()=>{setFHist({eid:"",fecha:"",selec:[],horas:{}});setErrHist("");setMHistorico(true);}} variant="ghost">+ Histórico</Btn>
          <div style={{width:190}}>
            <Toggle
              value={vistaReporte}
              onChange={setVistaReporte}
              opts={[{v:"hoy",l:"📅 Hoy"},{v:"acumulado",l:"📊 Acumulado"}]}
            />
          </div>
        </div>
      </div>

      {reporte.map(item=>{
        const over=item.pct>100,warn=item.pct>80&&!over;
        const col=over?C.red:warn?C.orange:C.green;
        return <div key={item.id} style={{background:C.surface,border:`1px solid ${over?C.red+"55":C.border}`,borderRadius:10,overflow:"hidden"}}>
          <div style={{padding:"10px 14px",borderBottom:`1px solid ${C.border}`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:700,color:C.text}}>{item.nombre}</div>
                <div style={{fontSize:11,color:C.muted,marginTop:2}}>{formatHoras(item.totalH)} · <span style={{color:C.accent}}>{$$(item.totalC)}</span> de <span style={{color:C.muted}}>{$$(item.presupuesto)}</span> presupuestados</div>
              </div>
              <Badge label={`${item.pct}%`} color={col}/>
            </div>
            <div style={{marginTop:8,height:5,background:C.border,borderRadius:3,overflow:"hidden"}}>
              <div style={{width:`${Math.min(item.pct,100)}%`,height:"100%",background:col,borderRadius:3,transition:"width 0.4s"}}/>
            </div>
          </div>
          {item.rows.length>0
            ?item.rows.map(({e,h,costo,porTercero,llenador})=><div key={e.id} style={{padding:"8px 14px",borderBottom:`1px solid ${C.border}`,background:porTercero?C.red+"08":"transparent"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <div style={{width:24,height:24,borderRadius:"50%",background:C.accent+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:C.accent,fontWeight:700,flexShrink:0}}>{e.nombre[0]}</div>
                  <div>
                    <div style={{fontSize:12,color:C.muted}}>{e.nombre}</div>
                    {porTercero&&<div style={{fontSize:10,color:C.red}}>👤 por {llenador?.nombre}</div>}
                  </div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:12,fontWeight:700,color:C.text}}>{formatHoras(h)}</div>
                  <div style={{fontSize:10,color:C.muted}}>{$$(costo)}</div>
                </div>
              </div>
            </div>)
            :<div style={{padding:"10px 14px",fontSize:12,color:C.muted,fontStyle:"italic"}}>
              Sin registros {vistaReporte === "hoy" ? "hoy" : "acumulados"}
            </div>
          }
          {(()=>{
            const bonosDelProy = (vistaReporte === "hoy"
              ? bonos.filter(b => b.pid === item.id && b.fecha === hoyStr)
              : bonos.filter(b => b.pid === item.id)
            );
            if(bonosDelProy.length === 0) return null;
            return bonosDelProy.map(b => {
              const empB = empleados.find(e => e.id === b.eid);
              return <div key={b.id} style={{padding:"8px 14px",borderBottom:`1px solid ${C.border}`,background:C.accent+"05",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <div style={{fontSize:11,color:C.accent,fontWeight:700}}>🎯 {b.concepto}</div>
                  <div style={{fontSize:11,color:C.muted}}>{empB?.nombre}</div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:12,fontWeight:700,color:C.accent}}>{$$(b.monto)}</span>
                  <button onClick={()=>eliminarBono(b.id)} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:12,padding:"2px 4px"}}>×</button>
                </div>
              </div>;
            });
          })()}
          <div style={{padding:"8px 14px",background:over?C.red+"11":C.accent+"08",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontSize:11,color:C.muted,fontWeight:700}}>{vistaReporte==="hoy"?"TOTAL HOY":"TOTAL ACUMULADO"}</span>
            <span style={{fontSize:13,fontWeight:900,color:col}}>{formatHoras(item.totalH)} <span style={{fontSize:11,color:C.muted,fontWeight:400}}>{$$(item.totalC)}</span></span>
          </div>
        </div>;
      })}

      {/* Correcciones */}
      {(()=>{
        const conRegistros = activos.filter(e=>registros.find(r=>r.eid===e.id && r.fecha===hoy() && r.items?.some(it=>(Number(it.h)||0)>0)));
        if(conRegistros.length===0) return null;
        return (
          <>
            <div style={{fontSize:11,color:C.muted,letterSpacing:2,textTransform:"uppercase",fontWeight:700,marginTop:4}}>Corregir registros</div>
            {conRegistros.map(e=>{
              const reg=registros.find(r=>r.eid===e.id && r.fecha===hoy());
              const porTercero=reg.llenadorId!==reg.eid;
              const llenador=empleados.find(x=>x.id===reg.llenadorId);
              return <div key={e.id} style={{background:porTercero?C.red+"08":C.surface,border:`1px solid ${porTercero?C.red+"44":C.border}`,borderRadius:10,padding:"10px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <div style={{fontSize:13,color:C.text,fontWeight:600}}>{e.nombre}</div>
                  {porTercero&&<div style={{fontSize:11,color:C.red,marginTop:2}}>👤 llenado por {llenador?.nombre}</div>}
                </div>
                <button onClick={()=>abrirCorr(e.id)} style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:8,padding:"6px 12px",color:C.muted,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>✏️ Editar</button>
              </div>;
            })}
          </>
        );
      })()}

      {/* Botón de exportar eliminado según requerimiento */}
      {mBono && <Sheet title="Registrar bono / pago extra" onClose={()=>setMBono(false)}>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div>
            <div style={{fontSize:12,color:C.muted,marginBottom:6}}>Trabajador</div>
            <select value={fBono.eid} onChange={e=>setFBono(f=>({...f,eid:e.target.value}))}
              style={{width:"100%",background:C.bg,border:`1px solid ${C.border}`,borderRadius:8,padding:"12px 14px",color:fBono.eid?C.text:C.muted,fontSize:14,outline:"none",fontFamily:"inherit"}}>
              <option value="">Seleccionar trabajador...</option>
              {empleados.filter(e=>e.activo).map(e=><option key={e.id} value={e.id}>{e.nombre}</option>)}
            </select>
          </div>
          <div>
            <div style={{fontSize:12,color:C.muted,marginBottom:6}}>Proyecto</div>
            <select value={fBono.pid} onChange={e=>setFBono(f=>({...f,pid:e.target.value}))}
              style={{width:"100%",background:C.bg,border:`1px solid ${C.border}`,borderRadius:8,padding:"12px 14px",color:fBono.pid?C.text:C.muted,fontSize:14,outline:"none",fontFamily:"inherit"}}>
              <option value="">Seleccionar proyecto...</option>
              {proyectos.filter(p=>p.activo).map(p=><option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </div>
          <Field label="Monto ($)" value={String(fBono.monto)} onChange={e=>setFBono(f=>({...f,monto:e.target.value}))} placeholder="Ej. 500" type="number"/>
          <Field label="Concepto (opcional)" value={fBono.concepto} onChange={e=>setFBono(f=>({...f,concepto:e.target.value}))} placeholder="Ej. Horas extra, bono fin de semana..."/>
          {errBono && <div style={{fontSize:12,color:C.red}}>{errBono}</div>}
          <div style={{display:"flex",gap:8}}>
            <Btn onClick={()=>setMBono(false)} variant="secondary" full>Cancelar</Btn>
            <Btn onClick={guardarBono} full>Guardar bono</Btn>
          </div>
        </div>
      </Sheet>}
      {mHistorico && <Sheet title="Registrar horas en fecha pasada" onClose={()=>setMHistorico(false)}>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div>
            <div style={{fontSize:12,color:C.muted,marginBottom:6}}>Trabajador</div>
            <select value={fHist.eid} onChange={e=>setFHist(f=>({...f,eid:e.target.value,selec:[],horas:{}}))}
              style={{width:"100%",background:C.bg,border:`1px solid ${C.border}`,borderRadius:8,padding:"12px 14px",color:fHist.eid?C.text:C.muted,fontSize:14,outline:"none",fontFamily:"inherit"}}>
              <option value="">Seleccionar trabajador...</option>
              {empleados.filter(e=>e.activo).map(e=><option key={e.id} value={e.id}>{e.nombre}</option>)}
            </select>
          </div>
          <div>
            <div style={{fontSize:12,color:C.muted,marginBottom:6}}>Fecha (últimos 90 días)</div>
            <input
              type="date"
              value={fHist.fecha}
              max={(()=>{const d=new Date();d.setDate(d.getDate()-1);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;})()}
              min={(()=>{const d=new Date();d.setDate(d.getDate()-90);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;})()}
              onChange={e=>setFHist(f=>({...f,fecha:e.target.value,selec:[],horas:{}}))}
              style={{width:"100%",background:C.bg,border:`1px solid ${C.border}`,borderRadius:8,padding:"12px 14px",color:fHist.fecha?C.text:C.muted,fontSize:14,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}
            />
          </div>
          {fHist.eid && fHist.fecha && (()=>{
            const regExistente = registros.find(r => r.eid===fHist.eid && r.fecha===fHist.fecha);
            if(regExistente && regExistente.items?.some(it=>(Number(it.h)||0)>0)) {
              return <div style={{background:C.orange+"11",border:`1px solid ${C.orange}44`,borderRadius:8,padding:"10px 12px",fontSize:12,color:C.orange}}>
                ⚠️ Ya existe un registro para ese día. Guardarlo lo sobreescribirá.
              </div>;
            }
            return null;
          })()}
          {fHist.eid && fHist.fecha && (
            <ProyectoSelector
              proyectos={proyectos}
              selec={fHist.selec}
              setSelec={s => setFHist(f=>({...f,selec:typeof s==="function"?s(f.selec):s}))}
              horas={fHist.horas}
              setHoras={h => setFHist(f=>({...f,horas:typeof h==="function"?h(f.horas):h}))}
            />
          )}
          {errHist && <div style={{fontSize:12,color:C.red}}>{errHist}</div>}
          <div style={{display:"flex",gap:8}}>
            <Btn onClick={()=>setMHistorico(false)} variant="secondary" full>Cancelar</Btn>
            <Btn onClick={guardarHistorico} full>Guardar</Btn>
          </div>
        </div>
      </Sheet>}
    </div>}

    {/* ── TAB PROYECTOS ── */}
    {tab==="proyectos"&&<div style={{display:"flex",flexDirection:"column",gap:10}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span style={{fontSize:11,color:C.muted,letterSpacing:2,textTransform:"uppercase",fontWeight:700}}>Proyectos ({proyectos.filter(p=>p.activo).length} activos)</span>
        <Btn onClick={()=>{setFproy({nombre:"",activo:true,presupuesto:""});setMproy("nuevo");}}>+ Agregar</Btn>
      </div>
      {proyectos.filter(p=>p.activo).map(p=><div key={p.id} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:"12px 14px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
          <div style={{flex:1}}>
            <div style={{fontSize:13,fontWeight:600,color:C.text}}>{p.nombre}</div>
            <div style={{fontSize:11,color:C.muted,marginTop:3}}>Presupuesto: <strong style={{color:C.accent}}>{$$(p.presupuesto)}</strong></div>
          </div>
          <div style={{display:"flex",gap:6,flexShrink:0}}>
            <button onClick={()=>{setFproy({nombre:p.nombre,activo:p.activo,presupuesto:p.presupuesto});setMproy(p.id);}} style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:8,padding:"6px 10px",color:C.muted,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>✏️</button>
            <button
              onClick={()=>{
                const tieneHoras = registros.some(reg =>
                  (reg.items||[]).some(it => it.pid===p.id && (Number(it.h)||0) > 0)
                );
                if(!tieneHoras) setConfirmCerrar(p);
                else cerrarProyecto(p);
              }}
              style={{background:C.orange+"11",border:`1px solid ${C.orange}44`,borderRadius:8,padding:"6px 10px",color:C.orange,fontSize:12,cursor:saving?"not-allowed":"pointer",opacity:saving?0.6:1,fontFamily:"inherit"}}
              disabled={saving}
            >
              🔒 Cerrar
            </button>
            <button onClick={()=>setDelProy(p)} style={{background:C.red+"11",border:`1px solid ${C.red}44`,borderRadius:8,padding:"6px 10px",color:C.red,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>🗑️</button>
          </div>
        </div>
      </div>)}

      {mproy&&<Sheet title={mproy==="nuevo"?"Nuevo proyecto":"Editar proyecto"} onClose={()=>{setMproy(null);setErrPresupuesto("");}}>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <Field label="Nombre del proyecto" value={fproy.nombre} onChange={e=>setFproy(f=>({...f,nombre:e.target.value}))} placeholder="Ej. Casa García - Lote 22"/>
          <Field label="Presupuesto de M.O. ($)" value={String(fproy.presupuesto)} onChange={e=>{setFproy(f=>({...f,presupuesto:e.target.value}));setErrPresupuesto("");}} placeholder="Ej. 25000" type="number"/>
          {errPresupuesto&&<div style={{fontSize:12,color:C.red,marginTop:4}}>{errPresupuesto}</div>}
          <div><div style={{fontSize:12,color:C.muted,marginBottom:8}}>Estatus</div>
            <Toggle value={fproy.activo} onChange={v=>setFproy(f=>({...f,activo:v}))} opts={[{v:true,l:"✅ Activo"},{v:false,l:"🔒 Cerrado"}]}/>
          </div>
          <div style={{display:"flex",gap:8}}>
            <Btn onClick={()=>setMproy(null)} variant="secondary" full>Cancelar</Btn>
            <Btn onClick={guardarProy} full disabled={saving}>
              {saving ? "Guardando..." : (mproy==="nuevo"?"Agregar":"Guardar")}
            </Btn>
          </div>
        </div>
      </Sheet>}
      {delProy&&<Confirm msg={`¿Mover "${delProy.nombre}" a la papelera? Tendrás 90 días para recuperarlo.`} okLabel="Mover a papelera" onOk={()=>moverAPapelera(delProy)} onCancel={()=>setDelProy(null)}/>}

      {/* ── PAPELERA ── */}
      {papeleraVigente.length>0&&<>
        <div style={{display:"flex",alignItems:"center",gap:8,marginTop:6}}>
          <span style={{fontSize:11,color:C.red,letterSpacing:2,textTransform:"uppercase",fontWeight:700}}>🗑️ Papelera ({papeleraVigente.length})</span>
          <span style={{fontSize:11,color:C.muted}}>— se borran a los 90 días</span>
        </div>
        {papeleraVigente.map(item=>{
          const diasRestantes = Math.max(0, DIAS - Math.floor((ahora - item.deletedAt)/864e5));
          const urgente = diasRestantes<=7;
          const totalH  = (item.registrosSnap||[]).reduce((a,r)=>a+r.items.filter(x=>x.pid===item.id).reduce((b,x)=>b+x.h,0),0);
          return <div key={item.id} style={{background:C.surface,border:`1px solid ${urgente?C.red+"55":C.border}`,borderRadius:10,padding:"12px 14px",opacity:0.9}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:600,color:C.text}}>{item.nombre}</div>
              <div style={{fontSize:11,color:C.muted,marginTop:3}}>Presupuesto: {$$(item.presupuesto)} · {formatHoras(totalH)} registradas</div>
                <div style={{marginTop:4}}>
                  <span style={{background:urgente?C.red+"22":C.orange+"22",color:urgente?C.red:C.orange,border:`1px solid ${urgente?C.red+"44":C.orange+"44"}`,borderRadius:4,padding:"2px 8px",fontSize:11,fontWeight:700}}>
                    {urgente?"⚠️ ":"⏳ "}{diasRestantes} días restantes
                  </span>
                </div>
              </div>
              <div style={{display:"flex",gap:8,flexShrink:0}}>
                <button
                  onClick={()=>restaurar(item)}
                  style={{background:C.green+"11",border:`1px solid ${C.green}44`,borderRadius:8,padding:"6px 12px",color:C.green,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}
                >
                  ↩️ Restaurar
                </button>
                <button
                  onClick={()=>setDelPerm1(item)}
                  style={{background:C.red+"11",border:`1px solid ${C.red}44`,borderRadius:8,padding:"6px 12px",color:C.red,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}
                >
                  🗑️ Borrar
                </button>
              </div>
            </div>
          </div>;
        })}
      </>}
      {delPerm1&&<Confirm
        msg={`¿Borrar permanentemente "${delPerm1.nombre}" de la papelera?`}
        onOk={()=>{setDelPerm2(delPerm1);setDelPerm1(null);}}
        onCancel={()=>setDelPerm1(null)}
      />}
      {delPerm2&&<Confirm
        msg={`Esta acción es IRREVERSIBLE.\nSe eliminará "${delPerm2.nombre}" y sus registros asociados.`}
        onOk={()=>{
          setBonos(prev=>prev.filter(b=>b.pid!==delPerm2.id));
          setPapelera(prev=>prev.filter(x=>x.id!==delPerm2.id));
          setDelPerm2(null);
          onDataChanged();
        }}
        onCancel={()=>setDelPerm2(null)}
      />}
      {confirmCerrar&&<Confirm
        msg={`Este proyecto no tiene horas registradas. ¿Seguro que quieres cerrarlo?`}
        okLabel="Cerrar"
        onOk={()=>{cerrarProyecto(confirmCerrar);setConfirmCerrar(null);}}
        onCancel={()=>setConfirmCerrar(null)}
      />}
    </div>}

    {/* ── TAB EMPLEADOS ── */}
    {tab==="empleados"&&<div style={{display:"flex",flexDirection:"column",gap:10}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span style={{fontSize:11,color:C.muted,letterSpacing:2,textTransform:"uppercase",fontWeight:700}}>Empleados ({empleados.filter(e=>e.activo).length} activos)</span>
        <Btn onClick={()=>{setFemp({nombre:"",activo:true,tarifa:""});setMemp("nuevo");}}>+ Agregar</Btn>
      </div>
      {empleados.map(e=>{
        const reg=registros.find(r=>r.eid===e.id && r.fecha===hoy() && r.items?.some(it=>(Number(it.h)||0)>0));
        const hDia=reg?reg.items.reduce((a,x)=>a+x.h,0):0;
        const porTercero=reg&&reg.llenadorId!==reg.eid;
        const llenador=porTercero?empleados.find(x=>x.id===reg.llenadorId):null;
        return <div key={e.id} onClick={()=>setEmpHistorial(e)} style={{background:C.surface,border:`1px solid ${porTercero?C.red+"44":C.border}`,borderRadius:10,padding:"12px 14px",opacity:e.activo?1:0.55,cursor:"pointer"}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:36,height:36,borderRadius:"50%",flexShrink:0,background:e.activo?C.accent+"22":C.border,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,color:e.activo?C.accent:C.muted,fontWeight:900}}>{e.nombre[0]}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:13,fontWeight:600,color:C.text}}>{e.nombre}</div>
              <div style={{display:"flex",alignItems:"center",gap:5,marginTop:3,flexWrap:"wrap"}}>
                <Badge label={e.activo?"Activo":"Inactivo"} color={e.activo?C.green:C.muted}/>
                <span style={{fontSize:11,color:C.muted}}>{$$(e.tarifa)}/h</span>
                {e.activo&&reg&&<span style={{fontSize:11,color:C.muted}}>· {formatHoras(hDia)} hoy</span>}
                {porTercero&&<Badge label={`👤 por ${llenador?.nombre}`} color={C.red}/>}
              </div>
            </div>
            <div style={{display:"flex",gap:6,flexShrink:0}}>
              <button onClick={ev=>{ev.stopPropagation();setFemp({nombre:e.nombre,activo:e.activo,tarifa:e.tarifa});setMemp(e.id);}} style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:8,padding:"6px 10px",color:C.muted,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>✏️</button>
              <button onClick={ev=>{ev.stopPropagation();setDelEmp(e);}} style={{background:C.red+"11",border:`1px solid ${C.red}44`,borderRadius:8,padding:"6px 10px",color:C.red,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>🗑️</button>
            </div>
          </div>
        </div>;
      })}

      {memp&&<Sheet title={memp==="nuevo"?"Nuevo empleado":"Editar empleado"} onClose={()=>{setMemp(null);setErrTarifa("");}}>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <Field label="Nombre completo" value={femp.nombre} onChange={e=>setFemp(f=>({...f,nombre:e.target.value}))} placeholder="Ej. Juan Martínez"/>
          <Field label="Costo por hora ($)" value={String(femp.tarifa)} onChange={e=>{setFemp(f=>({...f,tarifa:e.target.value}));setErrTarifa("");}} placeholder="Ej. 85" type="number"/>
          {errTarifa&&<div style={{fontSize:12,color:C.red,marginTop:4}}>{errTarifa}</div>}
          <div><div style={{fontSize:12,color:C.muted,marginBottom:8}}>Estatus</div>
            <Toggle value={femp.activo} onChange={v=>setFemp(f=>({...f,activo:v}))} opts={[{v:true,l:"✅ Activo"},{v:false,l:"⛔ Inactivo"}]}/>
          </div>
          <div style={{display:"flex",gap:8}}>
            <Btn onClick={()=>setMemp(null)} variant="secondary" full>Cancelar</Btn>
            <Btn onClick={guardarEmp} full disabled={saving}>
              {saving ? "Guardando..." : (memp==="nuevo"?"Agregar":"Guardar")}
            </Btn>
          </div>
        </div>
      </Sheet>}
      {delEmp&&<Confirm
        msg={`¿Eliminar a "${delEmp.nombre}"? Se borrarán todos sus registros históricos.`}
        onOk={()=>eliminarEmpleadoConRegistros(delEmp)}
        onCancel={()=>setDelEmp(null)}
      />}
    </div>}

    {/* ── TAB CIERRE MENSUAL ── */}
    {tab==="cierre"&&(()=>{
      const DIAS_CIERRE = 180;
      const ahoraCierre = Date.now();
      const cerradosRaw = proyectos.filter(p=>!p.activo);
      const cerrados = cerradosRaw.filter(p=>{
        if(!p.closedAt) return true;
        return (ahoraCierre - p.closedAt) < DIAS_CIERRE * 864e5;
      });
      return <div style={{display:"flex",flexDirection:"column",gap:14}}>
        <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:"12px 14px"}}>
          <div style={{fontSize:12,color:C.muted,lineHeight:1.6}}>
            Proyectos cerrados con su <strong style={{color:C.text}}>gasto real</strong> vs <strong style={{color:C.text}}>presupuesto</strong>. Para cerrar un proyecto ve a 🏗️ Proyectos.
          </div>
        </div>

        {cerrados.length===0&&<div style={{textAlign:"center",padding:"40px 0",color:C.muted,fontSize:13}}>Aún no hay proyectos cerrados.</div>}

        {cerrados.map(item=>{
          const gasto = item.gastoReal||0;
          const pct   = item.presupuesto ? Math.round((gasto/item.presupuesto)*100) : 0;
          const over  = pct>100;
          const col   = over?C.red:pct>=95?C.accent:C.green;
          const diff  = gasto - item.presupuesto;
          const diasRestantes = item.closedAt
            ? Math.max(0, DIAS_CIERRE - Math.floor((ahoraCierre - item.closedAt)/864e5))
            : null;
          return <div key={item.id} style={{background:C.surface,border:`1px solid ${over?C.red+"44":C.border}`,borderRadius:12,overflow:"hidden"}}>
            <div style={{padding:"12px 14px",borderBottom:`1px solid ${C.border}`,background:over?C.red+"08":"transparent"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:700,color:C.text}}>{item.nombre}</div>
                  <div style={{fontSize:11,color:C.muted,marginTop:3}}>
                    {item.cerradoEn?"Cerrado: "+item.cerradoEn+" · ":""}
                    {item.horas ? formatHoras(item.horas)+" trabajadas" : "Sin registros"}
                    {typeof diasRestantes==="number" && (
                      <span>{` · ${diasRestantes} días restantes`}</span>
                    )}
                  </div>
                </div>
                <span style={{background:col+"22",color:col,border:`1px solid ${col}44`,borderRadius:4,padding:"2px 8px",fontSize:11,fontWeight:700,whiteSpace:"nowrap"}}>{pct}%</span>
              </div>
              <div style={{marginTop:8,height:5,background:C.border,borderRadius:3,overflow:"hidden"}}>
                <div style={{width:`${Math.min(pct,100)}%`,height:"100%",background:col,borderRadius:3}}/>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr"}}>
              <div style={{padding:"10px 14px",borderRight:`1px solid ${C.border}`}}>
                <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:1,marginBottom:3}}>Presupuesto</div>
                <div style={{fontSize:16,fontWeight:800,color:C.text}}>{$$(item.presupuesto)}</div>
              </div>
              <div style={{padding:"10px 14px"}}>
                <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:1,marginBottom:3}}>Gasto real</div>
                <div style={{fontSize:16,fontWeight:800,color:over?C.red:C.green}}>{$$(gasto)}</div>
              </div>
            </div>
            {Array.isArray(item.trabajadoresSnap) && item.trabajadoresSnap.length>0 && (
              <div style={{borderTop:`1px solid ${C.border}`,padding:"8px 14px"}}>
                <div style={{fontSize:11,color:C.muted,letterSpacing:1,textTransform:"uppercase",fontWeight:700,marginBottom:6}}>
                  Desglose por trabajador
                </div>
                {item.trabajadoresSnap.map((row,idx)=>(
                  <div key={idx} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"4px 0",borderBottom:`1px solid ${C.border}`}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <div style={{width:24,height:24,borderRadius:"50%",background:C.accent+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:C.accent,fontWeight:700,flexShrink:0}}>
                        {row.nombre?.[0]||"?"}
                      </div>
                      <div>
                        <div style={{fontSize:12,color:C.muted}}>{row.nombre}</div>
                        {row.porTercero && row.llenador && (
                          <div style={{fontSize:10,color:C.red}}>👤 por {row.llenador}</div>
                        )}
                      </div>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <div style={{fontSize:12,fontWeight:700,color:C.text}}>{formatHoras(row.horas)}</div>
                      <div style={{fontSize:10,color:C.muted}}>{$$(row.costo)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {(()=>{
              const bonosCierre = bonos.filter(b => b.pid === item.id);
              if(bonosCierre.length === 0) return null;
              return <div style={{borderTop:`1px solid ${C.border}`,padding:"8px 14px"}}>
                <div style={{fontSize:11,color:C.accent,fontWeight:700,letterSpacing:1,textTransform:"uppercase",marginBottom:4}}>Bonos</div>
                {bonosCierre.map(b => {
                  const empB = empleados.find(e => e.id === b.eid);
                  return <div key={b.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"4px 0",borderBottom:`1px solid ${C.border}`}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <div style={{width:24,height:24,borderRadius:"50%",background:C.accent+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:C.accent,fontWeight:700,flexShrink:0}}>🎯</div>
                      <div>
                        <div style={{fontSize:12,color:C.muted}}>{b.concepto}</div>
                        <div style={{fontSize:11,color:C.muted}}>{empB?.nombre}</div>
                      </div>
                    </div>
                    <div style={{fontSize:12,fontWeight:700,color:C.accent}}>{$$(b.monto)}</div>
                  </div>;
                })}
              </div>;
            })()}
            <div style={{padding:"8px 14px",borderTop:`1px solid ${C.border}`,background:over?C.red+"08":C.green+"08",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <span style={{fontSize:11,color:C.muted,fontWeight:700}}>{over?"SOBRECOSTO":"AHORRO"} </span>
                <span style={{fontSize:13,fontWeight:900,color:over?C.red:C.green}}>{over?"+":"-"}{$$(Math.abs(diff))}</span>
              </div>
              <button onClick={()=>setConfirmReabrir(item)} style={{background:C.green+"11",border:`1px solid ${C.green}44`,borderRadius:6,padding:"5px 12px",color:C.green,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>🔓 Reabrir</button>
            </div>
          </div>;
        })}

        {cerrados.length>0&&<div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:"14px"}}>
          <div style={{fontSize:11,color:C.accent,fontWeight:700,letterSpacing:2,textTransform:"uppercase",marginBottom:12}}>Resumen histórico</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
            {(()=>{
              const totalP = cerrados.reduce((a,b)=>a+b.presupuesto,0);
              const totalG = cerrados.reduce((a,b)=>a+(b.gastoReal||0),0);
              const totalH = cerrados.reduce((a,b)=>a+(b.horas||0),0);
              const over   = totalG>totalP;
              return [
                {l:"Proyectos",v:String(cerrados.length),c:C.accent},
                {l:"Horas totales",v:formatHoras(totalH),c:C.text},
                {l:"Desviación",v:(over?"+":"-")+$$(Math.abs(totalG-totalP)),c:over?C.red:C.green},
              ].map(k=><div key={k.l} style={{textAlign:"center"}}>
                <div style={{fontSize:16,fontWeight:900,color:k.c}}>{k.v}</div>
                <div style={{fontSize:10,color:C.muted,marginTop:2}}>{k.l}</div>
              </div>);
            })()}
          </div>
        </div>}
        {confirmReabrir && <Confirm
          msg={`¿Reabrir "${confirmReabrir.nombre}"? Se perderá el resumen de gasto guardado.`}
          okLabel="Reabrir"
          onOk={() => { reabrirProyecto(confirmReabrir); setConfirmReabrir(null); }}
          onCancel={() => setConfirmReabrir(null)}
        />}
      </div>;
    })()}

    {/* Modal corrección admin */}
    {mcorr&&<Sheet title={`Corregir — ${empleados.find(e=>e.id===mcorr)?.nombre}`} onClose={()=>setMcorr(null)}>
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        <ProyectoSelector proyectos={proyectos} selec={cSelec} setSelec={setCSelec} horas={cHoras} setHoras={setCHoras} extraVisibleIds={cSelec}/>
        <div style={{display:"flex",gap:8,marginTop:4}}>
          <Btn onClick={()=>setMcorr(null)} variant="secondary" full>Cancelar</Btn>
          <Btn onClick={guardarCorr} full disabled={saving}>
            {saving ? "Guardando..." : cSelec.length > 0 ? "Guardar" : "Limpiar registro"}
          </Btn>
        </div>
      </div>
    </Sheet>}
  </div>;
}

// ── HELPERS SUPABASE (mapeo DB ↔ app) ─────────────────────────
function fromDbProyecto(r){ return r?{ id:r.id,nombre:r.nombre,activo:r.activo,presupuesto:r.presupuesto,cerradoEn:r.cerrado_en,gastoReal:r.gasto_real,horas:r.horas,closedAt:r.closed_at?new Date(r.closed_at).getTime():null,trabajadoresSnap:r.trabajadores_snap||null }:null; }
function toDbProyecto(p){ return { id:p.id,nombre:p.nombre,activo:p.activo,presupuesto:p.presupuesto,cerrado_en:p.cerradoEn||null,gasto_real:p.gastoReal??null,horas:p.horas??null,closed_at:p.closedAt?new Date(p.closedAt).toISOString():null,trabajadores_snap:p.trabajadoresSnap||null }; }
function fromDbRegistro(r){
  return r ? { eid:r.eid, llenadorId:r.llenador_id, items:r.items||[], fecha:r.fecha } : null;
}

// ── ROOT ──────────────────────────────────────────────────────
export default function App(){
  const [screen,setScreen]=useState("home");
  const [authed,setAuthed]=useState(false);
  const [loading,setLoading]=useState(!!supabase);
  const [proyectos,setProyectos]=useState([]);
  const [empleados,setEmpleados]=useState([]);
  const [registros,setRegistros]=useState([]);
  const [papelera,setPapelera]=useState([]);
  const [bonos, setBonos] = useState([]);
  const [saving,setSaving]=useState(false);
  const [saveError,setSaveError]=useState("");
  const [fechaActual, setFechaActual] = useState(hoy());

  const isFirstSync = useRef(true);
  const isSyncing = useRef(false);
  const stateForSync = useRef({ proyectos:[], empleados:[], registros:[], papelera:[], bonos:[] });
  const needsSync = useRef(false);
  const [syncTrigger, setSyncTrigger] = useState(0);

  useEffect(() => {
    const intervalo = setInterval(() => {
      const nueva = hoy();
      if(nueva !== fechaActual) setFechaActual(nueva);
    }, 60000);
    return () => clearInterval(intervalo);
  }, [fechaActual]);

  useEffect(() => {
    stateForSync.current = { proyectos, empleados, registros, papelera, bonos };
  }, [proyectos, empleados, registros, papelera, bonos]);

  // Cargar datos desde Supabase al montar
  useEffect(()=>{
    if(!supabase){ setLoading(false); return; }
    (async ()=>{
      try {
        const [pr,em,re,pa,bo]=await Promise.all([
          supabase.from("proyectos").select("*").order("nombre"),
          supabase.from("empleados").select("*").order("nombre"),
          supabase.from("registros").select("*"),
          supabase.from("papelera").select("*").order("deleted_at",{ascending:false}),
          supabase.from("bonos").select("*").order("fecha",{ascending:false}),
        ]);
        if(pr.data?.length) setProyectos(pr.data.map(fromDbProyecto).filter(Boolean));
        if(em.data?.length) setEmpleados(em.data.map(r=>({id:r.id,nombre:r.nombre,activo:r.activo,tarifa:r.tarifa})));
        if(re.data?.length) setRegistros(re.data.map(fromDbRegistro).filter(Boolean));
        if(pa.data?.length) setPapelera(pa.data.map(r=>{ const s=r.snapshot||{}; const p=s.proyecto||{}; return { id:p.id||r.proyecto_id,nombre:p.nombre,activo:p.activo,presupuesto:p.presupuesto,deletedAt:new Date(r.deleted_at).getTime(),registrosSnap:s.registrosSnap||[] }; }));
        if(bo.data?.length) setBonos(bo.data.map(r=>({id:r.id,eid:r.eid,pid:r.pid,monto:r.monto,concepto:r.concepto,fecha:r.fecha})));
      } catch(e){ console.warn("Error cargando Supabase",e); }
      setLoading(false);
    })();

    const canal = supabase.channel("cambios")
      .on("postgres_changes", { event: "*", schema: "public", table: "registros" },
        payload => {
          if(payload.eventType === "DELETE") {
            setRegistros(prev => prev.filter(r => !(r.eid === payload.old.eid && r.fecha === payload.old.fecha)));
          } else {
            const nuevo = fromDbRegistro(payload.new);
            if(!nuevo) return;
            setRegistros(prev => {
              const existe = prev.find(r => r.eid === nuevo.eid && r.fecha === nuevo.fecha);
              if(existe) return prev.map(r => (r.eid === nuevo.eid && r.fecha === nuevo.fecha) ? nuevo : r);
              return [...prev, nuevo];
            });
          }
        }
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "proyectos" },
        payload => {
          if(payload.eventType === "DELETE") {
            setProyectos(prev => prev.filter(p => p.id !== payload.old.id));
          } else {
            const nuevo = fromDbProyecto(payload.new);
            if(!nuevo) return;
            setProyectos(prev => {
              const existe = prev.find(p => p.id === nuevo.id);
              if(existe) return prev.map(p => p.id === nuevo.id ? nuevo : p);
              return [...prev, nuevo];
            });
          }
        }
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "empleados" },
        payload => {
          if(payload.eventType === "DELETE") {
            setEmpleados(prev => prev.filter(e => e.id !== payload.old.id));
          } else {
            const nuevo = payload.new;
            const emp = { id: nuevo.id, nombre: nuevo.nombre, activo: nuevo.activo, tarifa: nuevo.tarifa };
            setEmpleados(prev => {
              const existe = prev.find(e => e.id === emp.id);
              if(existe) return prev.map(e => e.id === emp.id ? emp : e);
              return [...prev, emp];
            });
          }
        }
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "bonos" },
        payload => {
          if(payload.eventType === "DELETE") {
            setBonos(prev => prev.filter(b => b.id !== payload.old.id));
          } else {
            const n = payload.new;
            const bono = {id:n.id,eid:n.eid,pid:n.pid,monto:n.monto,concepto:n.concepto,fecha:n.fecha};
            setBonos(prev => {
              const existe = prev.find(b => b.id === bono.id);
              if(existe) return prev.map(b => b.id === bono.id ? bono : b);
              return [bono, ...prev];
            });
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(canal); };
  },[]);

  // Persistir a Supabase cuando cambie el estado
  useEffect(()=>{
    if(!supabase||loading) return;
    (async ()=>{
      if(isFirstSync.current){
        isFirstSync.current = false;
        setSaving(false);
        return;
      }
      if(isSyncing.current) {
        needsSync.current = true;
        return;
      }
      isSyncing.current = true;
      needsSync.current = false;
      const { proyectos, empleados, registros, papelera, bonos } = stateForSync.current;
      setSaving(true);
      setSaveError("");
      try {
        await supabase.from("proyectos").upsert(proyectos.map(toDbProyecto),{onConflict:"id"});
        const { data: proyExist } = await supabase.from("proyectos").select("id");
        const proyIds = new Set(proyectos.map(p => p.id));
        for(const row of proyExist || []) {
          if(!proyIds.has(row.id)) await supabase.from("proyectos").delete().eq("id", row.id);
        }
        await supabase.from("empleados").upsert(empleados.map(e=>({id:e.id,nombre:e.nombre,activo:e.activo,tarifa:e.tarifa})),{onConflict:"id"});
        const { data: empExist } = await supabase.from("empleados").select("id");
        const empIds = new Set(empleados.map(e => e.id));
        for(const row of empExist || []) {
          if(!empIds.has(row.id)) await supabase.from("empleados").delete().eq("id", row.id);
        }
        // Eliminar registros históricos de empleados que ya no existen
        const { data: todosLosRegs } = await supabase.from("registros").select("eid");
        const empIdsActuales = new Set(empleados.map(e => e.id));
        for(const row of todosLosRegs || []) {
          if(!empIdsActuales.has(row.eid)) {
            await supabase.from("registros").delete().eq("eid", row.eid);
          }
        }
        if(registros.length > 0) {
          await supabase.from("registros").upsert(
            registros.map(r => ({eid:r.eid, llenador_id:r.llenadorId, fecha:r.fecha, items:r.items})),
            {onConflict:"eid,fecha"}
          );
        }
        const { data: todosRegExist } = await supabase.from("registros").select("eid,fecha");
        const regKeysEnState = new Set(registros.map(r => `${r.eid}__${r.fecha}`));
        for(const row of todosRegExist || []) {
          if(!regKeysEnState.has(`${row.eid}__${row.fecha}`)) {
            await supabase.from("registros").delete().eq("eid", row.eid).eq("fecha", row.fecha);
          }
        }
        if(papelera.length===0){
          const { data: paAll }=await supabase.from("papelera").select("id");
          for(const row of paAll||[]) await supabase.from("papelera").delete().eq("id",row.id);
        } else {
          const paRows=papelera.map(x=>({ proyecto_id:x.id, snapshot:{ proyecto:{ id:x.id,nombre:x.nombre,activo:x.activo,presupuesto:x.presupuesto }, registrosSnap:x.registrosSnap||[] }, deleted_at:new Date(x.deletedAt).toISOString() }));
          await supabase.from("papelera").upsert(paRows,{onConflict:"proyecto_id"});
          const { data: paExist }=await supabase.from("papelera").select("id,proyecto_id");
          const idsInState=new Set(papelera.map(x=>x.id));
          for(const row of paExist||[]){ if(!idsInState.has(row.proyecto_id)) await supabase.from("papelera").delete().eq("id",row.id); }
        }
        await supabase.from("bonos").upsert(
          bonos.map(b => ({id:b.id, eid:b.eid, pid:b.pid, monto:b.monto, concepto:b.concepto, fecha:b.fecha})),
          {onConflict:"id"}
        );
        const { data: bonosExist } = await supabase.from("bonos").select("id");
        const bonosIds = new Set(bonos.map(b => b.id));
        for(const row of bonosExist || []) {
          if(!bonosIds.has(row.id)) await supabase.from("bonos").delete().eq("id", row.id);
        }
      } catch(e){
        console.warn("Error guardando en Supabase",e);
        setSaveError("No se pudo guardar. Verifica tu conexión e intenta de nuevo");
      } finally {
        isSyncing.current = false;
        setSaving(false);
        if(needsSync.current) {
          needsSync.current = false;
          setSyncTrigger(t => t + 1);
        }
      }
    })();
  },[syncTrigger,loading]);

  const guardarRegistro=(eid,llenadorId,items)=>{
    setRegistros(prev=>{
      const hoyStr = hoy();
      if(items.length === 0) {
        return prev.filter(r => !(r.eid===eid && r.fecha===hoyStr));
      }
      if(prev.find(r=>r.eid===eid && r.fecha===hoyStr))
        return prev.map(r=> (r.eid===eid && r.fecha===hoyStr)?{...r,llenadorId,items}:r);
      return [...prev,{eid,llenadorId,items,fecha:hoyStr}];
    });
    setSyncTrigger(t => t + 1);
  };

  const ir=role=>{
    if(role==="admin"){setAuthed(false);setScreen("pin");}
    else setScreen(role);
  };

  const pendientes=empleados.filter(e=>e.activo&&!registros.find(r=>r.eid===e.id && r.fecha===hoy() && r.items?.some(it=>(Number(it.h)||0)>0)));
  const proxies=registros.filter(r=>r.llenadorId!==r.eid && r.fecha===hoy() && r.items?.some(it=>(Number(it.h)||0)>0));

  if(loading) return <div style={{minHeight:"100vh",background:"#070707",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'DM Sans','Segoe UI',sans-serif",color:"#777"}}><div>Cargando...</div></div>;

  return <div style={{minHeight:"100vh",background:"#070707",display:"flex",alignItems:"center",justifyContent:"center",padding:"20px 20px 80px",fontFamily:"'DM Sans','Segoe UI',sans-serif"}}>
    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet"/>

    <div style={{position:"relative"}}>
      <div style={{width:390,background:"#0F0F0F",borderRadius:44,border:"1px solid #2A2A2A",boxShadow:"0 50px 100px #000b, 0 0 0 1px #ffffff06 inset",overflow:"hidden"}}>
        {/* notch */}
        <div style={{background:"#1A1A1A",height:46,display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"1px solid #2A2A2A",padding:"0 20px"}}>
          <div style={{width:50}}/>
          <div style={{width:110,height:10,background:"#000",borderRadius:10}}/>
          <div style={{display:"flex",gap:4,alignItems:"center"}}>
            {pendientes.length>0&&<div style={{background:"#F9731622",border:"1px solid #F9731655",borderRadius:10,padding:"2px 7px",fontSize:10,fontWeight:800,color:"#F97316"}}>⚠️{pendientes.length}</div>}
            {proxies.length>0&&<div style={{background:"#EF444422",border:"1px solid #EF444455",borderRadius:10,padding:"2px 7px",fontSize:10,fontWeight:800,color:"#EF4444"}}>👤{proxies.length}</div>}
          </div>
        </div>

        <div style={{padding:20,minHeight:580,maxHeight:700,overflowY:"auto"}}>
          {screen==="home"&&<PantallaInicio onSelect={ir}/>}
          {screen==="worker"&&<PantallaTrabajador proyectos={proyectos} empleados={empleados} registros={registros} onGuardar={guardarRegistro} onBack={()=>setScreen("home")} saving={saving} saveError={saveError}/>}
          {screen==="pin"&&<PantallaPIN onSuccess={()=>{setAuthed(true);setScreen("admin");}} onBack={()=>setScreen("home")}/>}
          {screen==="admin"&&authed&&<PantallaAdmin proyectos={proyectos} setProyectos={setProyectos} empleados={empleados} setEmpleados={setEmpleados} registros={registros} setRegistros={setRegistros} papelera={papelera} setPapelera={setPapelera} bonos={bonos} setBonos={setBonos} onBack={()=>{setAuthed(false);setScreen("home");}} saving={saving} saveError={saveError} onDataChanged={() => setSyncTrigger(t => t+1)}/>}
        </div>

        <div style={{height:22,background:"#1A1A1A",borderTop:"1px solid #2A2A2A",display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{width:90,height:4,background:"#2A2A2A",borderRadius:4}}/>
        </div>
      </div>
    </div>

    <div style={{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",display:"flex",gap:8,background:"#1A1A1A",border:"1px solid #2A2A2A",borderRadius:30,padding:"8px 12px",zIndex:100}}>
      <Pill active={screen==="home"} onClick={()=>setScreen("home")}>🏠 Inicio</Pill>
      <Pill active={screen==="worker"} onClick={()=>setScreen("worker")}>👷 Trabajador</Pill>
      <Pill active={screen==="admin"||screen==="pin"} onClick={()=>ir("admin")}>📊 Admin</Pill>
    </div>
  </div>;
}
