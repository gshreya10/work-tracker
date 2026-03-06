const repoOwner="gshreya10"
const repoName="work-tracker"
const filePath="data/worklog.json"

const githubToken="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"

let calendar
let selectedDate=null
let fileSHA=null
let data={}

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

loadDatabase()

})

async function loadDatabase(){

const url=`https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}`

const res=await fetch(url)

const file=await res.json()

fileSHA=file.sha

data=JSON.parse(atob(file.content))

updateCalendar()

}

async function saveDatabase(){

const url=`https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}`

const content=btoa(JSON.stringify(data,null,2))

const res=await fetch(url,{

method:"PUT",

headers:{
Authorization:"token "+githubToken,
"Content-Type":"application/json"
},

body:JSON.stringify({
message:"update worklog",
content:content,
sha:fileSHA
})

})

const result=await res.json()

fileSHA=result.content.sha

}

function persist(){
saveDatabase()
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

if(!selectedDate) return

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
let time=prompt("Time (example 2h 30m)",formatMinutes(task.minutes))

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

function exportExcel(){

let rows=[]

Object.keys(data).forEach(date=>{

let entry=data[date]

entry.tasks.forEach(t=>{

rows.push({
date:date,
task:t.name,
minutes:t.minutes,
attendance:entry.attendance
})

})

})

let ws=XLSX.utils.json_to_sheet(rows)

let wb=XLSX.utils.book_new()

XLSX.utils.book_append_sheet(wb,ws,"WorkLog")

XLSX.writeFile(wb,"work_log.xlsx")

}
