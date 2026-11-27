
import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createClient } from '@supabase/supabase-js';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from 'recharts';
import {
  Activity, Search, Plus, Dumbbell, CalendarDays,
  ChartNoAxesCombined, History, LogIn, LogOut,
  Trash2, Copy, Filter, Footprints, X
} from 'lucide-react';
import './style.css';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

const library = [
  ['Chest Press Machine','Chest','Machine'],
  ['Incline Chest Press Machine','Chest','Machine'],
  ['Decline Chest Press Machine','Chest','Machine'],
  ['Pectoral Fly (Pec Deck)','Chest','Machine'],
  ['Cable Chest Fly','Chest','Cable'],
  ['Incline Dumbbell Press','Chest','Dumbbell'],
  ['Flat Barbell Bench Press','Chest','Barbell'],
  ['Push-Up','Chest','Bodyweight'],
  ['Lat Pulldown','Back','Cable'],
  ['Seated Cable Row','Back','Cable'],
  ['Chest-Supported Row','Back','Machine'],
  ['Machine Row','Back','Machine'],
  ['One-Arm Dumbbell Row','Back','Dumbbell'],
  ['Barbell Bent-Over Row','Back','Barbell'],
  ['Pull-Up','Back','Bodyweight'],
  ['Shoulder Press Machine','Shoulders','Machine'],
  ['Dumbbell Shoulder Press','Shoulders','Dumbbell'],
  ['Lateral Raise Machine','Shoulders','Machine'],
  ['Dumbbell Lateral Raise','Shoulders','Dumbbell'],
  ['Cable Face Pull','Shoulders','Cable'],
  ['Reverse Pec Deck','Shoulders','Machine'],
  ['Bicep Curl Machine','Biceps','Machine'],
  ['Cable Bicep Curl','Biceps','Cable'],
  ['Dumbbell Curl','Biceps','Dumbbell'],
  ['Hammer Curl','Biceps','Dumbbell'],
  ['Preacher Curl','Biceps','Machine'],
  ['Triceps Pushdown','Triceps','Cable'],
  ['Overhead Cable Triceps Extension','Triceps','Cable'],
  ['Triceps Dip','Triceps','Bodyweight'],
  ['Leg Press','Quads','Machine'],
  ['Leg Extension','Quads','Machine'],
  ['Goblet Squat','Quads','Dumbbell'],
  ['Barbell Back Squat','Quads','Barbell'],
  ['Kettlebell Squat','Quads','Kettlebell'],
  ['Seated Leg Curl','Hamstrings','Machine'],
  ['Lying Leg Curl','Hamstrings','Machine'],
  ['Romanian Deadlift','Hamstrings','Barbell'],
  ['Hip Thrust Machine','Glutes','Machine'],
  ['Cable Glute Kickback','Glutes','Cable'],
  ['Hip Abduction Machine','Abductors','Machine'],
  ['Hip Adduction Machine','Adductor','Machine'],
  ['Standing Calf Raise','Calves','Machine'],
  ['Seated Calf Raise','Calves','Machine'],
  ['Ab Crunch Machine','Abs','Machine'],
  ['Cable Crunch','Abs','Cable'],
  ['Hanging Knee Raise','Abs','Bodyweight'],
  ['Plank','Abs','Bodyweight']
].map(([name,muscle,equipment])=>({name,muscle,equipment}));

const blankExercise = () => ({
  exerciseName: '',
  sets: [
    {reps:'8',weight:''},
    {reps:'8',weight:''},
    {reps:'8',weight:''}
  ]
});

