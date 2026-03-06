const repoOwner="gshreya10"
const repoName="work-tracker"
const filePath="data/worklog.json"

const githubToken="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"

let calendar
let selectedDate=null
let data={}
let fileSHA=null

document.addEventListener("DOMContentLoaded",function(){

const calendarEl=document.getElementById("calendar")

calendar=new FullCalendar.Calendar(calendarEl,{

initialView:"dayGridMonth",
firstDay:1,

dayCellDidMount:function(info){

let d=info.date.getDay()

if(d===0||d===6){
info.el.classList.add("weekend")
}

},

dateClick:function(info){

selectedDate = info.dateStr

console.log("Selected:", selectedDate)

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

function parseTime(input){

input=input.toLowerCase().trim()

let h=(input.match(/(\d+)h/)||[])[1]||0
let m=(input.match(/(\d+)m/)||[])[1]||0

return parseInt(h)*60+parseInt(m)

}

function formatMinutes(m){

let h=Math.floor(m/60)
let min=m%60

return h+"h "+min+"m"

}

function openPanel(){

if(!selectedDate) return

document.getElementById("noSelection").style.display = "none"
document.getElementById("dayDetails").style.display = "block"

document.getElementById("panelDate").innerText = selectedDate

if(!data[selectedDate]){

let d = new Date(selectedDate).getDay()

let att = "wfh"

if(d === 0 || d === 6){
att = "holiday"
}

data[selectedDate] = {
attendance: att,
tasks: []
}

}

document.getElementById("attendanceSelect").value =
data[selectedDate].attendance

renderTasks()
updateTime()

}

document.getElementById("attendanceSelect").value=data[selectedDate].attendance

renderTasks()
updateTime()

}

document.getElementById("attendanceSelect").addEventListener("change",function(){

data[selectedDate].attendance=this.value

updateCalendar()
saveDatabase()

})

function addTask(){

let name=document.getElementById("taskName").value.trim()
let time=document.getElementById("taskTime").value.trim()

if(!name||!time) return

let mins=parseTime(time)

data[selectedDate].tasks.push({name:name,minutes:mins})

document.getElementById("taskName").value=""
document.getElementById("taskTime").value=""

renderTasks()
updateTime()
updateCalendar()

saveDatabase()

}

function renderTasks(){

let list=document.getElementById("taskList")

list.innerHTML=""

data[selectedDate].tasks.forEach((t,i)=>{

let row=document.createElement("tr")

row.innerHTML=`
<td><input value="${t.name}" onchange="updateTaskName(${i},this.value)"></td>
<td><input value="${formatMinutes(t.minutes)}" onchange="updateTaskTime(${i},this.value)"></td>
<td><span class="icon" onclick="deleteTask(${i})">🗑</span></td>
`

list.appendChild(row)

})

}

function updateTaskName(i,v){

data[selectedDate].tasks[i].name=v
saveDatabase()

}

function updateTaskTime(i,v){

data[selectedDate].tasks[i].minutes=parseTime(v)

updateTime()
updateCalendar()

saveDatabase()

}

function deleteTask(i){

data[selectedDate].tasks.splice(i,1)

renderTasks()
updateTime()
updateCalendar()

saveDatabase()

}

function updateTime(){

let mins=data[selectedDate].tasks.reduce((a,b)=>a+b.minutes,0)

let remain=420-mins

if(remain<0)remain=0

document.getElementById("timeSummary").innerText=
"Logged: "+formatMinutes(mins)+" | Remaining: "+formatMinutes(remain)

}

function updateCalendar(){

calendar.removeAllEvents()

Object.keys(data).forEach(d=>{

let e=data[d]

let color=""

if(e.attendance==="wfo")color="green"
if(e.attendance==="leave")color="red"
if(e.attendance==="holiday")color="grey"

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

let year=view.currentStart.getFullYear()
let month=view.currentStart.getMonth()

let first=new Date(year,month,1)
let last=new Date(year,month+1,0)

let wfo=0
let wfh=0

for(let d=new Date(first);d<=last;d.setDate(d.getDate()+1)){

let key=d.toISOString().split("T")[0]

if(!data[key])continue

if(data[key].attendance==="wfo")wfo++
if(data[key].attendance==="wfh")wfh++

}

let pct=0

if(wfo+wfh>0){
pct=((wfo*100)/(wfo+wfh)).toFixed(2)
}

let el=document.getElementById("attendancePercent")

el.innerText=pct+"%"

if(pct<60)el.style.color="red"
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
