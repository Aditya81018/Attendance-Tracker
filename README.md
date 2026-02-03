# Attendance Tracker *(Prototype)*

### Components
1. Esp32 + Expansion Board
2. RFID Scanner × 2
3. IR Sensor × 2
4. Breadboard
5. Buzzer
6. Jumper Wires

---
### Problem
Teachers have to manually take attendance of students of each section for every class, every day.

---
### Proposed Solution
Every classroom will have this system at their doors -
1. **Outdoor RFID Scanner** - A RFID Scanner outside the classroom
2. **Indoor RFID Scanner** - A RFID Scanner Inside the classroom
3. **Motion Detection System (MDS)** - A set of sensors which classifies any kind of motion in three categories - 
	1. **Indoor** - Someone moving inside the classroom 
	2. **Outdoor** - Someone moving outside the classroom
	3. NULL - Any kind of motion detected that is neither **Indoor** or **Outdoor**
4. Feedback System - This system currently only has a buzzer, with two modes mentioned below, but if budget may allow there can also be a screen for better user experience and feedbacks.
	1. Beep - for success feedback
	2. Buzz - for warning / alarm feedback

Every student's id has a unique rfid.

Before entering classroom a student must scan his id card on the **Outdoor RFID Scanner**. Within certain timespan after the scan if any **Indoor** motion is detected by **MDS**, the scanned student will be marked to have entered the classroom at the time of scan.

Before leaving classroom a student must scan his id card on the **Indoor RFID Scanner**. Within certain timespan after the scan if any **Outdoor** motion is detected by MDS, the scanned student will be marked to have left the classroom at the time of scan.

The system will compare every student's in and out timings to their section's routine of the day, given in their timetable, and mark their attendance for the classes they were recorded to be in the class.

Any ill uses detected by the system, for example a student's id being scanned that is expected to be already in a classroom or any trespassing without scan, will be recorded as a violation and notified to the administrators

The system will have several scanners and a single server to which every scanner will send data to. The server will then process the data, make calculation and store then in a database for later to be accessed by client sides.

The system will have a admin client side software to make changes to the records and data if needed by the administration.

The system will have a students client side software to display every student their attendance record and other details.

A institute can have several sections, each sections will have their timetable with classes for each day, each class can have their own rooms and each room can have several doors. The full and final version of this project must take all of this in account.

---

### What the prototype covers so far 
The prototype covers -
1. Outdoor RFID Scanner
2. Indoor RFID Scanner 
3. MDS - A pair of IR Sensors with an algorithm to classify the detected motions into the required categories 
4. Feedback System - A buzzer

This prototype is meant to track in and out timings of the 4 imaginary students - Green, Purple, Yellow and Orange. There is only one section, one room with only one door and no classes. 

This prototype records when a student enters and when a student leaves and calculates the total duration a student stayed in the room.

The codebase so far has code for -
1. Scanner System - including both RFID Scanners, MDS and feedback system. This sends all the detected motion to the server
2. Server - the main brain, here the data from the scanner gets processed and becomes meaningful. The server also provide endpoints for client to access the data, including an endpoint to establish a websocket connection so the client can see the data from scanner and server in realtime
3. Client - a simple user interface for admin to view the how the entire system is working and the datas that are being recorded.

---
### Future goals for the prototype 
1. Store a timetable and give proper attendance record for every student showing all the classes it attended.
2. Have several sections, with their own timetable, with several classes in their own rooms, having several doors and scanner sets working together on one server.
3. Give more control on the client side the adminstrate the system better with more control.