function App(){
  const [session,setSession]=useState(null);
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [recoveryMode,setRecoveryMode]=useState(false);

  const [tab,setTab]=useState('home');
  const [workouts,setWorkouts]=useState([]);
  const [query,setQuery]=useState('');
  const [muscle,setMuscle]=useState('All');
  const [equipment,setEquipment]=useState('All');

  const [selected,setSelected]=useState(library[0]);
  const [graphMetric,setGraphMetric]=useState('weight');

  const [date,setDate]=useState(new Date().toISOString().slice(0,10));
  const [title,setTitle]=useState('PUSH');
  const [exerciseItems,setExerciseItems]=useState([blankExercise()]);
  const [notice,setNotice]=useState('');
  const [deletingId,setDeletingId]=useState(null);

  useEffect(()=>{
    if(!supabase)return;

    supabase.auth.getSession().then(({data})=>{
      setSession(data.session);
    });

    const {data:{subscription}}=supabase.auth.onAuthStateChange(
      (event,s)=>{
        setSession(s);
        if(event==='PASSWORD_RECOVERY')setRecoveryMode(true);
      }
    );

    return ()=>subscription.unsubscribe();
  },[]);

  useEffect(()=>{
    if(session)loadWorkouts();
    else setWorkouts([]);
  },[session]);

  async function loadWorkouts(){
    if(!supabase)return;

    const {data,error}=await supabase
      .from('workouts')
      .select('*, workout_exercises(*, exercise_sets(*))')
      .order('workout_date',{ascending:false});

    if(error){
      setNotice(error.message);
    }else{
      setWorkouts(data||[]);
    }
  }

  async function signIn(e){
    e.preventDefault();
    setNotice('');

    if(!supabase){
      setNotice('Cloud is not configured. Check your Supabase settings.');
      return;
    }

    const {error}=await supabase.auth.signInWithPassword({
      email,
      password
    });

    if(error)setNotice(error.message);
    else setNotice('Successfully signed in. Cloud connected.');
  }

  async function signUp(){
    if(!supabase){
      setNotice('Cloud is not configured.');
      return;
    }

    const {error}=await supabase.auth.signUp({email,password});
    setNotice(error?error.message:'Check your email to confirm your account.');
  }

  async function forgotPassword(){
    if(!supabase){
      setNotice('Cloud is not configured.');
      return;
    }

    if(!email.trim()){
      setNotice('Enter your email address first.');
      return;
    }

    const {error}=await supabase.auth.resetPasswordForEmail(email,{
      redirectTo:window.location.origin
    });

    setNotice(error?error.message:'Password reset email sent. Check your inbox.');
  }

  async function updatePassword(e){
    e.preventDefault();

    const {error}=await supabase.auth.updateUser({password});

    if(error){
      setNotice(error.message);
      return;
    }

    setRecoveryMode(false);
    setPassword('');
    setNotice('Password updated successfully. You can now sign in again.');
    await supabase.auth.signOut();
  }

  // Delete a complete workout and all its associated exercises and sets.
  async function deleteWorkout(workout){
    if(!supabase||!session){
      setNotice('You must be signed in to delete workouts.');
      return;
    }

    const confirmed=window.confirm(
      `Are you sure you want to permanently delete this workout?\n\n${workout.title} - ${workout.workout_date}\n\nAll exercises and sets in this workout will also be deleted. This cannot be undone.`
    );

    if(!confirmed)return;

    setDeletingId(workout.id);
    setNotice('Deleting workout...');

    try{
      const exerciseIds=(workout.workout_exercises||[])
        .map(ex=>ex.id);

      // Delete the sets belonging to this workout's exercises first.
      if(exerciseIds.length){
        const {error:setsError}=await supabase
          .from('exercise_sets')
          .delete()
          .in('workout_exercise_id',exerciseIds);

        if(setsError){
          setNotice('Could not delete workout sets: '+setsError.message);
          return;
        }

        // Then delete the exercises.
        const {error:exercisesError}=await supabase
          .from('workout_exercises')
          .delete()
          .eq('workout_id',workout.id);

        if(exercisesError){
          setNotice('Could not delete workout exercises: '+exercisesError.message);
          return;
        }
      }

      // Finally delete the workout itself.
      const {error:workoutError}=await supabase
        .from('workouts')
        .delete()
        .eq('id',workout.id)
        .eq('user_id',session.user.id);

      if(workoutError){
        setNotice('Could not delete workout: '+workoutError.message);
        return;
      }

      setWorkouts(current=>current.filter(w=>w.id!==workout.id));
      setNotice(`${workout.title} workout from ${workout.workout_date} deleted successfully.`);
    }catch(error){
      setNotice('An unexpected error occurred: '+error.message);
    }finally{
      setDeletingId(null);
    }
  }

  function updateExerciseName(index,value){
    setExerciseItems(items=>items.map((item,i)=>
      i===index?{...item,exerciseName:value}:item
    ));
  }

  function addExercise(){
    setExerciseItems(items=>[...items,blankExercise()]);
  }

  function removeExercise(index){
    setExerciseItems(items=>items.filter((_,i)=>i!==index));
  }

  function addSet(exerciseIndex){
    setExerciseItems(items=>items.map((item,i)=>
      i===exerciseIndex
        ? {...item,sets:[...item.sets,{reps:'8',weight:''}]}
        : item
    ));
  }

  function removeSet(exerciseIndex,setIndex){
    setExerciseItems(items=>items.map((item,i)=>
      i===exerciseIndex
        ? {...item,sets:item.sets.filter((_,j)=>j!==setIndex)}
        : item
    ));
  }

  function updateSet(exerciseIndex,setIndex,field,value){
    setExerciseItems(items=>items.map((item,i)=>
      i===exerciseIndex
        ? {
            ...item,
            sets:item.sets.map((set,j)=>
              j===setIndex?{...set,[field]:value}:set
            )
          }
        : item
    ));
  }

  async function saveWorkout(e){
    e.preventDefault();

    if(!supabase||!session){
      setNotice('Sign in and connect cloud saving before saving workouts.');
      return;
    }

    const validExercises=exerciseItems.filter(
      item=>item.exerciseName.trim()
    );

    if(!validExercises.length){
      setNotice('Add at least one exercise before saving.');
      return;
    }

    if(validExercises.some(item=>!item.sets.length)){
      setNotice('Each exercise needs at least one set.');
      return;
    }

    setNotice('Saving workout...');

    const {data:w,error}=await supabase
      .from('workouts')
      .insert({
        user_id:session.user.id,
        workout_date:date||new Date().toISOString().slice(0,10),
        title
      })
      .select()
      .single();

    if(error){
      setNotice(error.message);
      return;
    }

    for(let i=0;i<validExercises.length;i++){
      const item=validExercises[i];
      const exercise=library.find(x=>x.name===item.exerciseName);

      const {data:we,error:e2}=await supabase
        .from('workout_exercises')
        .insert({
          workout_id:w.id,
          exercise_name:item.exerciseName,
          muscle_group:exercise?.muscle||'Other',
          equipment:exercise?.equipment||'Other',
          sort_order:i
        })
        .select()
        .single();

      if(e2){
        setNotice('Workout was created, but an exercise could not be saved: '+e2.message);
        await loadWorkouts();
        return;
      }

      const payload=item.sets.map((s,j)=>({
        workout_exercise_id:we.id,
        set_number:j+1,
        reps:s.reps!==''?Number(s.reps):null,
        weight:s.weight!==''?Number(s.weight):null
      }));

      const {error:e3}=await supabase
        .from('exercise_sets')
        .insert(payload);

      if(e3){
        setNotice('An exercise was saved, but its sets could not be saved: '+e3.message);
        await loadWorkouts();
        return;
      }
    }

    setNotice('Workout saved successfully to your cloud account.');
    setExerciseItems([blankExercise()]);
    await loadWorkouts();
    setTab('history');
  }

  const filtered=useMemo(()=>library.filter(x=>
    (x.name.toLowerCase().includes(query.toLowerCase())||
     x.muscle.toLowerCase().includes(query.toLowerCase()))&&
    (muscle==='All'||x.muscle===muscle)&&
    (equipment==='All'||x.equipment===equipment)
  ),[query,muscle,equipment]);

  const historyFor=workouts
    .flatMap(workout=>
      (workout.workout_exercises||[])
        .filter(exercise=>exercise.exercise_name===selected.name)
        .flatMap(exercise=>
          (exercise.exercise_sets||[]).map(set=>({
            date:workout.workout_date,
            weight:Number(set.weight||0),
            reps:Number(set.reps||0),
            label:new Date(workout.workout_date+'T00:00:00').toLocaleDateString()
          }))
        )
    )
    .sort((a,b)=>a.date.localeCompare(b.date));

  const baseWorkout=workouts
    .filter(w=>w.title===title)
    .sort((a,b)=>{
      const dateCompare=b.workout_date.localeCompare(a.workout_date);
      if(dateCompare!==0)return dateCompare;

      return (b.workout_exercises?.length||0)-
             (a.workout_exercises?.length||0);
    })[0];

  function loadBase(){
    if(!baseWorkout)return;

    const exercises=[...(baseWorkout.workout_exercises||[])]
      .sort((a,b)=>(a.sort_order??0)-(b.sort_order??0))
      .map(ex=>({
        exerciseName:ex.exercise_name,
        sets:[...(ex.exercise_sets||[])]
          .sort((a,b)=>a.set_number-b.set_number)
          .map(s=>({
            reps:String(s.reps??''),
            weight:String(s.weight??'')
          }))
      }));

    if(!exercises.length){
      setNotice('The selected previous workout has no exercises.');
      return;
    }

    setExerciseItems(exercises);
    setNotice('Previous workout loaded. You can change it before saving.');
  }

  return <div className="app">
    <aside className="sidebar">
      <div className="brand">
        <div className="logo"><Footprints size={27}/></div>
        <div><b>Exercises</b><small>TRAIN • TRACK • IMPROVE</small></div>
      </div>

      <nav>
        {[
          ['home','Overview',Activity],
          ['workout','Start workout',Dumbbell],
          ['library','Exercise library',Search],
          ['history','Workout history',History],
          ['progress','Progress',ChartNoAxesCombined]
        ].map(([id,label,Icon])=>
          <button
            className={tab===id?'active':''}
            onClick={()=>setTab(id)}
            key={id}
          >
            <Icon size={18}/>{label}
          </button>
        )}
      </nav>

      <div className="side-bottom">
        {session
          ? <>
              <small>{session.user.email}</small>
              <button onClick={()=>supabase.auth.signOut()}>
                <LogOut size={17}/> Sign out
              </button>
            </>
          : <small>Cloud account not connected</small>
        }
      </div>
    </aside>

    <main>
      <header>
        <div>
          <span className="eyebrow">YOUR TRAINING SPACE</span>
          <h1>
            {({
              home:'Overview',
              workout:'Start workout',
              library:'Exercise library',
              history:'Workout history',
              progress:'Exercise progression'
            })[tab]}
          </h1>
        </div>

        <div className="header-right">
          <span className="cloud">
            <span/>{session?'Cloud connected':'Cloud setup required'}
          </span>
          {session&&
            <button type="button" onClick={()=>supabase.auth.signOut()}>
              <LogOut size={16}/> Sign out
            </button>
          }
        </div>
      </header>

      {notice&&
        <div className="notice" onClick={()=>setNotice('')}>
          {notice} <b>×</b>
        </div>
      }

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
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e=>setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password (6+ characters)"
              value={password}
              onChange={e=>setPassword(e.target.value)}
              required
            />
            <div className="row">
              <button className="primary" type="submit">
                <LogIn size={16}/> Sign in
              </button>
              <button type="button" onClick={signUp}>Create account</button>
            </div>
            <button type="button" onClick={forgotPassword}>Forgot password?</button>
          </form>
        </section>
      )}

      {tab==='home'&&<>
        <section className="hero">
          <div>
            <span className="eyebrow">CONSISTENCY BUILDS STRENGTH</span>
            <h2>Your next session<br/>starts here.</h2>
            <p>Log your sets, learn from your history and track every rep.</p>
            <button className="primary" onClick={()=>setTab('workout')}>
              <Plus size={17}/> Start a workout
            </button>
          </div>
          <div className="hero-mark"><Footprints size={112}/></div>
        </section>

        <div className="stats">
          <div className="card stat">
            <small>WORKOUTS LOGGED</small>
            <strong>{workouts.length}</strong>
            <span>Since you started</span>
          </div>
          <div className="card stat">
            <small>EXERCISES IN LIBRARY</small>
            <strong>{library.length}</strong>
            <span>Machines & variations</span>
          </div>
          <div className="card stat">
            <small>DATA STATUS</small>
            <strong>{session?'Synced':'Empty'}</strong>
            <span>{session?'Private cloud account':'No personal data imported'}</span>
          </div>
        </div>

        <section className="card">
          <div className="section-head">
            <div><h3>Recent workouts</h3><p>Your latest saved sessions</p></div>
            <button onClick={()=>setTab('history')}>View history →</button>
          </div>

          {workouts.slice(0,4).map(w=>
            <div className="history-row" key={w.id}>
              <CalendarDays/>
              <div><b>{w.title}</b><small>{w.workout_date}</small></div>
              <span>{w.workout_exercises?.length||0} exercises</span>
            </div>
          )}

          {!workouts.length&&
            <div className="empty">
              No workouts yet. Your history will appear here after your first saved session.
            </div>
          }
        </section>
      </>}

      {tab==='workout'&&
        <section className="card form-card">
          <div className="section-head">
            <div>
              <h3>New workout</h3>
              <p>Add as many exercises and sets as you need.</p>
            </div>
            <Dumbbell/>
          </div>

          <form onSubmit={saveWorkout}>
            <div className="form-grid">
              <label>
                Workout name
                <select value={title} onChange={e=>setTitle(e.target.value)}>
                  {['PUSH','PULL','LEGS','Full Body','Custom'].map(x=>
                    <option key={x}>{x}</option>
                  )}
                </select>
              </label>

              <label>
                Workout date
                <input
                  type="date"
                  value={date}
                  onChange={e=>setDate(e.target.value)}
                />
              </label>
            </div>

            <div className="base-row">
              <div>
                <b>Use a past workout as your base</b>
                <small>
                  Loads the latest matching workout. If dates match, the one with more exercises is preferred.
                </small>
              </div>
              <button type="button" onClick={loadBase} disabled={!baseWorkout}>
                <Copy size={15}/> Load base
              </button>
            </div>

            <datalist id="exercise-options">
              {library.map(x=><option key={x.name} value={x.name}/>)}
            </datalist>

            {exerciseItems.map((item,index)=>
              <div
                className="exercise-editor"
                key={index}
                style={{
                  border:'1px solid #393b42',
                  borderRadius:'12px',
                  padding:'16px',
                  marginTop:'18px'
                }}
              >
                <div className="section-head">
                  <b>Exercise {index+1}</b>
                  {exerciseItems.length>1&&
                    <button
                      type="button"
                      className="icon-btn"
                      onClick={()=>removeExercise(index)}
                      title="Remove exercise"
                    >
                      <X size={17}/>
                    </button>
                  }
                </div>

                <label>
                  Exercise
                  <input
                    list="exercise-options"
                    placeholder="Search or type an exercise"
                    value={item.exerciseName}
                    onChange={e=>updateExerciseName(index,e.target.value)}
                  />
                </label>

                <div className="sets-head">
                  <b>Sets</b>
                  <span>Reps</span>
                  <span>Weight (kg)</span>
                  <span></span>
                </div>

                {item.sets.map((s,setIndex)=>
                  <div className="set-row" key={setIndex}>
                    <b>{setIndex+1}</b>
                    <input
                      type="number"
                      min="0"
                      placeholder="Reps"
                      value={s.reps}
                      onChange={e=>updateSet(index,setIndex,'reps',e.target.value)}
                    />
                    <input
                      type="number"
                      min="0"
                      step="0.25"
                      placeholder="kg"
                      value={s.weight}
                      onChange={e=>updateSet(index,setIndex,'weight',e.target.value)}
                    />
                    <button
                      type="button"
                      className="icon-btn"
                      onClick={()=>removeSet(index,setIndex)}
                      title="Remove set"
                    >
                      <Trash2 size={16}/>
                    </button>
                  </div>
                )}

                <button type="button" onClick={()=>addSet(index)}>
                  + Add set
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={addExercise}
              style={{marginTop:'18px'}}
            >
              <Plus size={16}/> Add another exercise
            </button>

            <button className="primary save" type="submit">
              Save workout
            </button>
          </form>

          <p className="hint">
            All exercises and sets are saved together as one workout session.
            Loading a past workout copies it into a new session and does not overwrite the original.
          </p>
        </section>
      }

      {tab==='library'&&
        <section className="card">
          <div className="searchbar">
            <Search/>
            <input
              placeholder="Search exercises or muscle groups..."
              value={query}
              onChange={e=>setQuery(e.target.value)}
            />
          </div>

          <div className="filters">
            <label>
              <Filter size={15}/> Muscle
              <select value={muscle} onChange={e=>setMuscle(e.target.value)}>
                {['All',...new Set(library.map(x=>x.muscle))].map(x=>
                  <option key={x}>{x}</option>
                )}
              </select>
            </label>

            <label>
              Equipment
              <select value={equipment} onChange={e=>setEquipment(e.target.value)}>
                {['All',...new Set(library.map(x=>x.equipment))].map(x=>
                  <option key={x}>{x}</option>
                )}
              </select>
            </label>
          </div>

          <div className="library-list">
            {filtered.map(x=>
              <button
                className={'library-item '+(selected.name===x.name?'chosen':'')}
                key={x.name}
                onClick={()=>{
                  setSelected(x);
                  setTab('progress');
                }}
              >
                <div className="exercise-icon"><Dumbbell size={18}/></div>
                <div><b>{x.name}</b><small>{x.muscle} · {x.equipment}</small></div>
                <span>View progress →</span>
              </button>
            )}
          </div>

          <p className="hint">
            This starter library contains common exercises, machine movements and variations.
          </p>
        </section>
      }

      {tab==='history'&&
        <section className="card">
          <h3>Workout history</h3>

          {workouts.map(w=>
            <article className="history-card" key={w.id}>
              <div className="section-head">
                <div>
                  <b>{w.title}</b>
                  <small>{w.workout_date}</small>
                </div>

                <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
                  <CalendarDays/>
                  <button
                    type="button"
                    className="icon-btn"
                    title="Delete this workout"
                    aria-label={`Delete ${w.title} workout from ${w.workout_date}`}
                    disabled={deletingId!==null}
                    onClick={()=>deleteWorkout(w)}
                    style={{color:'#e12d3c'}}
                  >
                    {deletingId===w.id
                      ? '...'
                      : <Trash2 size={18}/>
                    }
                  </button>
                </div>
              </div>

              {(w.workout_exercises||[])
                .slice()
                .sort((a,b)=>(a.sort_order??0)-(b.sort_order??0))
                .map(ex=>
                  <div className="history-row" key={ex.id}>
                    <Dumbbell/>
                    <div>
                      <b>{ex.exercise_name}</b>
                      <small>
                        {(ex.exercise_sets||[])
                          .slice()
                          .sort((a,b)=>a.set_number-b.set_number)
                          .map(s=>`${s.reps??'-'} reps × ${s.weight??'-'} kg`)
                          .join('  ·  ')
                        }
                      </small>
                    </div>
                  </div>
                )
              }
            </article>
          )}

          {!workouts.length&&
            <div className="empty">No workouts recorded yet.</div>
          }
        </section>
      }

      {tab==='progress'&&
        <section className="card">
          <div className="section-head">
            <div>
              <h3>Exercise progression</h3>
              <p>Select an exercise to view its individual history.</p>
            </div>
            <Dumbbell/>
          </div>

          <label>
            Select exercise
            <select
              value={selected.name}
              onChange={e=>{
                const exercise=library.find(x=>x.name===e.target.value);
                if(exercise)setSelected(exercise);
              }}
            >
              {library.map(x=>
                <option key={x.name} value={x.name}>{x.name}</option>
              )}
            </select>
          </label>

          <div className="section-head" style={{marginTop:'20px'}}>
            <div>
              <h3>{selected.name}</h3>
              <p>{selected.muscle} · {selected.equipment}</p>
            </div>
            <Dumbbell/>
          </div>

          <div className="metric-tabs">
            <button
              className={graphMetric==='weight'?'selected':''}
              onClick={()=>setGraphMetric('weight')}
            >
              Weight (kg)
            </button>
            <button
              className={graphMetric==='reps'?'selected':''}
              onClick={()=>setGraphMetric('reps')}
            >
              Reps
            </button>
          </div>

          <div className="chart">
            {historyFor.length
              ? <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={historyFor}>
                    <defs>
                      <linearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#e12d3c" stopOpacity={.35}/>
                        <stop offset="95%" stopColor="#e12d3c" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#303238"/>
                    <XAxis dataKey="label" stroke="#888"/>
                    <YAxis stroke="#888"/>
                    <Tooltip contentStyle={{
                      background:'#202125',
                      border:'1px solid #393b42',
                      borderRadius:10
                    }}/>
                    <Area
                      type="monotone"
                      dataKey={graphMetric}
                      stroke="#e12d3c"
                      fill="url(#fill)"
                      strokeWidth={3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              : <div className="empty">
                  No records for {selected.name} yet. Log this exercise in a workout and its progress will appear here.
                </div>
            }
          </div>

          <div className="section-head">
            <div>
              <h3>{selected.name} – Recorded Sets</h3>
              <p>Only sets recorded for this exercise are displayed.</p>
            </div>
          </div>

          {historyFor.map((x,i)=>
            <div className="history-row" key={i}>
              <CalendarDays/>
              <div>
                <b>{x.label}</b>
                <small>{x.weight} kg · {x.reps} reps</small>
              </div>
            </div>
          )}
        </section>
      }

      <footer>EXERCISES <span>•</span> YOUR TRAINING, YOUR DATA</footer>
    </main>
  </div>;
}

createRoot(document.getElementById('root')).render(<App/>);
