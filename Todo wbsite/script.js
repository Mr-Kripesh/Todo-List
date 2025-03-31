const inputBox =document.getElementById("input-box");
const listContainer =document.getElementById("list-container");

//Code to let user add task
function addTask(){
    if(inputBox.value === ''){
        alert("You must write something!");
    }
    else{
        let li = document.createElement("li");
        li.innerHTML = inputBox.value;
        listContainer.appendChild(li);
        let span = document.createElement("span");
        span.innerHTML = "\u00d7"
        li.appendChild(span);
    }
    inputBox.value = "";
    saveData();
}


// check/ Uncheck the task 
listContainer.addEventListener("click", function(e){
    if(e.target.tagName ==="LI"){
        e.target.classList.toggle("checked");
        saveData();
    }
    else if(e.target.tagName === "SPAN"){
        e.target.parentElement.remove();
        saveData();
    }
}, false);


// function to save data in local storage so that it will be back again
function saveData(){
    localStorage.setItem("data",listContainer.innerHTML);
}

// function to show task stored in local storage
function showTask(){
    listContainer.innerHTML = localStorage.getItem("data");
}


//Showing the task 
showTask();