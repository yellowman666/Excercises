import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createClient } from '@supabase/supabase-js';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { Activity, Search, Plus, Dumbbell, CalendarDays, ChartNoAxesCombined, History, LogIn, LogOut, Trash2, Copy, Filter, Footprints } from 'lucide-react';
import './style.css';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

const library = [
  ['Chest Press Machine','Chest','Machine'],['Incline Chest Press Machine','Chest','Machine'],['Decline Chest Press Machine','Chest','Machine'],['Pectoral Fly (Pec Deck)','Chest','Machine'],['Cable Chest Fly','Chest','Cable'],['Incline Dumbbell Press','Chest','Dumbbell'],['Flat Barbell Bench Press','Chest','Barbell'],['Push-Up','Chest','Bodyweight'],
  ['Lat Pulldown','Back','Cable'],['Seated Cable Row','Back','Cable'],['Chest-Supported Row','Back','Machine'],['Machine Row','Back','Machine'],['One-Arm Dumbbell Row','Back','Dumbbell'],['Barbell Bent-Over Row','Back','Barbell'],['Pull-Up','Back','Bodyweight'],
  ['Shoulder Press Machine','Shoulders','Machine'],['Dumbbell Shoulder Press','Shoulders','Dumbbell'],['Lateral Raise Machine','Shoulders','Machine'],['Dumbbell Lateral Raise','Shoulders','Dumbbell'],['Cable Face Pull','Shoulders','Cable'],['Reverse Pec Deck','Shoulders','Machine'],
  ['Bicep Curl Machine','Biceps','Machine'],['Cable Bicep Curl','Biceps','Cable'],['Dumbbell Curl','Biceps','Dumbbell'],['Hammer Curl','Biceps','Dumbbell'],['Preacher Curl','Biceps','Machine'],['Triceps Pushdown','Triceps','Cable'],['Overhead Cable Triceps Extension','Triceps','Cable'],['Triceps Dip','Triceps','Bodyweight'],
  ['Leg Press','Quads','Machine'],['Leg Extension','Quads','Machine'],['Goblet Squat','Quads','Dumbbell'],['Barbell Back Squat','Quads','Barbell'],['Kettlebell Squat','Quads','Kettlebell'],['Seated Leg Curl','Hamstrings','Machine'],['Lying Leg Curl','Hamstrings','Machine'],['Romanian Deadlift','Hamstrings','Barbell'],['Hip Thrust Machine','Glutes','Machine'],['Cable Glute Kickback','Glutes','Cable'],['Hip Abduction Machine','Abductors','Machine'],['Hip Adduction Machine','Adductor','Machine'],['Standing Calf Raise','Calves','Machine'],['Seated Calf Raise','Calves','Machine'],
  ['Ab Crunch Machine','Abs','Machine'],['Cable Crunch','Abs','Cable'],['Hanging Knee Raise','Abs','Bodyweight'],['Plank','Abs','Bodyweight']
].map(([name,muscle,equipment])=>({name,muscle,equipment}));

