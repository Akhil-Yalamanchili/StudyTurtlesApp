document.addEventListener('DOMContentLoaded', function() {
    let tasks = [];
    let calendarEvents = [];
    let calendar; 
    let db; 

    const firebaseConfig = {
        apiKey: "AIzaSyChTGhYEr5eOoJXlMmjz5-pQdVZdsObfuA",
        authDomain: "study-turtles-9ec95.firebaseapp.com",
        projectId: "study-turtles-9ec95",
        storageBucket: "study-turtles-9ec95.appspot.com",
        messagingSenderId: "457875965283",
        appId: "1:457875965283:web:30133a5652b85d0be7bf56"
      };
    firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();
    db = firebase.firestore();

    const calendarEl = document.getElementById('calendarView');
    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        events: calendarEvents,
        selectable: true,
        editable: true,
        eventDrop: function(info) {
            updateEvent(info.event);
        },
        eventResize: function(info) {
            updateEvent(info.event);
        }
    });

    calendar.render();
    calendar.updateSize();

    auth.onAuthStateChanged(user => {
        if (user) {
            document.getElementById('loginButton').textContent = 'Logout';
            document.getElementById('loginButton').onclick = logout;
            loadUserData(user);
        } else {
            document.getElementById('loginButton').textContent = 'Login';
            document.getElementById('loginButton').onclick = () => showSection('login');
        }
    });

    document.getElementById('loginForm').addEventListener('submit', function(event) {
        event.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        auth.signInWithEmailAndPassword(email, password)
            .then(userCredential => {
                alert('Login Successful!');
                showSection('input');
            })
            .catch(error => {
                alert('Login Failed: ' + error.message);
            });
    });

    document.getElementById('signupForm').addEventListener('submit', function(event) {
        event.preventDefault();
        const email = document.getElementById('emailSignup').value;
        const password = document.getElementById('passwordSignup').value;
        auth.createUserWithEmailAndPassword(email, password)
            .then(userCredential => {
                alert('Signup Successful! Please log in.');
                showSection('login');
            })
            .catch(error => {
                alert('Signup Failed: ' + error.message);
            });
    });

    document.getElementById('taskForm').addEventListener('submit', function(event) {
        event.preventDefault();
        const taskName = document.getElementById('taskName').value;
        const taskTime = parseInt(document.getElementById('taskTime').value);
        const taskType = document.getElementById('taskType').value;
        const taskDate = document.getElementById('taskDate').value;
    
       // alert(`Task Name: ${taskName}\nEstimated Time: ${taskTime} hours\nTask Type: ${taskType}\nDue Date/Test Date: ${taskDate}`);    
        const task = {
            id: generateId(),
            name: taskName,
            time: taskTime,
            type: taskType,
            date: taskDate
        };
        if (taskType === 'assignment') {
            scheduleAssignment(task);
        } else if (taskType === 'test') {
            scheduleTest(task);
        }
        addTaskToList(task);
        saveTasks();
        alert('Task Scheduled!');
        document.getElementById('taskForm').reset();
    });

    document.getElementById('settingsForm').addEventListener('submit', function(event) {
        event.preventDefault();
        const sidebarColor = document.getElementById('sidebarColor').value;
        const contentColor = document.getElementById('contentColor').value;
        const textColor = document.getElementById('textColor').value;

        document.querySelector('.sidebar').style.backgroundColor = sidebarColor;
        document.querySelector('.content').style.backgroundColor = contentColor;
        document.documentElement.style.setProperty('--text-color', textColor);

        saveSettings();
        alert('Settings Saved!');
    });

    // fun ctions
    window.showSection = function showSection(sectionId) {
        const sections = document.querySelectorAll('.section');
        sections.forEach(section => {
            section.style.display = 'none';
        });
        document.getElementById(sectionId).style.display = 'block';
        document.getElementById(sectionId).classList.add('active');
        if (sectionId === 'calendar') {
            calendar.render();
            calendar.updateSize();
        }
    }

    window.logout = function logout() {
        auth.signOut().then(() => {
            document.getElementById('loginButton').textContent = 'Login';
            showSection('login');
        });
    }

    function generateId() {
        return '_' + Math.random().toString(36).substr(2, 9);
    }

    function addTaskToList(task) {
        tasks.push(task);
        renderTaskList();
    }

    function renderTaskList() {
        const taskListView = document.getElementById('taskListView');
        taskListView.innerHTML = '';
        tasks.forEach(task => {
            const taskItem = document.createElement('div');
            taskItem.className = 'task-item';
            taskItem.innerHTML = `
            <div class="task-field">
                <label>Task Name:</label>
                <input type="text" value="${task.name}" data-id="${task.id}" data-field="name">
            </div>
            <div class="task-field">
                <label>Estimated Time (hours):</label>
                <input type="number" value="${task.time}" data-id="${task.id}" data-field="time" style="width: 50px;">
            </div>
            <div class="task-field">
                <label>Task Type:</label>
                <select data-id="${task.id}" data-field="type">
                    <option value="assignment" ${task.type === 'assignment' ? 'selected' : ''}>Assignment</option>
                    <option value="test" ${task.type === 'test' ? 'selected' : ''}>Test</option>
                </select>
            </div>
            <div class="task-field">
                <label>Due/Test Date:</label>
                <input type="datetime-local" value="${task.date}" data-id="${task.id}" data-field="date">
            </div>
            <div class="task-field">
                <button class="delete-task" data-id="${task.id}">Delete Task</button>
            </div>
             <div class="task-field">
                <button class="update-task" data-id="${task.id}">Update Task</button>
            </div>
        `;
            taskListView.appendChild(taskItem);
        });
    
        // Add event listeners for dynamically created elements
        taskListView.addEventListener('change', function(event) {
            const element = event.target;
            const taskId = element.getAttribute('data-id');
            const field = element.getAttribute('data-field');
            const value = field === 'time' ? parseInt(element.value) : element.value;
    
            const task = tasks.find(task => task.id === taskId);
            task[field] = value;
    
            calendar.getEvents().forEach(event => {
                if (event.id === taskId) {
                    event.remove();
                }
            });
            if (task.type === 'assignment') {
                scheduleAssignment(task);
            } else if (task.type === 'test') {
                scheduleTest(task);
            }
            saveTasks();
        });
    
        taskListView.addEventListener('click', function(event) {
            if (event.target.classList.contains('delete-task')) {
                const taskId = event.target.getAttribute('data-id');
                deleteTask(taskId);
            }
        });
        taskListView.addEventListener('click', function(event) {
            if (event.target.classList.contains('update-task')) {
                const taskId = event.target.getAttribute('data-id');
                updateTask(taskId);
            }
        });
    }
    
    function deleteTask(taskId) {
        tasks = tasks.filter(task => task.id !== taskId);
        calendar.getEvents().forEach(event => {
            if (event.id === taskId) {
                event.remove();
            }
        });
        renderTaskList();
        saveTasks();
    }

    function updateTask(element) {
        const taskId = element.getAttribute('data-id');
        const field = element.getAttribute('data-field');
        const value = field === 'time' ? parseInt(element.value) : element.value;

        const task = tasks.find(task => task.id === taskId);
        task[field] = value;

        calendar.getEvents().forEach(event => {
            if (event.id === taskId) {
                event.remove();
            }
        });
        if (task.type === 'assignment') {
            scheduleAssignment(task);
        } else if (task.type === 'test') {
            scheduleTest(task);
        }
        saveTasks();
    }

    function saveTasks() {
        const user = auth.currentUser;
        if (user) {
            db.collection('users').doc(user.uid).set({
                tasks: tasks
            }, { merge: true });
    
            const calendarEvents = calendar.getEvents().map(event => ({
                id: event.id,
                title: event.title,
                start: event.start.toISOString(),
                end: event.end.toISOString(),
                color: event.backgroundColor
            }));
    
            db.collection('users').doc(user.uid).set({
                events: calendarEvents
            }, { merge: true });
        }
    }

    function loadUserData(user) {
        db.collection('users').doc(user.uid).get().then((docSnapshot) => {
            if (docSnapshot.exists) {
                const data = docSnapshot.data();
    
                tasks = data.tasks || [];
                renderTaskList();
    
                calendar.getEvents().forEach(event => event.remove());

                tasks.forEach(task => addTaskToCalendar(task));

                db.collection('users').doc(user.uid).collection('customFreeTime').get().then(snapshot => {
                    snapshot.forEach(doc => {
                        const freeTimeData = doc.data();
                        calendar.addEvent({
                            start: freeTimeData.start,
                            end:freeTimeData.end,
                            title: "Free Time",
                            color: "#d1f7c4",
                            isFreeTime: true
                        });
                    });
                });
    
                const calendarEvents = data.events || [];
                calendarEvents.forEach(eventData => {
                    calendar.addEvent({
                        id: eventData.id,
                        title: eventData.title,
                        start: eventData.start,
                        end: eventData.end,
                        color: eventData.color
                    });
                });
    
                const settings = data.settings || {};
                document.getElementById('sidebarColor').value = settings.sidebarColor || '#cfecec';
                document.getElementById('contentColor').value = settings.contentColor || '#e0f7fa';
                document.getElementById('textColor').value = settings.textColor || '#000000';
                document.querySelector('.sidebar').style.backgroundColor = settings.sidebarColor || '#cfecec';
                document.querySelector('.content').style.backgroundColor = settings.contentColor || '#e0f7fa';
                document.querySelector('.defaultStartTime').value = settings.defaultStartTime || '#e0f7fa';
                document.querySelector('.defaultStartTime').value = settings.defaultEndTime || '17:00';
            }
        });
    }
    function addTaskToCalendar(task) {
        let eventColor = task.type === 'assignment' ? '#4db6ac' : '#ffcc80'; 
    
        calendar.addEvent({
            id: task.id,
            title: task.name,
            start: new Date(task.date),
            end: new Date(new Date(task.date).getTime() + task.time * 60 * 60 * 1000), 
            color: eventColor
        });
    }

    calendar.on('select', function(info) {
        const event = calendar.addEvent({
            start: info.start,
            end: info.end,
            title: "Free Time",
            color: "#d1f7c4", // A unique color for free time
            isFreeTime: true // Custom property to identify free time blocks
        });
    
        // Save this custom free time block to Firestore
        const user = auth.currentUser;
        if (user) {
            db.collection('users').doc(user.uid).collection('customFreeTime').add({
                start: info.start.toISOString(),
                end: info.end.toISOString(),
                isFreeTime: true
            });
        }
    });
    
    function saveSettings() {
        const user = auth.currentUser;
        if (user) {
            const settings = {
                sidebarColor: document.getElementById('sidebarColor').value,
                contentColor: document.getElementById('contentColor').value,
                textColor: document.getElementById('textColor').value,
                defaultStartTime: document.getElementById('defaultStartTime').value,
                defaultEndTime: document.getElementById('defaultEndTime').value,

            };
            db.collection('users').doc(user.uid).set({
                settings: settings
            }, { merge: true });
        }
    }

    function scheduleAssignment(task) {
        let totalHours = task.time;
        const dueDate = new Date(task.date);
        let currentDate = new Date();
    
        while (totalHours > 0 && currentDate < dueDate) {
            const freeBlocks = getFreeTimeBlocks(currentDate);
            // Try to fit task into each free time block without scheduling too many consecutive hours
            for (const block of freeBlocks) {
                let blockStart = new Date(block.start);
                while (blockStart < block.end && totalHours > 0) {
                    const endOfHour = new Date(blockStart);
                    endOfHour.setHours(blockStart.getHours() + 1);
                    if (!hasEventConflict(blockStart, endOfHour) && totalHours > 0) {
                        calendar.addEvent({
                            id: task.id,
                            title: task.name,
                            start: blockStart.toISOString(),
                            end: endOfHour.toISOString(),
                            color: "#4db6ac"
                        });
                        totalHours -= 1;
                        // Avoid burnout by skipping consecutive days if more than 2 hours remain
                        if (totalHours > 2) break;
                    }
    
                    blockStart = endOfHour;
                }
                if (totalHours <= 0) break;
            }
    
            currentDate.setDate(currentDate.getDate() + 1);
        }
    }
    
