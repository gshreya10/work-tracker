let calendar
let selectedDate=null

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

})

function openPanel(){

document.getElementById("panelDate").innerText=selectedDate

if(!data[selectedDate]){

let day=new Date(selectedDate).getDay()

let attendance="wfh"

if(day===0 || day===6){

attendance="holiday"

}

data[selectedDate]={

attendance:attendance,
tasks:[]

}

}

document.getElementById("attendanceSelect").value=data[selectedDate].attendance

renderTasks()

updateTimeSummary()

}

function addTask(){

let name=document.getElementById("taskName").value
let minutes=parseInt(document.getElementById("taskMinutes").value)

if(!name || !minutes)return

data[selectedDate].tasks.push({

name:name,
minutes:minutes

})

document.getElementById("taskName").value=""
document.getElementById("taskMinutes").value=""

renderTasks()
updateTimeSummary()

}

function renderTasks(){

let list=document.getElementById("taskList")

list.innerHTML=""

data[selectedDate].tasks.forEach(t=>{

let div=document.createElement("div")

div.innerText=t.name+" ("+t.minutes+"m)"

list.appendChild(div)

})

}

function updateTimeSummary(){

let tasks=data[selectedDate].tasks

let minutes=tasks.reduce((a,b)=>a+b.minutes,0)

let hours=(minutes/60).toFixed(1)

let remaining=(420-minutes)/60

remaining=remaining.toFixed(1)

document.getElementById("timeSummary").innerText=

"Logged: "+hours+"h | Remaining: "+remaining+"h"

}

function saveDay(){

data[selectedDate].attendance=document.getElementById("attendanceSelect").value

updateCalendar()

}

function updateCalendar(){

calendar.removeAllEvents()

Object.keys(data).forEach(date=>{

let entry=data[date]

let color=""

if(entry.attendance==="wfo") color="green"
if(entry.attendance==="leave") color="red"
if(entry.attendance==="holiday") color="grey"

if(color){

calendar.addEvent({

start:date,
display:"background",
backgroundColor:color

})

}

let minutes=entry.tasks.reduce((a,b)=>a+b.minutes,0)

if(minutes>0){

calendar.addEvent({

title:(minutes/60).toFixed(1)+"h",
start:date

})

}

})

updateAttendance()

}

function updateAttendance(){

let wfo=0
let wfh=0

Object.values(data).forEach(d=>{

if(d.attendance==="wfo") wfo++
if(d.attendance==="wfh") wfh++

})

let percent=0

if(wfo+wfh>0){

percent=Math.round((wfo/(wfo+wfh))*100)

}

document.getElementById("attendancePercent").innerText=percent+"%"

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
