const repoOwner="gshreya10"
const repoName="work-tracker"
const filePath="data/worklog.json"

const githubToken="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"

let calendar
let data={}
let selectedDate=null


document.addEventListener("DOMContentLoaded",async()=>{

const calendarEl=document.getElementById("calendar")

calendar=new FullCalendar.Calendar(calendarEl,{

initialView:"dayGridMonth",
firstDay:1,

dayCellDidMount:function(info){

let d=info.date.getDay()

if(d===0||d===6) info.el.classList.add("weekend")

},

dateClick:function(info){

selectedDate=info.dateStr

openPanel()

}

})

await loadDatabase()

calendar.render()

updateCalendar()

})


async function loadDatabase(){

const url=`https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}`

const res=await fetch(url)

const file=await res.json()

data=JSON.parse(atob(file.content))

}


async function saveDatabase(){

const url=`https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}`

const latest=await fetch(url,{
headers:{Authorization:"token "+githubToken}
})

const latestFile=await latest.json()

const content=btoa(JSON.stringify(data,null,2))

await fetch(url,{
method:"PUT",
headers:{
Authorization:"token "+githubToken,
"Content-Type":"application/json"
},
body:JSON.stringify({
message:"update",
content:content,
sha:latestFile.sha
})
})

}


function openPanel(){

document.getElementById("noSelection").style.display="none"
document.getElementById("dayDetails").style.display="block"

document.getElementById("panelDate").innerText=selectedDate

if(!data[selectedDate]){

let d=new Date(selectedDate).getDay()

let att="wfh"

if(d===0||d===6) att="leave"

data[selectedDate]={attendance:att,tasks:[]}

}

renderTasks()

updateTime()

}


function parseTime(t){

let h=(t.match(/(\d+)h/)||[])[1]||0
let m=(t.match(/(\d+)m/)||[])[1]||0

return parseInt(h)*60+parseInt(m)

}


function formatMinutes(m){

let h=Math.floor(m/60)
let min=m%60

return h+"h "+min+"m"

}


function addTask(){

let name=document.getElementById("taskName").value
let time=document.getElementById("taskTime").value

if(!name||!time) return

let mins=parseTime(time)

data[selectedDate].tasks.push({name:name,minutes:mins})

renderTasks()

updateTime()

saveDatabase()

}


function renderTasks(){

let list=document.getElementById("taskList")

list.innerHTML=""

data[selectedDate].tasks.forEach((t,i)=>{

let row=document.createElement("tr")

row.innerHTML=`

<td>${t.name}</td>
<td>${formatMinutes(t.minutes)}</td>
<td><span class="icon" onclick="deleteTask(${i})">🗑</span></td>

`

list.appendChild(row)

})

}


function deleteTask(i){

data[selectedDate].tasks.splice(i,1)

renderTasks()

updateTime()

saveDatabase()

}


function updateTime(){

let mins=data[selectedDate].tasks.reduce((a,b)=>a+b.minutes,0)

let panel=document.getElementById("sidePanel")

panel.classList.remove("panelPink","panelGreen","panelYellow")

if(mins===0){}

else if(mins<420) panel.classList.add("panelPink")

else if(mins===420) panel.classList.add("panelGreen")

else panel.classList.add("panelYellow")

document.getElementById("timeSummary").innerText=
"Logged: "+formatMinutes(mins)+" / 7h"

}


function updateCalendar(){

calendar.removeAllEvents()

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

})

updateAttendance()

}


function updateAttendance(){

let view=calendar.getDate()

let year=view.getFullYear()
let month=view.getMonth()

let first=new Date(year,month,1)
let last=new Date(year,month+1,0)

let wfo=0
let wfh=0
let half=0

for(let d=new Date(first);d<=last;d.setDate(d.getDate()+1)){

let key=d.toISOString().split("T")[0]

if(!data[key]) continue

let att=data[key].attendance

if(att==="wfo") wfo++

if(att==="wfh") wfh++

if(att==="half") half++

}

let denom=wfo+wfh+(half*0.5)

let pct=0

if(denom>0) pct=((wfo*100)/denom).toFixed(2)

document.getElementById("attendancePercent").innerText=pct+"%"

}