function animateText() {
    // Function to animate the text "What will you create today?"
    const animatedTextElement = document.getElementById('animatedText');
    animatedTextElement.textContent = "What will you create today?";
    animatedTextElement.style.animationPlayState = 'paused';
    setTimeout(() => {
        animatedTextElement.style.animationPlayState = 'running';
    }, 0);
}
    // Helper function to get free time blocks
    function getFreeTimeBlocks(date) {
        // First, look for custom blocks for this specific day
        const customBlocks = calendar.getEvents().filter(event =>
            event.extendedProps.isFreeTime && sameDay(event.start, date)
        );
    
        if (customBlocks.length > 0) return customBlocks;
        // Otherwise, fall back to default free time
        const settings = getCurrentUserSettings();
        if (settings.defaultStartTime && settings.defaultEndTime) {
            const startTime = new Date(date);
            const endTime = new Date(date);
            startTime.setHours(...settings.defaultStartTime.split(':'));
            endTime.setHours(...settings.defaultEndTime.split(':'));
            return [{ start: startTime, end: endTime }];
        }
        return [];
    }
    function getCurrentUserSettings() {
        const user = auth.currentUser;
        if (user) {
            return db.collection('users').doc(user.uid).get().then(doc => {
                if (doc.exists) {
                    return doc.data().settings || {};
                } else {
                    console.log("No settings found for user.");
                    return {};
                }
            }).catch(error => {
                console.error("Error getting user settings:", error);
                return {};
            });
        } else {
            console.log("No user is currently signed in.");
            return Promise.resolve({});
        }
    }
    function scheduleTest(task) {
        const totalHours = task.time;
        const dueDate = new Date(task.date);
        const learningHours = Math.floor(totalHours * 0.3);
        const studyHours = Math.floor(totalHours * 0.5);
        const practiceHours = totalHours - learningHours - studyHours;

        const sessions = [
            { title: `${task.name} - Learning`, hours: learningHours, color: '#ffcc80' },
            { title: `${task.name} - Study`, hours: studyHours, color: '#ffab40' },
            { title: `${task.name} - Practice Test`, hours: practiceHours, color: '#ff9100' }
        ];

        let currentDate = new Date();
        const practiceTestStartDate = new Date(dueDate);
        practiceTestStartDate.setDate(practiceTestStartDate.getDate() - 3);

        sessions.forEach(session => {
            let hoursLeft = session.hours;
            let startDate = currentDate;

            while (hoursLeft > 0 && currentDate < dueDate) {
                const startOfDay = new Date(startDate);
                startOfDay.setHours(9, 0, 0, 0);
                const endOfDay = new Date(startDate);
                endOfDay.setHours(17, 0, 0, 0);

                for (let hour = 9; hour < 17 && hoursLeft > 0; hour++) {
                    const startDateTime = new Date(startDate);
                    startDateTime.setHours(hour, 0, 0, 0);
                    const endDateTime = new Date(startDateTime.getTime());
                    endDateTime.setHours(startDateTime.getHours() + 1);

                    if (!hasEventConflict(startDateTime, endDateTime)) {
                        const event = {
                            id: task.id,
                            title: session.title,
                            start: startDateTime.toISOString(),
                            end: endDateTime.toISOString(),
                            color: session.color
                        };
                        calendar.addEvent(event);
                        calendarEvents.push(event);
                        hoursLeft -= 1;
                        if (session.title.includes('Study') && hoursLeft > 1) break; 
                    }
                }
                if (session.title.includes('Practice Test')) {
                    startDate.setDate(startDate.getDate() + 1); 
                } else {
                    startDate.setDate(startDate.getDate() + 2); 
                }
            }
        });
    }

    function hasEventConflict(startDate, endDate) {
        return calendar.getEvents().some(event => {
            return (startDate < new Date(event.end) && endDate > new Date(event.start) && !event.extendedProps.isFreeTime);
        });
    }

    function updateEvent(event) {
        const updatedEvent = calendarEvents.find(e => e.id === event.id);
        if (updatedEvent) {
            updatedEvent.start = event.start.toISOString();
            updatedEvent.end = event.end.toISOString();
        }
    }

    const messageArea = document.getElementById("messageArea");
    const chatInput = document.getElementById("chatInput");
    const sendButton = document.getElementById("sendButton");

    function addMessage(message, sender) {
        const messageElement = document.createElement("div");
        messageElement.style.padding = "10px";
        messageElement.style.margin="5px";
        messageElement.style.color = "white";


        if (sender === "user") {
            messageElement.style.textAlign = "right";
            messageElement.style.backgroundColor = "rgb(72, 101, 120)";

        } else {
            messageElement.style.textAlign = "left";
            messageElement.style.backgroundColor = "rgb(60, 80, 90)";

        }
        messageElement.textContent = message;
        messageArea.appendChild(messageElement);
        messageArea.scrollTop = messageArea.scrollHeight;
    }

    async function sendMessagetoAI(userMessage) {
        addMessage(userMessage, "user");
        chatInput.value = "";

<<<<<<< HEAD
       // try {
       //     const response = await fetch("https://api.openai.com/v1/chat/completions", {
          //      method: "POST",
        //        headers: {
       //             "Content-Type": "application/json",
=======
        try {
            const response = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
>>>>>>> 6e3aba7 (fixes)
                
      //          },
        //        body: JSON.stringify({
        //            model: "gpt-4o-mini-2024-07-18",
        //            messages: [
       //                 { role:"system", content: "You are a helpful and friendly AI turtle who assists with studying. You know this user's habits, and are trying to help them learn and plan their studying in an optimal way to maximize their learning."},
         //               { role: "user", content: userMessage}
           //         ]
             //   })
  //          });
    //        const data = await response.json();
      //      const aiMessage = data.choices[0].message.content;

        //    addMessage(aiMessage, "turtle");
        //} catch (error) {
          //  alert("Error communicating with OpenAI API: ", error);
      //      alert(error);
       //     addMessage("Oops! Something went wront. Please try again.", "turtle");
      //  }
    }

    sendButton.addEventListener("click", () => {
        const userMessage = chatInput.value.trim();
        if (userMessage) {
            sendMessagetoAI(userMessage);
        }
    });

    chatInput.addEventListener("keypress", (event) => {
        if (event.key === "Enter") {
            const userMessage = chatInput.value.trim();
            if (userMessage) {
                sendMessagetoAI(userMessage);
            }
        }
    });

});