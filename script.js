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

function openPanel(){

document.getElementById("panelDate").innerText=selectedDate

if(!data[selectedDate]){

let day=new Date(selectedDate).getDay()

let attendance="wfh"

if(day===0||day===6){
attendance="holiday"
}

data[selectedDate]={attendance:attendance,tasks:[]}

persist()

}

document.getElementById("attendanceSelect").value=data[selectedDate].attendance

renderTasks()
updateTimeSummary()

}

document.getElementById("attendanceSelect").addEventListener("change",function(){

if(!selectedDate)return

data[selectedDate].attendance=this.value

persist()

updateCalendar()

})

function parseTime(input){

input=input.toLowerCase().trim()

let hours=0
let minutes=0

let hMatch=input.match(/(\d+)\s*h/)
let mMatch=input.match(/(\d+)\s*m/)

if(hMatch) hours=parseInt(hMatch[1])
if(mMatch) minutes=parseInt(mMatch[1])

if(!hMatch && !mMatch){
minutes=parseInt(input)
}

return (hours*60)+minutes

}

function formatMinutes(minutes){

let h=Math.floor(minutes/60)
let m=minutes%60

return h+"h "+m+"m"

}

function addTask(){

let name=document.getElementById("taskName").value
let time=document.getElementById("taskTime").value

if(!name||!time)return

let minutes=parseTime(time)

data[selectedDate].tasks.push({name:name,minutes:minutes})

document.getElementById("taskName").value=""
document.getElementById("taskTime").value=""

persist()

renderTasks()
updateTimeSummary()
updateCalendar()

}

function renderTasks(){

let list=document.getElementById("taskList")
list.innerHTML=""

data[selectedDate].tasks.forEach((t,index)=>{

let row=document.createElement("tr")

row.innerHTML=`
<td>${t.name}</td>
<td>${formatMinutes(t.minutes)}</td>
<td>
<span class="iconBtn" onclick="editTask(${index})">✏️</span>
<span class="iconBtn" onclick="deleteTask(${index})">🗑️</span>
</td>
`

list.appendChild(row)

})

}

function deleteTask(index){

data[selectedDate].tasks.splice(index,1)

persist()

renderTasks()
updateTimeSummary()
updateCalendar()

}

function editTask(index){

let task=data[selectedDate].tasks[index]

let newName=prompt("Task name",task.name)
let newTime=prompt("Time (example 2h 30m)",formatMinutes(task.minutes))

if(!newName||!newTime)return

task.name=newName
task.minutes=parseTime(newTime)

persist()

renderTasks()
updateTimeSummary()
updateCalendar()

}

function updateTimeSummary(){

let tasks=data[selectedDate].tasks

let minutes=tasks.reduce((a,b)=>a+b.minutes,0)

let remaining=420-minutes
if(remaining<0) remaining=0

document.getElementById("timeSummary").innerText=
"Logged: "+formatMinutes(minutes)+" | Remaining: "+formatMinutes(remaining)

}

function renderWeekends(){

let view=calendar.view
let start=new Date(view.currentStart)
let end=new Date(view.currentEnd)

for(let d=new Date(start);d<=end;d.setDate(d.getDate()+1)){

let day=d.getDay()

if(day===0||day===6){

let dateStr=d.toISOString().split("T")[0]

calendar.addEvent({
start:dateStr,
display:"background",
backgroundColor:"#e6e6e6"
})

}

}

}

function updateCalendar(){

calendar.removeAllEvents()

renderWeekends()

Object.keys(data).forEach(date=>{

let entry=data[date
