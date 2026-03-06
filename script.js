let calendar
let selectedDate=null

let data = JSON.parse(localStorage.getItem("worktracker") || "{}")

document.addEventListener("DOMContentLoaded",function(){

const calendarEl=document.getElementById("calendar")

calendar=new FullCalendar.Calendar(calendarEl,{

initialView:"dayGridMonth",

dateClick:function(info){

selectedDate=info.dateStr
openPanel()

}

})

calendar.render()

updateCalendar()

})

function persist(){
localStorage.setItem("worktracker",JSON.stringify(data))
}

function formatMinutes(m){

let h=Math.floor(m/60)
let min=m%60

return h+"h "+min+"m"

}

function parseTime(t){

t=t.toLowerCase()

let h=(t.match(/(\d+)h/)||[])[1]||0
let m=(t.match(/(\d+)m/)||[])[1]||0

return (parseInt(h)*60)+parseInt(m)

}

function openPanel(){

document.getElementById("panelDate").innerText=selectedDate

if(!data[selectedDate]){

let d=new Date(selectedDate).getDay()

let att="wfh"

if(d===0||d===6) att="holiday"

data[selectedDate]={attendance:att,tasks:[]}

persist()

}

document.getElementById("attendanceSelect").value=data[selectedDate].attendance

renderTasks()

updateTime()

}

document.getElementById("attendanceSelect").addEventListener("change",function(){

data[selectedDate].attendance=this.value

persist()

updateCalendar()

})

function addTask(){

let name=document.getElementById("taskName").value
let time=document.getElementById("taskTime").value

if(!name||!time) return

let mins=parseTime(time)

data[selectedDate].tasks.push({name:name,minutes:mins})

persist()

renderTasks()
updateTime()
updateCalendar()

}

function renderTasks(){

let list=document.getElementById("taskList")

list.innerHTML=""

data[selectedDate].tasks.forEach((t,i)=>{

let row=document.createElement("tr")

row.innerHTML=`
<td>${t.name}</td>
<td>${formatMinutes(t.minutes)}</td>
<td>
<span class="icon" onclick="editTask(${i})">✏️</span>
<span class="icon" onclick="deleteTask(${i})">🗑️</span>
</td>
`

list.appendChild(row)

})

}

function deleteTask(i){

data[selectedDate].tasks.splice(i,1)

persist()

renderTasks()
updateTime()
updateCalendar()

}

function editTask(i){

let task=data[selectedDate].tasks[i]

let name=prompt("Task",task.name)
let time=prompt("Time",formatMinutes(task.minutes))

task.name=name
task.minutes=parseTime(time)

persist()

renderTasks()
updateTime()
updateCalendar()

}

function updateTime(){

let mins=data[selectedDate].tasks.reduce((a,b)=>a+b.minutes,0)

let remain=420-mins

if(remain<0) remain=0

document.getElementById("timeSummary").innerText=
"Logged: "+formatMinutes(mins)+" | Remaining: "+formatMinutes(remain)

}

function updateCalendar(){

calendar.removeAllEvents()

renderWeekends()

Object.keys(data).forEach(d=>{

let e=data[d]

let color=""

if(e.attendance==="wfo") color="green"
if(e.attendance==="leave") color="red"
if(e.attendance==="holiday") color="grey"

if(color){

calendar.addEvent({
start:d,
display:"background",
backgroundColor:color
})

}

let mins=e.tasks.reduce((a,b)=>a+b.minutes,0)

if(mins>0){

calendar.addEvent({
title:formatMinutes(mins),
start:d
})

}

})

updateAttendance()

}

function renderWeekends(){

let view=calendar.view

let start=new Date(view.currentStart)
let end=new Date(view.currentEnd)

for(let d=new Date(start);d<=end;d.setDate(d.getDate()+1)){

let day=d.getDay()

if(day===0||day===6){

calendar.addEvent({
start:d.toISOString().split("T")[0],
display:"background",
backgroundColor:"#e6e6e6"
})

}

}

}

function updateAttendance(){

let view=calendar.view

let start=new Date(view.currentStart)
let end=new Date(view.currentEnd)

let wfo=0
let wfh=0

for(let d=new Date(start);d<end;d.setDate(d.getDate()+1)){

let key=d.toISOString().split("T")[0]

if(!data[key]) continue

if(data[key].attendance==="wfo") wfo++
if(data[key].attendance==="wfh") wfh++

}

let pct=0

if(wfo+wfh>0){
pct=((wfo/(wfo+wfh))*100).toFixed(2)
}

let el=document.getElementById("attendancePercent")

el.innerText=pct+"%"

if(pct<60) el.style.color="red"
else el.style.color="green"

}