function App(){
  const [session,setSession]=useState(null), [email,setEmail]=useState(''), [password,setPassword]=useState('');
const [recoveryMode,setRecoveryMode]=useState(false);
  const [tab,setTab]=useState('home'), [workouts,setWorkouts]=useState([]), [query,setQuery]=useState(''), [muscle,setMuscle]=useState('All'), [equipment,setEquipment]=useState('All');
  const [selected,setSelected]=useState(library[0]), [graphMetric,setGraphMetric]=useState('weight');
  const [date,setDate]=useState(new Date().toISOString().slice(0,10)), [title,setTitle]=useState('PUSH'), [exerciseName,setExerciseName]=useState(''), [sets,setSets]=useState([{reps:'8',weight:'',},{reps:'8',weight:''},{reps:'8',weight:''}]);
  const [notice,setNotice]=useState('');
useEffect(()=>{ if(!supabase)return; supabase.auth.getSession().then(({data})=>setSession(data.session)); const {data:{subscription}}=supabase.auth.onAuthStateChange((event,s)=>{setSession(s);if(event==='PASSWORD_RECOVERY')setRecoveryMode(true);}); return ()=>subscription.unsubscribe(); },[]);
  useEffect(()=>{ if(session) loadWorkouts(); },[session]);
  async function loadWorkouts(){ const {data,error}=await supabase.from('workouts').select('*, workout_exercises(*, exercise_sets(*))').order('workout_date',{ascending:false}); if(error)setNotice(error.message); else setWorkouts(data||[]); }
async function signIn(e){
  e.preventDefault();
  setNotice('');
  if(!supabase){
    setNotice('Cloud is not configured yet. Follow SETUP.md to connect Supabase.');
    return;
  }
  const {error}=await supabase.auth.signInWithPassword({email,password});
  if(error){
    setNotice(error.message);
  }else{
    setNotice('Successfully signed in. Cloud connected.');
  }
}
  async function updatePassword(e){
  e.preventDefault();
  const {error}=await supabase.auth.updateUser({password});
  if(error){setNotice(error.message);return;}
  setRecoveryMode(false);
  setPassword('');
  setNotice('Password updated successfully. You can now sign in with your new password.');
  await supabase.auth.signOut();
}
  async function forgotPassword(){
  if(!supabase){setNotice('Cloud is not configured.');return;}
  if(!email.trim()){setNotice('Enter your email address first.');return;}
  const {error}=await supabase.auth.resetPasswordForEmail(email,{
    redirectTo:window.location.origin
  });
  setNotice(error?error.message:'Password reset email sent. Check your inbox.');
}
  async function signUp(){if(!supabase){setNotice('Cloud is not configured yet. Follow SETUP.md to connect Supabase.');return;} const {error}=await supabase.auth.signUp({email,password}); setNotice(error?error.message:'Check your email to confirm your account.');}
  async function saveWorkout(e){e.preventDefault(); if(!supabase||!session){setNotice('Sign in and connect cloud saving before saving workouts.');return;} if(!exerciseName.trim()){setNotice('Add an exercise first.');return;}
    const {data:w,error}=await supabase.from('workouts').insert({user_id:session.user.id,workout_date:date||new Date().toISOString().slice(0,10),title}).select().single(); if(error){setNotice(error.message);return;}
    const {data:we,error:e2}=await supabase.from('workout_exercises').insert({workout_id:w.id,exercise_name:exerciseName,muscle_group:library.find(x=>x.name===exerciseName)?.muscle||'Other',equipment:library.find(x=>x.name===exerciseName)?.equipment||'Other'}).select().single(); if(e2){setNotice(e2.message);return;}
    const payload=sets.map((s,i)=>({workout_exercise_id:we.id,set_number:i+1,reps:s.reps?Number(s.reps):null,weight:s.weight?Number(s.weight):null}));
    const {error:e3}=await supabase.from('exercise_sets').insert(payload); if(e3){setNotice(e3.message);return;} setNotice('Workout saved to your cloud account.'); setExerciseName(''); await loadWorkouts(); setTab('history');
  }
  const filtered=useMemo(()=>library.filter(x=>(x.name.toLowerCase().includes(query.toLowerCase())||x.muscle.toLowerCase().includes(query.toLowerCase()))&&(muscle==='All'||x.muscle===muscle)&&(equipment==='All'||x.equipment===equipment)),[query,muscle,equipment]);
  const historyFor = workouts
  .flatMap((workout) =>
    (workout.workout_exercises || [])
      .filter((exercise) => exercise.exercise_name === selected.name)
      .flatMap((exercise) =>
        (exercise.exercise_sets || []).map((set) => ({
          date: workout.workout_date,
          weight: Number(set.weight || 0),
          reps: Number(set.reps || 0),
          label: new Date(workout.workout_date + 'T00:00:00').toLocaleDateString(),
        }))
      )
  )
  .sort((a, b) => a.date.localeCompare(b.date));
  const baseWorkout=workouts.find(w=>w.title===title);
  function loadBase(){if(!baseWorkout)return; const ex=baseWorkout.workout_exercises?.[0]; if(!ex)return; setExerciseName(ex.exercise_name);setSets((ex.exercise_sets||[]).sort((a,b)=>a.set_number-b.set_number).map(s=>({reps:String(s.reps??''),weight:String(s.weight??'')})));setNotice('Loaded a previous session as your starting point.');}
  return <div className="app">
    <aside className="sidebar"><div className="brand"><div className="logo"><Footprints size={27}/></div><div><b>Exercises</b><small>TRAIN • TRACK • IMPROVE</small></div></div>
      <nav>{[['home','Overview',Activity],['workout','Start workout',Dumbbell],['library','Exercise library',Search],['history','Workout history',History],['progress','Progress',ChartNoAxesCombined]].map(([id,label,Icon])=><button className={tab===id?'active':''} onClick={()=>setTab(id)} key={id}><Icon size={18}/>{label}</button>)}</nav>
      <div className="side-bottom">{session?<><small>{session.user.email}</small><button onClick={()=>supabase.auth.signOut()}><LogOut size={17}/> Sign out</button></>:<small>Cloud account not connected</small>}</div>
    </aside>
    <main><header><div><span className="eyebrow">YOUR TRAINING SPACE</span><h1>{({home:'Overview',workout:'Start workout',library:'Exercise library',history:'Workout history',progress:'Exercise progression'})[tab]}</h1></div><div className="header-right"><span className="cloud"><span/> {session?'Cloud connected':'Cloud setup required'}</span></div></header>
      {notice&&<div className="notice" onClick={()=>setNotice('')}>{notice} <b>×</b></div>}
      {recoveryMode ? (
  <section className="auth card">
    <div>
      <h3>Set a new password</h3>
      <p>Enter your new password below.</p>
    </div>
    <form onSubmit={updatePassword}>
      <input
        type="password"
        placeholder="New password (6+ characters)"
        value={password}
        onChange={e=>setPassword(e.target.value)}
        minLength="6"
        required
      />
      <button className="primary" type="submit">Save new password</button>
    </form>
  </section>
) : !session && (
  <section className="auth card">
    <div>
      <h3>Connect your private cloud account</h3>
      <p>Create an account or sign in after completing the Supabase setup. No historical workout data has been imported.</p>
    </div>
    <form onSubmit={signIn}>
      <input type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} required/>
      <input type="password" placeholder="Password (6+ characters)" value={password} onChange={e=>setPassword(e.target.value)} required/>
      <div className="row">
        <button className="primary" type="submit"><LogIn size={16}/> Sign in</button>
        <button type="button" onClick={signUp}>Create account</button>
      </div>
      <button type="button" onClick={forgotPassword}>Forgot password?</button>
    </form>
  </section>
)}
      {tab==='home'&&<><section className="hero"><div><span className="eyebrow">CONSISTENCY BUILDS STRENGTH</span><h2>Your next session<br/>starts here.</h2><p>Log your sets, learn from your history and track every rep.</p><button className="primary" onClick={()=>setTab('workout')}><Plus size={17}/> Start a workout</button></div><div className="hero-mark"><Footprints size={112}/></div></section><div className="stats"><div className="card stat"><small>WORKOUTS LOGGED</small><strong>{workouts.length}</strong><span>Since you started</span></div><div className="card stat"><small>EXERCISES IN LIBRARY</small><strong>{library.length}</strong><span>Machines & variations</span></div><div className="card stat"><small>DATA STATUS</small><strong>{session?'Synced':'Empty'}</strong><span>{session?'Private cloud account':'No personal data imported'}</span></div></div><section className="card"><div className="section-head"><div><h3>Recent workouts</h3><p>Your latest saved sessions</p></div><button onClick={()=>setTab('history')}>View history →</button></div>{workouts.slice(0,4).map(w=><div className="history-row" key={w.id}><CalendarDays/><div><b>{w.title}</b><small>{w.workout_date}</small></div><span>{w.workout_exercises?.length||0} exercises</span></div>)}{!workouts.length&&<div className="empty">No workouts yet. Your history will appear here after your first saved session.</div>}</section></>}
      {tab==='workout'&&<section className="card form-card"><div className="section-head"><div><h3>New workout</h3><p>Choose a date, routine and exercise. Date defaults to today.</p></div><Dumbbell/></div><form onSubmit={saveWorkout}><div className="form-grid"><label>Workout name<select value={title} onChange={e=>setTitle(e.target.value)}>{['PUSH','PULL','LEGS','Full Body','Custom'].map(x=><option>{x}</option>)}</select></label><label>Workout date<input type="date" value={date} onChange={e=>setDate(e.target.value)}/></label></div><div className="base-row"><div><b>Use a past workout as your base</b><small>Loads a previous session with the same workout name.</small></div><button type="button" onClick={loadBase} disabled={!baseWorkout}><Copy size={15}/> Load base</button></div><label>Exercise<input list="exercise-options" placeholder="Search or type an exercise" value={exerciseName} onChange={e=>setExerciseName(e.target.value)}/><datalist id="exercise-options">{library.map(x=><option value={x.name}/>)}</datalist></label><div className="sets-head"><b>Sets</b><span>Reps</span><span>Weight (kg)</span><span></span></div>{sets.map((s,i)=><div className="set-row" key={i}><b>{i+1}</b><input type="number" min="0" placeholder="Reps" value={s.reps} onChange={e=>setSets(sets.map((x,j)=>j===i?{...x,reps:e.target.value}:x))}/><input type="number" min="0" step="0.25" placeholder="kg" value={s.weight} onChange={e=>setSets(sets.map((x,j)=>j===i?{...x,weight:e.target.value}:x))}/><button type="button" className="icon-btn" onClick={()=>setSets(sets.filter((_,j)=>j!==i))}><Trash2 size={16}/></button></div>)}<button type="button" onClick={()=>setSets([...sets,{reps:'8',weight:''}])}>+ Add set</button><button className="primary save" type="submit">Save workout</button></form><p className="hint">This first version saves one exercise per workout entry. You can add more exercises by saving another entry with the same workout name and date.</p></section>}
      {tab==='library'&&<section className="card"><div className="searchbar"><Search/><input placeholder="Search exercises or muscle groups..." value={query} onChange={e=>setQuery(e.target.value)}/></div><div className="filters"><label><Filter size={15}/> Muscle<select value={muscle} onChange={e=>setMuscle(e.target.value)}>{['All',...new Set(library.map(x=>x.muscle))].map(x=><option>{x}</option>)}</select></label><label>Equipment<select value={equipment} onChange={e=>setEquipment(e.target.value)}>{['All',...new Set(library.map(x=>x.equipment))].map(x=><option>{x}</option>)}</select></label></div><div className="library-list">{filtered.map(x=><button className={'library-item '+(selected.name===x.name?'chosen':'')} key={x.name} onClick={()=>{setSelected(x);setTab('progress')}}><div className="exercise-icon"><Dumbbell size={18}/></div><div><b>{x.name}</b><small>{x.muscle} · {x.equipment}</small></div><span>View progress →</span></button>)}</div><p className="hint">This starter library contains common exercises, machine movements and variations. It is not a copy of HEVY's proprietary exercise catalogue.</p></section>}
      {tab==='history'&&<section className="card"><h3>Workout history</h3>{workouts.map(w=><article className="history-card" key={w.id}><div className="section-head"><div><b>{w.title}</b><small>{w.workout_date}</small></div><CalendarDays/></div>{w.workout_exercises?.map(ex=><div className="history-row"><Dumbbell/><div><b>{ex.exercise_name}</b><small>{(ex.exercise_sets||[]).map(s=>`${s.reps??'-'} reps × ${s.weight??'-'} kg`).join('  ·  ')}</small></div></div>)}</article>)}{!workouts.length&&<div className="empty">No workouts recorded yet.</div>}</section>}
      {tab==='progress'&&<section className="card"><div className="section-head"><div><h3>{selected.name}</h3><p>{selected.muscle} · {selected.equipment}</p></div><Dumbbell/></div><div className="metric-tabs"><button className={graphMetric==='weight'?'selected':''} onClick={()=>setGraphMetric('weight')}>Weight (kg)</button><button className={graphMetric==='reps'?'selected':''} onClick={()=>setGraphMetric('reps')}>Reps</button></div><div className="chart">{historyFor.length?<ResponsiveContainer width="100%" height="100%"><AreaChart data={historyFor}><defs><linearGradient id="fill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#e12d3c" stopOpacity={.35}/><stop offset="95%" stopColor="#e12d3c" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="#303238"/><XAxis dataKey="label" stroke="#888"/><YAxis stroke="#888"/><Tooltip contentStyle={{background:'#202125',border:'1px solid #393b42',borderRadius:10}}/><Area type="monotone" dataKey={graphMetric} stroke="#e12d3c" fill="url(#fill)" strokeWidth={3}/></AreaChart></ResponsiveContainer>:<div className="empty">No records for this exercise yet. Log it in a workout and its weight and reps will appear here.</div>}</div><div className="section-head"><div><h3>Recorded sets</h3><p>Historical performance, oldest to newest</p></div></div>{historyFor.map((x,i)=><div className="history-row"><CalendarDays/><div><b>{x.label}</b><small>{x.weight} kg · {x.reps} reps</small></div></div>)}</section>}
      <footer>EXERCISES <span>•</span> YOUR TRAINING, YOUR DATA</footer>
    </main>
  </div>
}
createRoot(document.getElementById('root')).render(<App/>);
