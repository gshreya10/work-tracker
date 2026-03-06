const repoOwner="gshreya10"
const repoName="work-tracker"
const filePath="data/worklog.json"

const githubToken="YOUR_NEW_TOKEN"

let calendar
let selectedDate=null
let data={}
let fileSHA=null


document.addEventListener("DOMContentLoaded",async function(){

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

selectedDate=info.dateStr
openPanel()

}

})

await loadDatabase()

calendar.render()

updateCalendar()

document.getElementById("attendanceSelect")
.addEventListener("change",attendanceChanged)

})



async function loadDatabase(){

const url=`https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}`

const res=await fetch(url)
const file=await res.json()

fileSHA=file.sha

data=JSON.parse(atob(file.content))

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

document.getElementById("noSelection").style.display="none"
document.getElementById("dayDetails").style.display="block"

document.getElementById("panelDate").innerText=selectedDate

if(!data[selectedDate]){

let d=new Date(selectedDate).getDay()

let att="wfh"

if(d===0||d===6){
att="holiday"
}

data[selectedDate]={attendance:att,tasks:[]}

}

document.getElementById("attendanceSelect").value=data[selectedDate].attendance

renderTasks()
updateTime()

}



function attendanceChanged(){

if(!selectedDate) return

data[selectedDate].attendance=this.value

updateCalendar()
saveDatabase()

}



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

})

renderDayProgress()

updateAttendance()

updateMonthSummary()

}



function renderDayProgress(){

let cells=document.querySelectorAll(".fc-daygrid-day")

cells.forEach(cell=>{

let date=cell.getAttribute("data-date")

if(!data[date]) return

let mins=data[date].tasks.reduce((a,b)=>a+b.minutes,0)

if(mins===0) return

let el=document.createElement("div")

el.className="dayProgress"

el.innerText=formatMinutes(mins)+" / 7h"

if(mins<420) el.classList.add("progressLow")
else if(mins===420) el.classList.add("progressGood")
else el.classList.add("progressOver")

cell.querySelector(".fc-daygrid-day-frame").appendChild(el)

})

}



function updateAttendance(){

let view=calendar.getDate()

let year=view.getFullYear()
let month=view.getMonth()

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



function updateMonthSummary(){

let view=calendar.getDate()

let year=view.getFullYear()
let month=view.getMonth()

let first=new Date(year,month,1)
let last=new Date(year,month+1,0)

let totalMinutes=0
let workingDays=0

for(let d=new Date(first);d<=last;d.setDate(d.getDate()+1)){

let day=d.getDay()

let key=d.toISOString().split("T")[0]

if(day!==0 && day!==6){
workingDays++
}

if(data[key]){
totalMinutes+=data[key].tasks.reduce((a,b)=>a+b.minutes,0)
}

}

let expected=workingDays*420
let diff=totalMinutes-expected

document.getElementById("totalLogged").innerText=
"Logged: "+formatMinutes(totalMinutes)

document.getElementById("expectedHours").innerText=
"Expected: "+formatMinutes(expected)

document.getElementById("hourDifference").innerText=
"Difference: "+formatMinutes(diff)

}
