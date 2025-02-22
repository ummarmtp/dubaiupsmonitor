const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
// MongoDB connection
  mongoose.connect("mongodb+srv://ummarrahil:06031998Rahil@cluster0.7baglhg.mongodb.net/dubaiups?retryWrites=true&w=majority&appName=Cluster0").then(()=>{
  //mongoose.connect("mongodb://127.0.0.1:27017/dubaiups").then(()=>{
  console.log("mongodb connected")
  initializeData();
}).catch((error)=>console.log(error));

// Define schema and model
const deviceData = new mongoose.Schema({
  battery: String,
  id:String,
  gateOpenCount:String,
  status: String,
  lastonline: String,
  lastDate:Date
}

);

const historySchema = new mongoose.Schema({
  battery: String,
  gateOpenCount: String,
  timestamp: Date
});

const userModel=mongoose.model("data",deviceData);
const historyModel = mongoose.model("history", historySchema);

const { time } = require('console');
process.env.TZ = 'Asia/Dubai'
'Asia/Dubai'

var secound = new Array(2).fill(0);
var lastseen = new Array(2).fill(new Date());

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const port = 3000;

app.use(bodyParser.json()); 
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));
let sensorData =[ {

  battery:"3",
  id:"0",
  gateOpenCount: "4",
  status:"OFFLINE",
  lastonline:"",
  lastDate:new Date()
}];

var m=true;

app.post('/data', async (req, res) => {
  console.log(req.body);
  if (req.body.battery !== undefined) 
    {
    sensorData[0].battery = req.body.battery;
    sensorData[0].gateOpenCount = req.body.gateOpenCount;
    m=false;
    secound[0]=0;
    lastseen[0]=new Date();
    sensorData[0].lastDate=lastseen[0];
    sensorData[0].lastonline=dateAndtimeString();
    sensorData[0].status="Online";
    
    
    //const newSensorData = new userModel(sensorData);
    await userModel.updateOne({id:"0"},{ $set: sensorData[0]}, { upsert: true });
    await historyModel.create({
      id: "0",
      battery: req.body.battery,
      gateOpenCount: req.body.gateOpenCount,
      timestamp: new Date()
  });
    
  }
  else
  {
    console.log("interrupt");
  }

  
  io.emit('updateData', sensorData);
  res.send('Data received');
});

app.get('/', async(req, res) => {
  res.render('index', { data: sensorData });
});
app.get('/user', async(req, res) => {
  const data=await userModel.find();
  res.json(data);
});

app.get('/history', async (req, res) => {
  const history = await historyModel.find().sort({ timestamp: 1 });
  res.json(history);
});



setInterval(updateLastseen, 20000);
setInterval(secCount, 20000);
async function secCount()
{
  
    secound[0]++;

  
  
}



async function updateLastseen()
{
 
 
    console.log();
    if(secound[0]>=1)
      {
        console.log("hello");
        console.log(secound[0]);
        secound[0]=2;
        sensorData[0].status ="Offline";
        sensorData[0].lastonline=dateAndtimeString();
        sensorData[0].lastDate=lastseen[0];
      }
      else
      {
        sensorData[0].status = "Online";
        sensorData[0].lastonline=dateAndtimeString();
        sensorData[0].lastDate=lastseen[0];
      }
      
      await userModel.updateOne( {id:"0"},{ $set: sensorData[0] }, { upsert: true });
  
 
  io.emit('updateData', sensorData);
  //await userModel.updateMany({}, { $set: sensorData }, { upsert: true });
  console.log(sensorData);
  //
} 

function strLen(data) {
  var value=data.toString().length;
  if(value==1)
  {
      return "0"+data
  }
  else{
      return data
  }
}

function dateAndtimeString()
{
       var day1 = lastseen[0].getDate();
       var month1 = lastseen[0].getMonth();
       var year1 = lastseen[0].getFullYear();
       var hour1 = lastseen[0].getHours();
       var min1 = lastseen[0].getMinutes();
       var sec1 = lastseen[0].getSeconds();
      day1=strLen(day1);
      month1=month1+1;
     month1= strLen(month1);
     min1=strLen(min1);
      hour1=strLen(hour1);
      sec1=strLen(sec1);
      var output=hour1 + ":" + min1+":" +  "  " + day1 + "/" +month1  + "/" + year1;
      return output;
}


io.on('connection', (socket) => {
  console.log('New client connected');
  socket.emit('updateData', sensorData); // Send the initial data to the new client
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });  
});

async function initializeData() {
  const latestData = await userModel.find({}, {}, { sort: { 'createdAt': -1 } });
  if (latestData) {
    
    sensorData = latestData.map(doc => doc.toObject());
    
    {
      lastseen[0]=sensorData[0].lastDate;
      if(sensorData.status=="Offline")
      {
        secound[0]=2;
      }
      else{
        secound[0]=0;
      }
    }
    console.log(sensorData);
  } else { 
    console.log("No data found in MongoDB. Using default values.");
  }
  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}


