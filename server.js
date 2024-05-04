import express from "express";
import axios from "axios";
import bodyParser from "body-parser";
import dotenv from "dotenv";

dotenv.config();
const app = express();
const port = 3000;
const API_KEY = process.env.API_KEY;

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: false }));

app.get("/", (req, res)=>{
    res.render("index.ejs");
});

app.post("/submit", async (req, res)=>{
    const cityName = req.body.city;

    try{
        const response = await axios.get(`http://api.openweathermap.org/geo/1.0/direct?q=${cityName}&appid=${API_KEY}`);
        const lat = response.data[0].lat;
        const long = response.data[0].lon; 
        const response2 = await axios.get(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${long}&appid=${API_KEY}`);
        console.log(response2.data);
        
        const timeStampInMilliSeconds = response2.data.dt * 1000;
        
        const sunriseDate = new Date(response2.data.sys.sunrise * 1000);
        const sunriseTime = new Date(sunriseDate.getTime() + response2.data.timezone*1000);
        const sunrise = sunriseTime.toISOString().split("T")[1].split(".")[0];
        
        //_____________________________________________________________
        //Sunset
        const sunsetDate = new Date(response2.data.sys.sunset * 1000);
        const sunsetTime = new Date(sunsetDate.getTime() + response2.data.timezone*1000);
        const sunset = sunsetTime.toISOString().split("T")[1].split(".")[0];
        

        //_______________________________________________________________
        //Current time
        const dateObj = new Date();
        const timezoneOffsetInMs = 1000 * response2.data.timezone ;
        const newDateTime = new Date(dateObj.getTime() + timezoneOffsetInMs);
        const currentTime = newDateTime.toISOString().split("T")[1].split(".")[0];


        //_________________________________________________________________
        //Generating background image based on whether it is day or night and the 
        //condition

        const sunriseHour = parseInt(sunrise.split(":")[0]);

        const sunsetHour = parseInt(sunset.split(":")[0]);
        
        const currentHour = parseInt(currentTime.split(":")[0]);

        const backgroundImage = currentHour >= sunriseHour && currentHour < sunsetHour ? `${response2.data.weather[0].description}_day.png` : `${response2.data.weather[0].description}_night.png`;

        //_________________________________________________________________
        
        const date = new Date(timeStampInMilliSeconds);
        
        const currentDate = `${date.toLocaleString('default', { month: 'long' })} ${date.getDate()} ${date.getFullYear()}`;
        const weekDays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
        const currentDay = weekDays[date.getDay()];
        const celsiusDeg = Math.round(response2.data.main.temp - 273.15); 
        const fehrenheitDeg = `${Math.round((celsiusDeg*9/5) + 32)}\u00B0F`;  

        const weatherData = {
            location: response2.data.name,
            dateTime: currentDate,
            weekDay: currentDay,
            celsiusDeg: `${celsiusDeg}\u00B0C`,
            fehrenheitDeg: fehrenheitDeg,
            weatherCondition: response2.data.weather[0].description,
            humidity: response2.data.main.humidity,
            windSpeed: `${response2.data.wind.speed} m/s`,
            icon: `http://openweathermap.org/img/wn/${response2.data.weather[0].icon}.png`,
            currentTime: currentTime,
            backgroundImage: backgroundImage
        };

        res.render("index.ejs", {content: weatherData});

       
    }catch(error){
        console.error(error);
        
        res.render("index.ejs", {content: "The city name you provided couldn't be found!"})
    }
});


app.listen(port, ()=>{
    console.log(`Server running on port ${port}`);

});