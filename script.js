let calendar
let selectedDate

let data={}

document.addEventListener("DOMContentLoaded",function(){

const calendarEl=document.getElementById("calendar")

calendar=new FullCalendar.Calendar(calendarEl,{

initialView:"dayGridMonth",

dateClick:function(info){

selectedDate=info.dateStr

openModal()

}

})

calendar.render()

})

function openModal(){

document.getElementById("taskModal").style.display="block"

document.getElementById("modalDate").innerText=selectedDate

if(!data[selectedDate]){

data[selectedDate]={

attendance:"wfh",

tasks:[]

}

}

renderTasks()

}

function closeModal(){

document.getElementById("taskModal").style.display="none"

}

function addTask(){

let name=document.getElementById("taskName").value
let minutes=parseInt(document.getElementById("taskMinutes").value)

data[selectedDate].tasks.push({

name:name,
minutes:minutes

})

renderTasks()

}

function renderTasks(){

let list=document.getElementById("taskList")

list.innerHTML=""

data[selectedDate].tasks.forEach(t=>{

let div=document.createElement("div")

div.className="task"

div.innerText=t.name+" "+t.minutes+"m"

list.appendChild(div)

})

}

function saveDay(){

data[selectedDate].attendance=document.getElementById("attendance").value

updateCalendar()

closeModal()

}

function updateCalendar(){

calendar.removeAllEvents()

Object.keys(data).forEach(date=>{

let entry=data[date]

let color=""

if(entry.attendance==="wfo") color="green"
if(entry.attendance==="leave") color="red"
if(entry.attendance==="holiday") color="grey"

let minutes=entry.tasks.reduce((a,b)=>a+b.minutes,0)

let hours=Math.round(minutes/60*10)/10

calendar.addEvent({

start:date,
display:"background",
backgroundColor:color

})

calendar.addEvent({

title:hours+"h",
start:date

})

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
minutes:t.minutes

})

})

})

let ws=XLSX.utils.json_to_sheet(rows)

let wb=XLSX.utils.book_new()

XLSX.utils.book_append_sheet(wb,ws,"Work")

XLSX.writeFile(wb,"work_log.xlsx")

}
